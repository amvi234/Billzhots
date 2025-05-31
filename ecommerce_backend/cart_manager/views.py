import torch
from cart_manager.models import Cart
from cart_manager.serializer import CartSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from transformers import AutoModelForCausalLM, AutoTokenizer


class CartViewSet(ViewSet):
    """
    A simple ViewSet for product analysis and cart management
    """

    def create(self, serializer):
        serializer.save(user=self.request.user)
        print(serializer.data)
        return Response({"data": serializer.data})

    @action(detail=False, methods=["get"])
    def count(self, request):
        count = Cart.objects.filter(user=request.user).count()
        return Response({"data": count})
