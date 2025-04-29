from rest_framework import serializers

from .models import CartItem


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = [
            "id",
            "title",
            "prompt",
            "report_data",
            "created_at",
            "product_category",
            "price_range_min",
            "price_range_max",
        ]
        read_only_fields = ["id", "created_at"]
