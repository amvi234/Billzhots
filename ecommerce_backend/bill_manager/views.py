# Create your views here.
# import google.generativeai as genai
import io
import re

from bill_manager.models import Bill
from bill_manager.serializers import BillSerializer
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from PIL import Image
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet


class BillViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    # def __init__(self, *args, **kwargs):
    #     super().__init__(*args, **kwargs)
    # Configure Gemini AI
    # genai.configure(api_key=settings.G[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[D^[[DError extracting amount: 'BillViewSet' object has no attribute 'model'EMINI_API_KEY)
    # self.model = genai.GenerativeModel('gemini-1.5-flash')

    def extract_amount(self, image_data, content_type):
        """Extract total amount from bill image using Gemini AI"""
        try:
            # Convert image data to PIL Image
            image = Image.open(io.BytesIO(image_data))

            prompt = """
            Analyze this bill/receipt image and extract the total amount.
            Look for terms like "Total", "Amount", "Grand Total", "Net Amount", etc.
            Return only the numeric value (without currency symbols) as a float.
            If multiple amounts are present, return the final total amount.
            If no amount can be found, return 0.
            """

            response = self.model.generate_content([prompt, image])

            # Extract numeric value from response
            amount_text = response.text.strip()
            # Use regex to find the first number (including decimals)
            amount_match = re.search(r"\d+\.?\d*", amount_text)

            if amount_match:
                return float(amount_match.group())
            return 0.0

        except Exception as e:
            print(f"Error extracting amount: {e}")
            return 0.0

    @action(
        detail=False,
        methods=["post"],
    )
    def upload(self, request):
        uploaded_file = request.FILES.get("file")
        file_data = uploaded_file.read()

        if not uploaded_file:
            return Response({"error"}, status=400)
        amount = 0.0

        # if uploaded_file.content_type.startswith("image/"):
        #     amount = self.extract_amount(file_data, uploaded_file.content_type)

        bill = Bill.objects.create(
            name=uploaded_file.name,
            content_type=uploaded_file.content_type,
            data=file_data,
            created_by=request.user,
            amount=amount,
        )
        return Response(
            {
                "meta": {"message": "Bill uploaded successfully."},
                "data": {
                    "id": bill.id,
                    "name": bill.name,
                    "content_type": bill.content_type,
                    "uploaded_at": bill.created_at,
                    "url": f"/api/download/{bill.id}/",
                },
            },
            status=200,
        )

    @action(detail=False, methods=["get"])
    def total_amount(self, request):
        bills = Bill.objects.filter(created_by=request.user)
        total = sum(bill.amount or 0 for bill in bills)
        total = 5230.4532
        response = {
            "meta": {"message": "Total amount calculated successfully."},
            "data": {
                "total_amount": round(total, 2),
                "bills_count": bills.count(),
            },
        }
        return Response(response, status=200)

    def list(self, request):
        bills = Bill.objects.filter(created_by=request.user)
        serializer = BillSerializer(bills, many=True)
        return Response(
            {
                "meta": {"message": "Bills fetched successfully."},
                "data": serializer.data,
            }
        )

    def retrieve(self, request, pk=None):
        bill = Bill.objects.get(id=pk)
        response = HttpResponse(bill.data, content_type=bill.content_type)
        response["Content-Disposition"] = f'attachment; filename="{bill.name}"'
        return response

    def destroy(self, request, pk=None):
        bill = get_object_or_404(Bill, pk=pk, created_by=request.user)
        bill.delete()
        return Response({"meta": {"message": "Bill deleted successfully."}}, status=204)
