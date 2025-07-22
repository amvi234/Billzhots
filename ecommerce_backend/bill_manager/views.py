# Create your views here.
# import google.generativeai as genai
from bill_manager.models import Bill
from bill_manager.serializers import BillSerializer
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from .tasks import extract_bill_amount_task


class BillViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

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

        bill = Bill.objects.create(
            name=uploaded_file.name,
            content_type=uploaded_file.content_type,
            data=file_data,
            created_by=request.user,
            amount=amount,
        )

        extract_bill_amount_task(bill.id)

        return Response(
            {
                "meta": {
                    "message": "Bill uploaded successfully. Bill Amount will be updated soon."
                },
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
