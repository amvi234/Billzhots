from rest_framework import status
from rest_framework.exceptions import APIException


class MicroserviceException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST


class GeneralException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST


class AuthException(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
