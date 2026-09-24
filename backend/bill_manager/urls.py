from bill_manager.views import BillViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"", BillViewSet, basename="bill")

urlpatterns = router.urls
