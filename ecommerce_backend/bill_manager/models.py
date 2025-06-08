# Create your models here.
# Create your models here.
from django.contrib.auth.models import User
from django.db import models
from shared.constants.files import FileType
from shared.models import BaseModel


class Bill(BaseModel):
    name = models.CharField(max_length=250, db_index=True)
    type = models.CharField(max_length=50, db_index=True, choices=FileType.choices())
    size = models.PositiveBigIntegerField(help_text="size in bytes")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    # Managers.
    all_objects = models.Manager()
