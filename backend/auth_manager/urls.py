from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt import views as jwt_views

from .views import AuthViewSet

router = DefaultRouter()
router.register(r"", AuthViewSet, basename="auth")
urlpatterns = [
    path(
        "token/refresh/",
        jwt_views.TokenRefreshView.as_view(),
        name="token-refresh",
    ),
]

urlpatterns += router.urls
