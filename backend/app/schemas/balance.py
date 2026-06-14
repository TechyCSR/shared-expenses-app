from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import uuid
from datetime import date
from decimal import Decimal


class BalanceItem(BaseModel):
    type: str
    expense_id: Optional[uuid.UUID] = None
    description: str
    amount: Decimal
    currency: str
    date: date
    counterparty: Optional[str] = None


class BalanceBreakdown(BaseModel):
    expenses_paid: List[BalanceItem] = []
    expenses_owed: List[BalanceItem] = []
    settlements_received: List[BalanceItem] = []
    settlements_sent: List[BalanceItem] = []


class BalanceSummaryResponse(BaseModel):
    user_id: uuid.UUID
    user_email: str
    user_name: Optional[str]
    balance: Decimal
    currency: str
    breakdown: BalanceBreakdown

    model_config = ConfigDict(from_attributes=True)


class GroupBalanceResponse(BaseModel):
    group_id: uuid.UUID
    group_name: str
    currency: str
    balances: List[BalanceSummaryResponse]

    model_config = ConfigDict(from_attributes=True)