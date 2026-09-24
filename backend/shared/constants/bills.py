from shared.constants.enums import BaseEnum


class BillProcessingStatus(BaseEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class BillCategory(BaseEnum):
    """Fixed taxonomy so the category distribution chart has stable buckets."""

    GROCERIES = "groceries"
    DINING = "dining"
    UTILITIES = "utilities"
    TRANSPORT = "transport"
    HEALTHCARE = "healthcare"
    ENTERTAINMENT = "entertainment"
    SHOPPING = "shopping"
    TRAVEL = "travel"
    EDUCATION = "education"
    SERVICES = "services"
    OTHER = "other"
