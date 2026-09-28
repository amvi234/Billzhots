from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from google.genai import errors as genai_errors
from shared.constants.bills import BillCategory, BillProcessingStatus

from .exceptions import ExtractionError
from .extraction import extract_bill_details
from .models import BillExtraction
from .models import Bill
from .tasks import extract_bill_details_task

PDF_BYTES = b"%PDF-1.4 fake pdf bytes"


def make_response(**overrides):
    fields = {
        "total_amount": 1249.5,
        "vendor": "Blue Tokai Coffee",
        "bill_date": "2026-09-14",
        "category": BillCategory.DINING,
        "confident": True,
    }
    fields.update(overrides)

    class FakeResponse:
        parsed = BillExtraction(**fields)

    return FakeResponse()


def quota_error(quota_id):
    """A 429 shaped like the one Gemini returns when a quota is exhausted."""
    return genai_errors.ClientError(
        429,
        {
            "error": {
                "code": 429,
                "status": "RESOURCE_EXHAUSTED",
                "message": "You exceeded your current quota.",
                "details": [
                    {
                        "@type": "type.googleapis.com/google.rpc.QuotaFailure",
                        "violations": [{"quotaId": quota_id, "quotaValue": "20"}],
                    },
                    {
                        "@type": "type.googleapis.com/google.rpc.RetryInfo",
                        "retryDelay": "53.844235298s",
                    },
                ],
            }
        },
    )


class ExtractionTests(TestCase):
    @override_settings(GEMINI_API_KEY="test-key")
    @patch("bill_manager.extraction.get_client")
    def test_extracts_and_cleans_fields(self, get_client):
        get_client.return_value.models.generate_content.return_value = make_response()

        details = extract_bill_details(PDF_BYTES, "application/pdf")

        self.assertEqual(details["amount"], Decimal("1249.50"))
        self.assertEqual(details["vendor"], "Blue Tokai Coffee")
        self.assertEqual(details["category"], "dining")
        self.assertEqual(str(details["bill_date"]), "2026-09-14")

    @override_settings(GEMINI_API_KEY="test-key")
    @patch("bill_manager.extraction.get_client")
    def test_sends_bytes_with_correct_mime_type(self, get_client):
        generate = get_client.return_value.models.generate_content
        generate.return_value = make_response()

        # "image/jpg" is a non-standard alias browsers send; it must be normalized.
        extract_bill_details(PDF_BYTES, "image/jpg")

        part = generate.call_args.kwargs["contents"][0]
        self.assertEqual(part.inline_data.mime_type, "image/jpeg")
        self.assertEqual(part.inline_data.data, PDF_BYTES)

    def test_rejects_unsupported_type(self):
        with self.assertRaises(ExtractionError):
            extract_bill_details(PDF_BYTES, "application/vnd.ms-excel")

    def test_rejects_empty_file(self):
        with self.assertRaises(ExtractionError):
            extract_bill_details(b"", "application/pdf")

    @override_settings(GEMINI_API_KEY="test-key")
    @patch("bill_manager.extraction.get_client")
    def test_rejects_when_model_is_not_confident(self, get_client):
        get_client.return_value.models.generate_content.return_value = make_response(
            confident=False
        )
        with self.assertRaises(ExtractionError):
            extract_bill_details(PDF_BYTES, "application/pdf")

    @override_settings(GEMINI_API_KEY="test-key")
    @patch("bill_manager.extraction.get_client")
    def test_discards_out_of_range_amount(self, get_client):
        get_client.return_value.models.generate_content.return_value = make_response(
            total_amount=10**12
        )
        with self.assertRaises(ExtractionError):
            extract_bill_details(PDF_BYTES, "application/pdf")

    @override_settings(GEMINI_API_KEY="test-key")
    @patch("bill_manager.extraction.get_client")
    def test_tolerates_unparseable_date(self, get_client):
        get_client.return_value.models.generate_content.return_value = make_response(
            bill_date="last tuesday"
        )
        details = extract_bill_details(PDF_BYTES, "application/pdf")
        self.assertIsNone(details["bill_date"])
        self.assertEqual(details["amount"], Decimal("1249.50"))


class TaskTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("tester", password="pw")
        self.bill = Bill.objects.create(
            name="coffee.pdf",
            content_type="application/pdf",
            data=PDF_BYTES,
            created_by=self.user,
        )

    def test_bill_starts_pending(self):
        self.assertEqual(
            self.bill.processing_status, BillProcessingStatus.PENDING.value
        )

    @patch("bill_manager.tasks.extract_bill_details")
    def test_task_writes_extracted_fields(self, extract):
        extract.return_value = {
            "amount": Decimal("1249.50"),
            "vendor": "Blue Tokai Coffee",
            "bill_date": None,
            "category": "dining",
        }

        extract_bill_details_task(str(self.bill.id))

        self.bill.refresh_from_db()
        self.assertEqual(self.bill.amount, Decimal("1249.50"))
        self.assertEqual(self.bill.category, "dining")
        self.assertEqual(self.bill.vendor, "Blue Tokai Coffee")
        self.assertEqual(
            self.bill.processing_status, BillProcessingStatus.COMPLETED.value
        )

    @patch("bill_manager.tasks.extract_bill_details")
    def test_task_marks_failed_on_extraction_error(self, extract):
        extract.side_effect = ExtractionError("No total amount could be found.")

        extract_bill_details_task(str(self.bill.id))

        self.bill.refresh_from_db()
        self.assertEqual(self.bill.processing_status, BillProcessingStatus.FAILED.value)
        self.assertIn("No total amount", self.bill.processing_error)
        self.assertIsNone(self.bill.amount)

    @patch("bill_manager.tasks.extract_bill_details")
    def test_task_marks_failed_on_unexpected_error(self, extract):
        extract.side_effect = ValueError("boom")

        extract_bill_details_task(str(self.bill.id))

        self.bill.refresh_from_db()
        self.assertEqual(self.bill.processing_status, BillProcessingStatus.FAILED.value)

    @patch("bill_manager.tasks.extract_bill_details")
    def test_server_error_propagates_so_celery_retries(self, extract):
        extract.side_effect = genai_errors.ServerError(503, {"message": "overloaded"})

        # The task must not swallow this - autoretry_for needs to see it raised.
        with self.assertRaises(genai_errors.ServerError):
            extract_bill_details_task(str(self.bill.id))

        # Left pending rather than failed, so the UI keeps showing "processing".
        self.bill.refresh_from_db()
        self.assertEqual(
            self.bill.processing_status, BillProcessingStatus.PENDING.value
        )

    def test_server_error_is_registered_for_autoretry(self):
        self.assertIn(
            genai_errors.ServerError, extract_bill_details_task.autoretry_for
        )
        self.assertEqual(extract_bill_details_task.max_retries, 3)

    def test_task_is_rate_limited(self):
        self.assertTrue(extract_bill_details_task.rate_limit)

    @patch("bill_manager.tasks.extract_bill_details")
    def test_rate_limit_error_is_retried_not_failed(self, extract):
        extract.side_effect = quota_error("GenerateRequestsPerMinutePerProjectPerModel-FreeTier")

        with patch.object(extract_bill_details_task, "retry", side_effect=RuntimeError("retry")) as retry:
            with self.assertRaises(RuntimeError):
                extract_bill_details_task(str(self.bill.id))

        # Honours Gemini's suggested delay rather than a fixed backoff.
        self.assertEqual(retry.call_args.kwargs["countdown"], 54)
        self.bill.refresh_from_db()
        self.assertEqual(
            self.bill.processing_status, BillProcessingStatus.PENDING.value
        )

    @patch("bill_manager.tasks.extract_bill_details")
    def test_daily_quota_error_fails_without_retrying(self, extract):
        extract.side_effect = quota_error("GenerateRequestsPerDayPerProjectPerModel-FreeTier")

        with patch.object(extract_bill_details_task, "retry") as retry:
            extract_bill_details_task(str(self.bill.id))

        retry.assert_not_called()
        self.bill.refresh_from_db()
        self.assertEqual(self.bill.processing_status, BillProcessingStatus.FAILED.value)
        self.assertIn("Daily extraction quota", self.bill.processing_error)

    def test_task_is_a_noop_for_deleted_bill(self):
        bill_id = str(self.bill.id)
        self.bill.delete()
        extract_bill_details_task(bill_id)  


class ViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("tester", password="pw")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def make_bill(self, amount, category, status=BillProcessingStatus.COMPLETED):
        return Bill.objects.create(
            name="b.pdf",
            content_type="application/pdf",
            data=PDF_BYTES,
            created_by=self.user,
            amount=amount,
            category=category,
            processing_status=status.value,
        )

    @patch("bill_manager.views.extract_bill_details_task")
    def test_upload_queues_task_asynchronously(self, task):
        upload = SimpleUploadedFile("bill.pdf", PDF_BYTES, content_type="application/pdf")
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post("/bill/upload/", {"file": upload})

        self.assertEqual(res.status_code, 200)
        task.delay.assert_called_once()
        self.assertEqual(
            res.json()["data"]["bills"][0]["processing_status"],
            BillProcessingStatus.PENDING.value,
        )

    @patch("bill_manager.views.extract_bill_details_task")
    def test_upload_accepts_multiple_files(self, task):
        uploads = [
            SimpleUploadedFile(f"bill{i}.pdf", PDF_BYTES + bytes([i]), content_type="application/pdf")
            for i in range(3)
        ]
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post("/bill/upload/", {"file": uploads}, format="multipart")

        self.assertEqual(res.status_code, 200)
        bills = res.json()["data"]["bills"]
        self.assertEqual([b["name"] for b in bills], ["bill0.pdf", "bill1.pdf", "bill2.pdf"])
        self.assertEqual(task.delay.call_count, 3)
        self.assertEqual(
            {call.args[0] for call in task.delay.call_args_list},
            {str(b["id"]) for b in bills},
        )
        # Each bill keeps its own bytes rather than sharing one upload's data.
        for i, bill in enumerate(Bill.objects.order_by("name")):
            self.assertEqual(bytes(bill.data), PDF_BYTES + bytes([i]))

    @patch("bill_manager.views.extract_bill_details_task")
    def test_upload_skips_invalid_files_but_keeps_valid_ones(self, task):
        uploads = [
            SimpleUploadedFile("bill.pdf", PDF_BYTES, content_type="application/pdf"),
            SimpleUploadedFile("sheet.xls", b"x", content_type="application/vnd.ms-excel"),
        ]
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post("/bill/upload/", {"file": uploads}, format="multipart")

        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual([b["name"] for b in data["bills"]], ["bill.pdf"])
        self.assertEqual([e["name"] for e in data["errors"]], ["sheet.xls"])
        task.delay.assert_called_once()

    def test_upload_rejects_unsupported_type(self):
        upload = SimpleUploadedFile("sheet.xls", b"x", content_type="application/vnd.ms-excel")
        res = self.client.post("/bill/upload/", {"file": upload})
        self.assertEqual(res.status_code, 400)

    def test_total_amount_sums_real_values(self):
        self.make_bill(Decimal("100.25"), "dining")
        self.make_bill(Decimal("50.00"), "groceries")
        self.make_bill(None, None, BillProcessingStatus.PENDING)

        data = self.client.get("/bill/total_amount/").json()["data"]

        self.assertEqual(data["total_amount"], 150.25)
        self.assertEqual(data["bills_count"], 3)
        self.assertEqual(data["pending_count"], 1)

    def test_category_distribution(self):
        self.make_bill(Decimal("100.00"), "dining")
        self.make_bill(Decimal("25.00"), "dining")
        self.make_bill(Decimal("60.00"), "groceries")

        data = self.client.get("/bill/category_distribution/").json()["data"]

        self.assertEqual(
            data,
            [
                {"category": "dining", "label": "Dining", "total": 125.0, "count": 2},
                {
                    "category": "groceries",
                    "label": "Groceries",
                    "total": 60.0,
                    "count": 1,
                },
            ],
        )

    def test_cannot_download_another_users_bill(self):
        other = User.objects.create_user("other", password="pw")
        bill = Bill.objects.create(
            name="secret.pdf",
            content_type="application/pdf",
            data=PDF_BYTES,
            created_by=other,
        )
        res = self.client.get(f"/bill/{bill.id}/")
        self.assertEqual(res.status_code, 404)
