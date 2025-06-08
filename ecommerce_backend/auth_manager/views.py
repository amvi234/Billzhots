import base64
import os

import pyotp
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from rest_framework_simplejwt.tokens import RefreshToken


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
            return Response(
                {"meta": {"message": "Invalid credentials", "status_code": 400}},
                status=400,
            )

        # Get or create a TOTP device for the user.
        totp_device, created = TOTPDevice.objects.get_or_create(
            user=user,
            defaults={
                "confirmed": True,
                "key": base64.b32encode(os.urandom(10)).decode("utf-8"),
            },
        )

        # If the device exists but isn't confirmed, confirm it.
        if not totp_device.confirmed:
            totp_device.confirmed = True
            totp_device.save()

        # Generate current OTP.
        otp = pyotp.TOTP(totp_device.key).now()

        response = {
            "meta": {"message": "User authenticated successfully.", "status_code": 200},
            "data": {
                "otp_secret": totp_device.key,
                "otp": otp,
                "message": "Enter OTP to complete authentication",
            },
        }

        return Response(response)

    @action(
        detail=False,
        methods=["post"],
    )
    def verify_otp(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        otp_code = request.data.get("otp")

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"message": "Invalid credentials"}, status=400)

        totp_device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        if not totp_device:
            return Response({"message": "OTP device not found"}, status=400)

        totp = pyotp.TOTP(totp_device.key)
        if not totp.verify(otp_code):
            return Response({"meta": {"message": "Otp entered is wrong"}}, status=400)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        response = {
            "message": "Login successful",
            "data": {
                "user_id": user.id,
                "access": access_token,
                "refresh": str(refresh),
            },
        }

        return Response(response)

    @action(
        detail=False,
        methods=["post"],
    )
    def register(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {"meta": {"message": "Username already exists", "status_code": 400}},
                status=400,
            )

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {"meta": {"message": "Email already exists", "status_code": 400}},
                status=400,
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        response = {
            "meta": {"message": "User Registration is Completed"},
            "data": {"user": {"username": user.id}},
        }
        return Response(response)
