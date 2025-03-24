import pyotp
from django.contrib.auth import authenticate
from rest_framework.decorators import action
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from shared.exception_handling import ApiErrors, AuthException


class AuthViewSet(ViewSet):    
    @action(
        detail=False,
        methods=["post"],
    )
    def login(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if not user:
            raise AuthException(
                ApiErrors.AUTHENTICATION_FAILED.value,
            )

        totp_device, _ = TOTPDevice.objects.get_or_create(
            user=user, confirmed=True
        )
        otp = pyotp.TOTP(totp_device.key).now()

        response = {
            "message": "User logged in successfully.",
            "data": {"otp_secret": totp_device.key, "otp": otp, "message": "Enter OTP"},
        }

        return Response(response)
