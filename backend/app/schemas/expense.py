from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from typing_extensions import Literal
import uuid
from datetime import date, datetime
from decimal import Decimal


SplitType = Literal["equal", "unequal", "percentage", "shares"]


class ExpenseParticipantCreate(BaseModel):
    user_id: uuid.UUID
    share_value: Optional[Decimal] = None

    model_config = ConfigDict(extra="ignore")


class ExpenseCreate(BaseModel):
    description: str = Field(..., min_length=1)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=3)
    expense_date: date
    split_type: SplitType
    paid_by: uuid.UUID
    participants: List[ExpenseParticipantCreate]
    notes: Optional[str] = None

    @field_validator("participants")
    @classmethod
    def validate_participants(cls, v, info):
        if not v:
            raise ValueError("At least one participant required")
        return v

    model_config = ConfigDict(extra="ignore")


class ExpenseUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1)
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    expense_date: Optional[date] = None
    split_type: Optional[SplitType] = None
    paid_by: Optional[uuid.UUID] = None
    participants: Optional[List[ExpenseParticipantCreate]] = None
    notes: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class ExpenseParticipantResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_email: str
    user_name: Optional[str]
    share_value: Optional[Decimal]
    amount_owed: Decimal

    model_config = ConfigDict(from_attributes=True)


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    description: str
    amount: Decimal
    currency: str
    expense_date: date
    split_type: str
    paid_by: uuid.UUID
    payer_name: Optional[str]
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExpenseDetailResponse(ExpenseResponse):
    participants: List[ExpenseParticipantResponse] = []
    notes: Optional[str] = None


class ExpenseListResponse(BaseModel):
    expenses: List[ExpenseResponse]
    total: int
    page: int
    per_page: int