from enum import Enum

from shared.exception_handling.helpers import ApiError


class ApiErrors(Enum):
    AUTHENTICATION_ERROR = ApiError("Please log in to proceed", "authentication_error")
    AUTHENTICATION_FAILED = ApiError("Authentication Failed", "authentication_failed")
