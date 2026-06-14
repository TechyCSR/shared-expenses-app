from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
import uuid
from datetime import datetime, timezone

from app.models import Group, GroupMember, User
from app.utils.exceptions import NotFoundError, ForbiddenError, ConflictError


class GroupService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_group(
        self,
        name: str,
        created_by: uuid.UUID,
        description: Optional[str] = None,
        default_currency: str = "INR",
    ) -> Group:
        group = Group(
            name=name,
            description=description,
            default_currency=default_currency,
            created_by=created_by,
        )
        self.session.add(group)
        await self.session.flush()

        membership = GroupMember(
            group_id=group.id,
            user_id=created_by,
            role="admin",
        )
        self.session.add(membership)
        await self.session.flush()
        return group

    async def get_group(self, group_id: uuid.UUID) -> Group:
        result = await self.session.execute(
            select(Group).where(Group.id == group_id)
        )
        group = result.scalar_one_or_none()
        if not group:
            raise NotFoundError("Group not found")
        return group

    async def get_user_groups(self, user_id: uuid.UUID) -> list[Group]:
        result = await self.session.execute(
            select(Group)
            .join(GroupMember, Group.id == GroupMember.group_id)
            .where(
                GroupMember.user_id == user_id,
                GroupMember.left_at.is_(None)
            )
            .order_by(Group.created_at.desc())
        )
        return list(result.scalars().all())

    async def update_group(
        self,
        group_id: uuid.UUID,
        user_id: uuid.UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        default_currency: Optional[str] = None,
    ) -> Group:
        group = await self.get_group(group_id)
        await self._check_admin(group_id, user_id)

        if name is not None:
            group.name = name
        if description is not None:
            group.description = description
        if default_currency is not None:
            group.default_currency = default_currency

        await self.session.flush()
        return group

    async def delete_group(self, group_id: uuid.UUID, user_id: uuid.UUID) -> None:
        group = await self.get_group(group_id)
        await self._check_admin(group_id, user_id)
        await self.session.delete(group)

    async def add_member(
        self,
        group_id: uuid.UUID,
        admin_id: uuid.UUID,
        email: str,
        role: str = "member",
    ) -> GroupMember:
        await self._check_admin(group_id, admin_id)
        group = await self.get_group(group_id)

        result = await self.session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found")

        existing = await self.session.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user.id,
                GroupMember.left_at.is_(None)
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictError("User is already a member")

        membership = GroupMember(
            group_id=group_id,
            user_id=user.id,
            role=role,
        )
        self.session.add(membership)
        await self.session.flush()
        return membership

    async def remove_member(
        self,
        group_id: uuid.UUID,
        admin_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> GroupMember:
        await self._check_admin(group_id, admin_id)

        result = await self.session.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
                GroupMember.left_at.is_(None)
            )
        )
        membership = result.scalar_one_or_none()
        if not membership:
            raise NotFoundError("Member not found")

        if membership.role == "admin":
            admin_count = await self.session.execute(
                select(func.count(GroupMember.id)).where(
                    GroupMember.group_id == group_id,
                    GroupMember.role == "admin",
                    GroupMember.left_at.is_(None)
                )
            )
            if admin_count.scalar() <= 1:
                raise ConflictError("Cannot remove last admin")

        membership.left_at = datetime.now(timezone.utc)
        await self.session.flush()
        return membership

    async def get_members(self, group_id: uuid.UUID) -> list[GroupMember]:
        result = await self.session.execute(
            select(GroupMember)
            .where(GroupMember.group_id == group_id)
            .options(selectinload(GroupMember.user))
            .order_by(GroupMember.joined_at)
        )
        return list(result.scalars().all())

    async def get_member_timeline(self, group_id: uuid.UUID) -> dict:
        members = await self.get_members(group_id)
        current = [m for m in members if m.is_active()]
        past = [m for m in members if not m.is_active()]
        return {
            "memberships": members,
            "current_members": current,
            "past_members": past,
        }

    async def _check_admin(self, group_id: uuid.UUID, user_id: uuid.UUID) -> None:
        result = await self.session.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
                GroupMember.role == "admin",
                GroupMember.left_at.is_(None)
            )
        )
        if not result.scalar_one_or_none():
            raise ForbiddenError("Admin access required")