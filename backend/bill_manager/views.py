from functools import partial

from bill_manager.models import Bill
from bill_manager.serializers import BillSerializer
from django.db import transaction
from django.db.models import Count, Sum
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from shared.constants.bills import BillCategory, BillProcessingStatus

from .extraction import SUPPORTED_MIME_TYPES, normalize_mime_type
from .tasks import extract_bill_details_task

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB, matching the client-side limit.
MAX_FILES_PER_UPLOAD = 20


def validate_upload(uploaded_file):
    """Return an error message for a file we cannot accept, else None."""
    if uploaded_file.size > MAX_FILE_SIZE:
        return "File is too large. Maximum size is 10MB."

    if normalize_mime_type(uploaded_file.content_type) not in SUPPORTED_MIME_TYPES:
        return f"Unsupported file type {uploaded_file.content_type!r}."

    return None


class BillViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    @action(
        detail=False,
        methods=["post"],
    )
    def upload(self, request):
        uploaded_files = request.FILES.getlist("file")
        if not uploaded_files:
            return Response({"error": "No file was uploaded."}, status=400)

        if len(uploaded_files) > MAX_FILES_PER_UPLOAD:
            return Response(
                {
                    "error": f"Too many files. Upload at most {MAX_FILES_PER_UPLOAD} at a time."
                },
                status=400,
            )

        valid_files, errors = [], []
        for uploaded_file in uploaded_files:
            error = validate_upload(uploaded_file)
            if error:
                errors.append({"name": uploaded_file.name, "error": error})
            else:
                valid_files.append(uploaded_file)

        if not valid_files:
            return Response(
                {"error": errors[0]["error"], "data": {"bills": [], "errors": errors}},
                status=400,
            )

        with transaction.atomic():
            bills = [
                Bill.objects.create(
                    name=uploaded_file.name,
                    content_type=normalize_mime_type(uploaded_file.content_type),
                    data=uploaded_file.read(),
                    created_by=request.user,
                    processing_status=BillProcessingStatus.PENDING.value,
                )
                for uploaded_file in valid_files
            ]
            # Queued on Redis and picked up by a Celery worker, so the upload
            # response does not wait on the LLM call.
            for bill in bills:
                transaction.on_commit(
                    partial(extract_bill_details_task.delay, str(bill.id))
                )

        return Response(
            {
                "meta": {
                    "message": f"{len(bills)} bill(s) uploaded successfully. "
                    "Bill amounts will be updated soon."
                },
                "data": {
                    "bills": [
                        {
                            "id": bill.id,
                            "name": bill.name,
                            "content_type": bill.content_type,
                            "uploaded_at": bill.created_at,
                            "processing_status": bill.processing_status,
                            "url": f"/api/download/{bill.id}/",
                        }
                        for bill in bills
                    ],
                    "errors": errors,
                },
            },
            status=200,
        )

    @action(detail=False, methods=["get"])
    def total_amount(self, request):
        bills = Bill.objects.filter(created_by=request.user)
        totals = bills.aggregate(total=Sum("amount"), count=Count("id"))
        pending = bills.filter(
            processing_status__in=(
                BillProcessingStatus.PENDING.value,
                BillProcessingStatus.PROCESSING.value,
            )
        ).count()

        response = {
            "meta": {"message": "Total amount calculated successfully."},
            "data": {
                "total_amount": round(float(totals["total"] or 0), 2),
                "bills_count": totals["count"],
                "pending_count": pending,
            },
        }
        return Response(response, status=200)

    @action(detail=False, methods=["get"])
    def category_distribution(self, request):
        """Amount totalled per category, for the dashboard chart."""
        rows = (
            Bill.objects.filter(created_by=request.user, category__isnull=False)
            .exclude(amount__isnull=True)
            .values("category")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )

        labels = {category.value: category.name.title() for category in BillCategory}
        return Response(
            {
                "meta": {"message": "Category distribution fetched successfully."},
                "data": [
                    {
                        "category": row["category"],
                        "label": labels.get(row["category"], row["category"].title()),
                        "total": round(float(row["total"]), 2),
                        "count": row["count"],
                    }
                    for row in rows
                ],
            },
            status=200,
        )

    def list(self, request):
        bills = Bill.objects.filter(created_by=request.user)
        serializer = BillSerializer(bills, many=True)
        return Response(
            {
                "meta": {"message": "Bills fetched successfully."},
                "data": serializer.data,
            }
        )

    def retrieve(self, request, pk=None):
        bill = get_object_or_404(Bill, pk=pk, created_by=request.user)
        response = HttpResponse(bytes(bill.data), content_type=bill.content_type)
        response["Content-Disposition"] = f'attachment; filename="{bill.name}"'
        return response

    def destroy(self, request, pk=None):
        bill = get_object_or_404(Bill, pk=pk, created_by=request.user)
        bill.delete()
        return Response({"meta": {"message": "Bill deleted successfully."}}, status=204)
