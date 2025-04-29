import torch
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from transformers import AutoModelForCausalLM, AutoTokenizer


class CartViewSet(ViewSet):
    """
    A simple ViewSet for product analysis
    """

    tokenizer = None
    model = None

    def __init__(self, **kwargs):
        # Don't pass kwargs to the parent if you're not using ModelViewSet
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

    @action(
        detail=False,
        methods=["post"],
    )
    def analyze_product(self, request):
        self.initialize_model()
        prompt = request.data.get("prompt", "")

        if not prompt:
            return Response({"error": "Prompt is required"}, status=400)

        try:
            inputs = self.tokenizer(
                f"Analyze product: {prompt}",
                return_tensors="pt",
                truncation=True,
                max_length=512,
            )

            with torch.no_grad():
                outputs = self.model.generate(inputs.input_ids, max_new_tokens=150)

            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            return Response({"analysis": response})

        except Exception as e:
            return Response({"error": str(e)}, status=500)
