from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception."""

    def __init__(
        self,
        status_code: int,
        detail: Any = None,
        error_code: Optional[str] = None,
        headers: Optional[dict] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code
        self.code = error_code


class NotFoundException(AppException):
    def __init__(self, detail: str = "Resource not found", error_code: str = "NOT_FOUND"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail, error_code=error_code)


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Unauthorized", error_code: str = "UNAUTHORIZED"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code=error_code,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Access forbidden", error_code: str = "FORBIDDEN"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail, error_code=error_code)


class ConflictException(AppException):
    def __init__(self, detail: str = "Resource already exists", error_code: str = "CONFLICT"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail, error_code=error_code)


class ValidationException(AppException):
    def __init__(self, detail: Any = "Validation error", error_code: str = "VALIDATION_ERROR"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code=error_code,
        )


class BadRequestException(AppException):
    def __init__(self, detail: str = "Bad request", error_code: str = "BAD_REQUEST"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail, error_code=error_code)


class TenantIsolationException(ForbiddenException):
    def __init__(self):
        super().__init__(
            detail="Access to this resource is not allowed for your organization",
            error_code="TENANT_ISOLATION_VIOLATION",
        )


class InvalidCredentialsException(UnauthorizedException):
    def __init__(self):
        super().__init__(detail="Invalid email or password", error_code="INVALID_CREDENTIALS")


class TokenExpiredException(UnauthorizedException):
    def __init__(self):
        super().__init__(detail="Token has expired", error_code="TOKEN_EXPIRED")


class InsufficientPermissionsException(ForbiddenException):
    def __init__(self, required_roles: Optional[list[str]] = None):
        detail = "Insufficient permissions"
        if required_roles:
            detail = f"Requires one of: {', '.join(required_roles)}"
        super().__init__(detail=detail, error_code="INSUFFICIENT_PERMISSIONS")
