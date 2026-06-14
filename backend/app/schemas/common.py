from typing import Generic, TypeVar, Optional
from pydantic import BaseModel, Field, ConfigDict


T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: Optional[dict] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: dict


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)

    model_config = ConfigDict(extra="ignore")


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    meta: dict = Field(default_factory=dict)


def create_success_response(data: T, meta: Optional[dict] = None) -> SuccessResponse[T]:
    return SuccessResponse(data=data, meta=meta)


def create_error_response(code: str, message: str, details: Optional[dict] = None, status_code: int = 400) -> tuple[ErrorResponse, int]:
    return ErrorResponse(error={"code": code, "message": message, "details": details or {}}), status_code


def create_paginated_response(
    items: list[T], page: int, per_page: int, total: int
) -> PaginatedResponse[T]:
    return PaginatedResponse(
        data=items,
        meta={
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page,
        },
    )