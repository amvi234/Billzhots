"""Bill detail extraction backed by the Gemini multimodal API.

The bill file (PDF or image) is handed to the model as raw bytes together with a
JSON response schema, so the model returns structured fields rather than prose
we would have to parse.
"""
import logging
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Optional

from django.conf import settings
from google import genai
from google.genai import types
from shared.constants.bills import BillCategory

from .exceptions import ExtractionError
from .models import BillExtraction

logger = logging.getLogger(__name__)

# Gemini accepts these inline; anything else has to be rejected up front.
SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
}

# Browsers occasionally send non-standard aliases for the same format.
MIME_TYPE_ALIASES = {
    "image/jpg": "image/jpeg",
    "application/x-pdf": "application/pdf",
}

# Amount is DecimalField(max_digits=10, decimal_places=2) on the model.
MAX_AMOUNT = Decimal("99999999.99")

PROMPT = """You are reading a customer's receipt or invoice.

Extract these fields:
- total_amount: the final total actually payable, after discounts and including
  tax. Not a subtotal, not a single line item. Digits only, no currency symbol.
- vendor: the merchant or business name printed on the bill.
- bill_date: the date on the bill, as YYYY-MM-DD.
- category: the single best fit for what was purchased.
- confident: false if the document is unreadable or is not a bill at all.

If a field is genuinely not present on the document, leave it null rather than
guessing. Return only the total once - never sum multiple totals together.
"""


_client = None


def get_client() -> genai.Client:
    """Build the Gemini client lazily so importing this module never needs a key."""
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise ExtractionError(
                "GEMINI_API_KEY is not configured; cannot extract bill details."
            )
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def normalize_mime_type(content_type: str) -> str:
    """Strip any parameters (`; charset=...`) and resolve known aliases."""
    base = (content_type or "").split(";")[0].strip().lower()
    return MIME_TYPE_ALIASES.get(base, base)


def parse_amount(raw: Optional[float]) -> Optional[Decimal]:
    """Coerce the model's float into a Decimal the model field can store."""
    if raw is None:
        return None
    try:
        amount = Decimal(str(raw)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        logger.warning("Could not parse amount %r from extraction response.", raw)
        return None

    if amount < 0 or amount > MAX_AMOUNT:
        logger.warning("Extracted amount %s is out of range; discarding.", amount)
        return None
    return amount


def parse_bill_date(raw: Optional[str]) -> Optional[date]:
    """Parse the model's YYYY-MM-DD string, tolerating a malformed answer."""
    if not raw:
        return None
    try:
        return date.fromisoformat(raw.strip())
    except ValueError:
        logger.warning("Could not parse bill_date %r from extraction response.", raw)
        return None


def extract_bill_details(data: bytes, content_type: str) -> dict:
    """Send the bill to Gemini and return cleaned, model-ready field values.

    Raises ExtractionError for problems that retrying will not fix (unsupported
    file type, empty file, model could not read the document). Transport and
    server-side failures propagate as `google.genai.errors.APIError` so the
    Celery task can retry them.
    """
    if not data:
        raise ExtractionError("Bill file is empty.")

    mime_type = normalize_mime_type(content_type)
    if mime_type not in SUPPORTED_MIME_TYPES:
        raise ExtractionError(
            f"Unsupported file type {mime_type!r}. "
            f"Supported types: {', '.join(sorted(SUPPORTED_MIME_TYPES))}."
        )

    response = get_client().models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=bytes(data), mime_type=mime_type),
            PROMPT,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=BillExtraction,
            temperature=0,
        ),
    )

    extraction = response.parsed
    if not isinstance(extraction, BillExtraction):
        raise ExtractionError("Gemini returned a response that did not match schema.")

    if not extraction.confident:
        raise ExtractionError(
            "The document could not be read as a bill. "
            "Please upload a clearer scan of the receipt or invoice."
        )

    amount = parse_amount(extraction.total_amount)
    if amount is None:
        raise ExtractionError("No total amount could be found on this bill.")

    category = extraction.category or BillCategory.OTHER
    vendor = (extraction.vendor or "").strip()[:250]

    return {
        "amount": amount,
        "vendor": vendor,
        "bill_date": parse_bill_date(extraction.bill_date),
        "category": category.value,
    }
