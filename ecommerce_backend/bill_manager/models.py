# Create your models here.
# Create your models here.
from django.contrib.auth.models import User
from django.db import models
from shared.models import BaseModel


class Bill(BaseModel):
    name = models.CharField(max_length=250, db_index=True)
    content_type = models.CharField(max_length=50, db_index=True)
    data = models.BinaryField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
