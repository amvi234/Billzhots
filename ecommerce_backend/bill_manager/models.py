# Create your models here.
from typing import Optional

from django.contrib.auth.models import User
from django.db import models
from pydantic import BaseModel as PydanticModel
from pydantic import Field
from shared.constants.bills import BillCategory, BillProcessingStatus
from shared.models import BaseModel


class Bill(BaseModel):
    name = models.CharField(max_length=250, db_index=True)
    content_type = models.CharField(max_length=50, db_index=True)
    data = models.BinaryField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    # Populated asynchronously by extract_bill_details_task.
    category = models.CharField(
        max_length=30,
        choices=BillCategory.choices(),
        null=True,
        blank=True,
        db_index=True,
    )
    vendor = models.CharField(max_length=250, blank=True, default="")
    bill_date = models.DateField(null=True, blank=True)
    processing_status = models.CharField(
        max_length=20,
        choices=BillProcessingStatus.choices(),
        default=BillProcessingStatus.PENDING.value,
        db_index=True,
    )
    processing_error = models.TextField(blank=True, default="")


class BillExtraction(PydanticModel):
    """Response schema handed to Gemini and returned back to the caller."""

    total_amount: Optional[float] = Field(
        default=None, description="Final payable total, digits only."
    )
    vendor: Optional[str] = Field(
        default=None, description="Merchant or business name."
    )
    bill_date: Optional[str] = Field(
        default=None, description="Date on the bill in YYYY-MM-DD format."
    )
    category: Optional[BillCategory] = Field(
        default=None, description="Best-fit spending category."
    )
    confident: bool = Field(
        default=True, description="False if the document is unreadable or not a bill."
    )
