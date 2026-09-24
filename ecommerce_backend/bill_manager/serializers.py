from rest_framework import serializers

from .models import Bill


class BillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = [
            "id",
            "name",
            "content_type",
            "amount",
            "category",
            "vendor",
            "bill_date",
            "processing_status",
            "processing_error",
            "created_by",
            "created_at",
        ]
