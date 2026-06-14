from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
import uuid
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from app.models import Expense, ExpenseParticipant, GroupMember, User
from app.services.group_service import GroupService
from app.utils.exceptions import NotFoundError, ForbiddenError, ValidationError
from app.utils.currency import validate_currency, normalize_amount


class ExpenseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.group_service = GroupService(session)

    async def create_expense(
        self,
        group_id: uuid.UUID,
        created_by: uuid.UUID,
        description: str,
        amount: Decimal,
        currency: str,
        expense_date: date,
        split_type: str,
        paid_by: uuid.UUID,
        participants: list[dict],
        notes: Optional[str] = None,
    ) -> Expense:
        await self._validate_group_access(group_id, created_by)
        await self._validate_payer(group_id, paid_by, expense_date)

        currency = validate_currency(currency)
        amount = normalize_amount(amount, currency)

        participant_data = await self._calculate_shares(
            group_id, split_type, amount, participants, expense_date
        )

        expense = Expense(
            group_id=group_id,
            description=description,
            amount=amount,
            currency=currency,
            expense_date=expense_date,
            split_type=split_type,
            paid_by=paid_by,
            created_by=created_by,
            notes=notes,
        )
        self.session.add(expense)
        await self.session.flush()

        for p in participant_data:
            participant = ExpenseParticipant(
                expense_id=expense.id,
                user_id=p["user_id"],
                share_value=p.get("share_value"),
                amount_owed=p["amount_owed"],
            )
            self.session.add(participant)

        await self.session.flush()
        return expense

    async def get_expense(self, expense_id: uuid.UUID, user_id: uuid.UUID) -> Expense:
        result = await self.session.execute(
            select(Expense)
            .where(Expense.id == expense_id)
            .options(selectinload(Expense.participants).selectinload(ExpenseParticipant.user))
            .options(selectinload(Expense.payer))
        )
        expense = result.scalar_one_or_none()
        if not expense:
            raise NotFoundError("Expense not found")
        await self._validate_group_access(expense.group_id, user_id)
        return expense

    async def get_group_expenses(
        self,
        group_id: uuid.UUID,
        user_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> tuple[list[Expense], int]:
        await self._validate_group_access(group_id, user_id)

        query = (
            select(Expense)
            .where(Expense.group_id == group_id)
            .options(selectinload(Expense.participants))
            .options(selectinload(Expense.payer))
            .order_by(Expense.expense_date.desc())
        )
        if start_date:
            query = query.where(Expense.expense_date >= start_date)
        if end_date:
            query = query.where(Expense.expense_date <= end_date)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar()

        query = query.offset((page - 1) * per_page).limit(per_page)
        result = await self.session.execute(query)
        expenses = list(result.scalars().all())

        return expenses, total

    async def update_expense(
        self,
        expense_id: uuid.UUID,
        user_id: uuid.UUID,
        **kwargs
    ) -> Expense:
        expense = await self.get_expense(expense_id, user_id)
        await self._validate_group_access(expense.group_id, user_id)

        if "participants" in kwargs:
            participants = kwargs.pop("participants")
            await self.session.execute(
                select(ExpenseParticipant).where(ExpenseParticipant.expense_id == expense_id)
            )
            for p in await self.session.execute(
                select(ExpenseParticipant).where(ExpenseParticipant.expense_id == expense_id)
            ):
                await self.session.delete(p.scalar())

            participant_data = await self._calculate_shares(
                expense.group_id,
                kwargs.get("split_type", expense.split_type),
                kwargs.get("amount", expense.amount),
                participants,
                kwargs.get("expense_date", expense.expense_date),
            )
            for p in participant_data:
                self.session.add(ExpenseParticipant(
                    expense_id=expense.id,
                    user_id=p["user_id"],
                    share_value=p.get("share_value"),
                    amount_owed=p["amount_owed"],
                ))

        for key, value in kwargs.items():
            if hasattr(expense, key) and value is not None:
                if key == "amount":
                    value = normalize_amount(value, expense.currency)
                if key == "currency":
                    value = validate_currency(value)
                setattr(expense, key, value)

        await self.session.flush()
        return expense

    async def delete_expense(self, expense_id: uuid.UUID, user_id: uuid.UUID) -> None:
        expense = await self.get_expense(expense_id, user_id)
        await self._validate_group_access(expense.group_id, user_id)
        await self.session.delete(expense)

    async def _validate_group_access(self, group_id: uuid.UUID, user_id: uuid.UUID) -> None:
        result = await self.session.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
                GroupMember.left_at.is_(None)
            )
        )
        if not result.scalar_one_or_none():
            raise ForbiddenError("Not a member of this group")

    async def _validate_payer(self, group_id: uuid.UUID, payer_id: uuid.UUID, expense_date: date) -> None:
        result = await self.session.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == payer_id,
                GroupMember.joined_at <= expense_date,
                GroupMember.left_at.is_(None) | (GroupMember.left_at > expense_date)
            )
        )
        if not result.scalar_one_or_none():
            raise ValidationError("Payer was not a group member on expense date")

    async def _calculate_shares(
        self,
        group_id: uuid.UUID,
        split_type: str,
        amount: Decimal,
        participants: list[dict],
        expense_date: date,
    ) -> list[dict]:
        member_ids = [p["user_id"] for p in participants]
        result = await self.session.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id.in_(member_ids),
                GroupMember.joined_at <= expense_date,
                GroupMember.left_at.is_(None) | (GroupMember.left_at > expense_date)
            )
        )
        valid_members = {m.user_id for m in result.scalars().all()}

        participant_data = []
        if split_type == "equal":
            valid_count = sum(1 for p in participants if p["user_id"] in valid_members)
            if valid_count == 0:
                raise ValidationError("No valid participants")
            share = (amount / valid_count).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            for p in participants:
                if p["user_id"] in valid_members:
                    participant_data.append({
                        "user_id": p["user_id"],
                        "amount_owed": share,
                    })
            remainder = amount - (share * valid_count)
            if remainder > 0 and participant_data:
                participant_data[0]["amount_owed"] += remainder

        elif split_type == "unequal":
            total = sum(p.get("share_value", Decimal("0")) for p in participants if p["user_id"] in valid_members)
            if total == 0:
                raise ValidationError("Total shares cannot be zero")
            for p in participants:
                if p["user_id"] in valid_members:
                    share_value = p.get("share_value", Decimal("0"))
                    owed = (amount * share_value / total).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    participant_data.append({
                        "user_id": p["user_id"],
                        "share_value": share_value,
                        "amount_owed": owed,
                    })

        elif split_type == "percentage":
            total_pct = sum(p.get("share_value", Decimal("0")) for p in participants if p["user_id"] in valid_members)
            if total_pct != 100:
                raise ValidationError(f"Percentages must sum to 100, got {total_pct}")
            for p in participants:
                if p["user_id"] in valid_members:
                    pct = p.get("share_value", Decimal("0"))
                    owed = (amount * pct / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    participant_data.append({
                        "user_id": p["user_id"],
                        "share_value": pct,
                        "amount_owed": owed,
                    })

        elif split_type == "shares":
            total_shares = sum(p.get("share_value", Decimal("0")) for p in participants if p["user_id"] in valid_members)
            if total_shares == 0:
                raise ValidationError("Total shares cannot be zero")
            for p in participants:
                if p["user_id"] in valid_members:
                    shares = p.get("share_value", Decimal("0"))
                    owed = (amount * shares / total_shares).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    participant_data.append({
                        "user_id": p["user_id"],
                        "share_value": shares,
                        "amount_owed": owed,
                    })

        else:
            raise ValidationError(f"Invalid split type: {split_type}")

        if not participant_data:
            raise ValidationError("No valid participants for this expense")

        return participant_data


from sqlalchemy import func