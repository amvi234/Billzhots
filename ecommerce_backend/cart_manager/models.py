import uuid

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Cart(models.Model):
    """
    Model for storing product reports saved to user's cart
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cart_items")
    prompt = models.TextField()
    report_data = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.id} - {self.user.username}"
