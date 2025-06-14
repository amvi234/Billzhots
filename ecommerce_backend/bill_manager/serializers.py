from rest_framework import serializers

from .models import Bill


class BillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = ["id", "name", "content_type", "created_by"]
