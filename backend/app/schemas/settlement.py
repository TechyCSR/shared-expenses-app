from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import uuid
from datetime import date, datetime
from decimal import Decimal


class SettlementCreate(BaseModel):
    from_user_id: uuid.UUID
    to_user_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=3)
    settlement_date: date
    notes: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class SettlementResponse(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    from_user_id: uuid.UUID
    to_user_id: uuid.UUID
    amount: Decimal
    currency: str
    settlement_date: date
    created_by: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SettlementDetailResponse(SettlementResponse):
    from_user_name: Optional[str] = None
    to_user_name: Optional[str] = None
    notes: Optional[str] = None


class SettlementListResponse(BaseModel):
    settlements: list[SettlementResponse]
    total: int
    page: int
    per_page: int