class AppException(Exception):
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500, details: dict | None = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class ValidationError(AppException):
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message, "VALIDATION_ERROR", 400, details)


class NotFoundError(AppException):
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message, "NOT_FOUND", 404, details)


class AuthorizationError(AppException):
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message, "UNAUTHORIZED", 401, details)


class ForbiddenError(AppException):
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message, "FORBIDDEN", 403, details)


class ConflictError(AppException):
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message, "CONFLICT", 409, details)


class BadRequestError(AppException):
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message, "BAD_REQUEST", 400, details)