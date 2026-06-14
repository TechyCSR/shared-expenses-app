from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
import uuid
from datetime import date
from decimal import Decimal

from app.models import Settlement, GroupMember
from app.utils.exceptions import NotFoundError, ForbiddenError, ValidationError
from app.utils.currency import validate_currency, normalize_amount


class SettlementService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_settlement(
        self,
        group_id: uuid.UUID,
        created_by: uuid.UUID,
        from_user_id: uuid.UUID,
        to_user_id: uuid.UUID,
        amount: Decimal,
        currency: str,
        settlement_date: date,
        notes: Optional[str] = None,
    ) -> Settlement:
        await self._validate_group_access(group_id, created_by)
        await self._validate_members(group_id, from_user_id, to_user_id, settlement_date)

        if from_user_id == to_user_id:
            raise ValidationError("Cannot settle with yourself")

        currency = validate_currency(currency)
        amount = normalize_amount(amount, currency)

        settlement = Settlement(
            group_id=group_id,
            from_user_id=from_user_id,
            to_user_id=to_user_id,
            amount=amount,
            currency=currency,
            settlement_date=settlement_date,
            notes=notes,
            created_by=created_by,
        )
        self.session.add(settlement)
        await self.session.flush()
        return settlement

    async def get_settlement(self, settlement_id: uuid.UUID, user_id: uuid.UUID) -> Settlement:
        result = await self.session.execute(
            select(Settlement)
            .where(Settlement.id == settlement_id)
            .options(selectinload(Settlement.from_user))
            .options(selectinload(Settlement.to_user))
        )
        settlement = result.scalar_one_or_none()
        if not settlement:
            raise NotFoundError("Settlement not found")
        await self._validate_group_access(settlement.group_id, user_id)
        return settlement

    async def get_group_settlements(
        self,
        group_id: uuid.UUID,
        user_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Settlement], int]:
        await self._validate_group_access(group_id, user_id)

        query = (
            select(Settlement)
            .where(Settlement.group_id == group_id)
            .options(selectinload(Settlement.from_user))
            .options(selectinload(Settlement.to_user))
            .order_by(Settlement.settlement_date.desc())
        )

        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar()

        query = query.offset((page - 1) * per_page).limit(per_page)
        result = await self.session.execute(query)
        settlements = list(result.scalars().all())

        return settlements, total

    async def delete_settlement(self, settlement_id: uuid.UUID, user_id: uuid.UUID) -> None:
        settlement = await self.get_settlement(settlement_id, user_id)
        await self._validate_group_access(settlement.group_id, user_id)
        await self.session.delete(settlement)

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

    async def _validate_members(
        self,
        group_id: uuid.UUID,
        from_user_id: uuid.UUID,
        to_user_id: uuid.UUID,
        settlement_date: date,
    ) -> None:
        for user_id in [from_user_id, to_user_id]:
            result = await self.session.execute(
                select(GroupMember).where(
                    GroupMember.group_id == group_id,
                    GroupMember.user_id == user_id,
                    GroupMember.joined_at <= settlement_date,
                    GroupMember.left_at.is_(None) | (GroupMember.left_at > settlement_date)
                )
            )
            if not result.scalar_one_or_none():
                raise ValidationError(f"User {user_id} was not a group member on settlement date")