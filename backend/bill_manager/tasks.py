import logging

from celery import shared_task
from django.db import transaction
from google.genai import errors as genai_errors
from shared.constants.bills import BillProcessingStatus

from .exceptions import ExtractionError
from .extraction import extract_bill_details
from .models import Bill

logger = logging.getLogger(__name__)

# Rate limits and upstream hiccups are worth retrying; a malformed bill is not.
RETRYABLE_ERRORS = (genai_errors.ServerError, ConnectionError, TimeoutError)


@shared_task(
    bind=True,
    autoretry_for=RETRYABLE_ERRORS,
    retry_backoff=5,
    retry_backoff_max=300,
    retry_jitter=True,
    max_retries=3,
)
def extract_bill_details_task(self, bill_id):
    """Extract amount, vendor, date and category from an uploaded bill."""
    try:
        bill = Bill.objects.get(id=bill_id)
    except Bill.DoesNotExist:
        # Deleted between upload and the worker picking the job up.
        logger.warning("Bill %s no longer exists; skipping extraction.", bill_id)
        return

    Bill.objects.filter(id=bill_id).update(
        processing_status=BillProcessingStatus.PROCESSING.value
    )

    try:
        details = extract_bill_details(bill.data, bill.content_type)
    except RETRYABLE_ERRORS as exc:
        # autoretry_for re-raises this; mark it pending so the UI keeps waiting.
        if self.request.retries < self.max_retries:
            logger.warning(
                "Transient error extracting bill %s (retry %s/%s): %s",
                bill_id,
                self.request.retries + 1,
                self.max_retries,
                exc,
            )
            Bill.objects.filter(id=bill_id).update(
                processing_status=BillProcessingStatus.PENDING.value
            )
        else:
            _mark_failed(bill_id, "Extraction service is unavailable. Try again later.")
        raise
    except genai_errors.ClientError as exc:
        if exc.code != 429:
            logger.exception("Gemini rejected the request for bill %s.", bill_id)
            _mark_failed(bill_id, "An unexpected error occurred while reading this bill.")
            return
        # Free-tier quota exhausted; per-minute limits reset quickly, so back off.
        if self.request.retries < self.max_retries:
            logger.warning("Rate limited extracting bill %s; retrying.", bill_id)
            Bill.objects.filter(id=bill_id).update(
                processing_status=BillProcessingStatus.PENDING.value
            )
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
        _mark_failed(bill_id, "Extraction quota exceeded. Try again later.")
        return
    except ExtractionError as exc:
        # A problem with the document itself - retrying will not help.
        logger.info("Could not extract bill %s: %s", bill_id, exc)
        _mark_failed(bill_id, str(exc))
        return
    except Exception:
        logger.exception("Unexpected error extracting bill %s.", bill_id)
        _mark_failed(bill_id, "An unexpected error occurred while reading this bill.")
        return

    with transaction.atomic():
        Bill.objects.filter(id=bill_id).update(
            processing_status=BillProcessingStatus.COMPLETED.value,
            processing_error="",
            **details,
        )

    logger.info(
        "Extracted bill %s: amount=%s category=%s vendor=%s",
        bill_id,
        details["amount"],
        details["category"],
        details["vendor"],
    )


def _mark_failed(bill_id, message):
    Bill.objects.filter(id=bill_id).update(
        processing_status=BillProcessingStatus.FAILED.value,
        processing_error=message,
    )
