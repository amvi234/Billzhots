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

    serializer_class = CartSerializer

    tokenizer = None
    model = None

    def __init__(self, **kwargs):
        super().__init__()

    @classmethod
    def initialize_model(cls):
        if cls.model is None:
            cls.tokenizer = AutoTokenizer.from_pretrained(
                "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
            )
            cls.model = AutoModelForCausalLM.from_pretrained(
                "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
                torch_dtype=torch.float16,
                low_cpu_mem_usage=True,
            )

    @action(detail=False, methods=["post"])
    def generate_report(self, request):
        self.initialize_model()
        prompt = request.data.get("prompt", "").strip()

        if not prompt:
            return Response({"error": "Prompt is required"}, status=400)

        try:
            instruction = (
                "You are a helpful product research assistant. Analyze the following product and provide:\n"
                "1. Key features\n"
                "2. Top items on Amazon, Flipkart, and Myntra with price and rating\n"
                "3. A comparison of deals with a conclusion on the best one\n"
                "4. An averaged review summary.\n\n"
                f"Product: {prompt}\n\n"
                "Answer:"
            )

            inputs = self.tokenizer(
                instruction,
                return_tensors="pt",
                truncation=True,
                max_length=512,
            )

            with torch.no_grad():
                outputs = self.model.generate(
                    inputs.input_ids,
                    max_new_tokens=500,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9,
                    eos_token_id=self.tokenizer.eos_token_id,
                )

            response_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            response_cleaned = response_text.split("Answer:")[-1].strip()

            return Response({"data": response_cleaned})

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, serializer):
        print(self.request.user)
        serializer.save(user=self.request.user)
        print(serializer.data)
        return Response({"data": serializer.data})

    @action(detail=False, methods=["get"])
    def count(self, request):
        count = Cart.objects.filter(user=request.user).count()
        return Response({"data": count})
