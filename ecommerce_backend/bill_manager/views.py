# Create your views here.
from bill_manager.models import Bill
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
