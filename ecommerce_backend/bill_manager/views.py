# Create your views here.
from bill_manager.models import Bill
from bill_manager.serializers import BillSerializer
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet


class BillViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    @action(
        detail=False,
        methods=["post"],
    )
    def upload(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error"}, status=400)

        bill = Bill.objects.create(
            name=uploaded_file.name,
            content_type=uploaded_file.content_type,
            data=uploaded_file.read(),
            created_by=request.user,
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

    def list(self, request):
        bills = Bill.objects.filter(created_by=request.user).order("-created_by")
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
