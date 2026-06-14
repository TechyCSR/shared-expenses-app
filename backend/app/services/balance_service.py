from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional
from collections import defaultdict
import uuid

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Expense, ExpenseParticipant, Settlement, GroupMember
from app.utils.currency import normalize_amount
from app.utils.exceptions import NotFoundError


class BalanceService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_group_balances(
        self,
        group_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> dict:
        expenses = await self._get_expenses_in_range(group_id, start_date, end_date)
        settlements = await self._get_settlements_in_range(group_id, start_date, end_date)
        memberships = await self._get_active_memberships(group_id, start_date, end_date)

        user_balances = defaultdict(lambda: {
            "paid": Decimal("0"),
            "owed": Decimal("0"),
            "received": Decimal("0"),
            "sent": Decimal("0"),
            "paid_details": [],
            "owed_details": [],
            "received_details": [],
            "sent_details": [],
        })

        for expense in expenses:
            payer_id = expense.paid_by
            user_balances[payer_id]["paid"] += expense.amount
            user_balances[payer_id]["paid_details"].append({
                "type": "expense_paid",
                "expense_id": expense.id,
                "description": expense.description,
                "amount": expense.amount,
                "currency": expense.currency,
                "date": expense.expense_date,
            })

            for participant in expense.participants:
                if self._is_member_on_date(participant.user_id, expense.expense_date, memberships):
                    user_balances[participant.user_id]["owed"] += participant.amount_owed
                    user_balances[participant.user_id]["owed_details"].append({
                        "type": "expense_owed",
                        "expense_id": expense.id,
                        "description": expense.description,
                        "amount": participant.amount_owed,
                        "currency": expense.currency,
                        "date": expense.expense_date,
                    })

        for settlement in settlements:
            user_balances[settlement.from_user_id]["sent"] += settlement.amount
            user_balances[settlement.from_user_id]["sent_details"].append({
                "type": "settlement_sent",
                "settlement_id": settlement.id,
                "description": settlement.notes or f"Paid to {settlement.to_user_id}",
                "amount": settlement.amount,
                "currency": settlement.currency,
                "date": settlement.settlement_date,
                "counterparty": str(settlement.to_user_id),
            })

            user_balances[settlement.to_user_id]["received"] += settlement.amount
            user_balances[settlement.to_user_id]["received_details"].append({
                "type": "settlement_received",
                "settlement_id": settlement.id,
                "description": settlement.notes or f"Received from {settlement.from_user_id}",
                "amount": settlement.amount,
                "currency": settlement.currency,
                "date": settlement.settlement_date,
                "counterparty": str(settlement.from_user_id),
            })

        results = []
        for user_id, data in user_balances.items():
            balance = data["paid"] - data["owed"] + data["received"] - data["sent"]
            results.append({
                "user_id": user_id,
                "balance": balance,
                "currency": "INR",
                "breakdown": {
                    "expenses_paid": data["paid_details"],
                    "expenses_owed": data["owed_details"],
                    "settlements_received": data["received_details"],
                    "settlements_sent": data["sent_details"],
                },
            })

        return {"balances": results}

    async def get_user_balance(
        self,
        group_id: uuid.UUID,
        user_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> dict:
        balances = await self.get_group_balances(group_id, start_date, end_date)
        for b in balances["balances"]:
            if b["user_id"] == user_id:
                return b
        raise NotFoundError("User balance not found")

    async def _get_expenses_in_range(
        self,
        group_id: uuid.UUID,
        start_date: Optional[date],
        end_date: Optional[date],
    ):
        query = (
            select(Expense)
            .where(Expense.group_id == group_id)
            .options(selectinload(Expense.participants))
            .options(selectinload(Expense.payer))
        )
        if start_date:
            query = query.where(Expense.expense_date >= start_date)
        if end_date:
            query = query.where(Expense.expense_date <= end_date)
        query = query.order_by(Expense.expense_date)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def _get_settlements_in_range(
        self,
        group_id: uuid.UUID,
        start_date: Optional[date],
        end_date: Optional[date],
    ):
        query = select(Settlement).where(Settlement.group_id == group_id)
        if start_date:
            query = query.where(Settlement.settlement_date >= start_date)
        if end_date:
            query = query.where(Settlement.settlement_date <= end_date)
        query = query.order_by(Settlement.settlement_date)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def _get_active_memberships(
        self,
        group_id: uuid.UUID,
        start_date: Optional[date],
        end_date: Optional[date],
    ) -> dict:
        query = select(GroupMember).where(GroupMember.group_id == group_id)
        result = await self.session.execute(query)
        memberships = result.scalars().all()

        membership_map = defaultdict(list)
        for m in memberships:
            membership_map[m.user_id].append(m)
        return membership_map

    def _is_member_on_date(
        self,
        user_id: uuid.UUID,
        check_date: date,
        memberships: dict,
    ) -> bool:
        user_memberships = memberships.get(user_id, [])
        for m in user_memberships:
            joined = m.joined_at.date() if m.joined_at else None
            left = m.left_at.date() if m.left_at else None
            if joined and joined <= check_date:
                if left is None or left > check_date:
                    return True
        return False


from sqlalchemy.orm import selectinload