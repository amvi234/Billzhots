import uuid

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class CartItem(models.Model):
    """
    Model for storing product reports saved to user's cart
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cart_items")
    title = models.CharField(max_length=255)
    prompt = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    report_data = models.JSONField()

    product_category = models.CharField(max_length=100, blank=True, null=True)
    price_range_min = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    price_range_max = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.user.username}"
