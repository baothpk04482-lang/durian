from __future__ import annotations


class AppException(Exception):
    status_code: int = 500
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None) -> None:
        if detail:
            self.detail = detail
        super().__init__(self.detail)


class NotFoundException(AppException):
    status_code: int = 404
    detail: str = "Resource not found"


class UnauthorizedException(AppException):
    status_code: int = 401
    detail: str = "Not authenticated"


class ForbiddenException(AppException):
    status_code: int = 403
    detail: str = "Permission denied"


class BadRequestException(AppException):
    status_code: int = 400
    detail: str = "Bad request"


class ConflictException(AppException):
    status_code: int = 409
    detail: str = "Resource already exists"
