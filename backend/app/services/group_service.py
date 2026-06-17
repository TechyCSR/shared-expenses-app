from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
import uuid
from datetime import datetime, timezone

from app.models import Group, GroupMember, User
from app.utils.exceptions import NotFoundError, ForbiddenError, ConflictError, ValidationError


class GroupService:
    def __init__(self, session: AsyncSession):
        self.session = session

    def create_group(
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
        self.session.flush()

        membership = GroupMember(
            group_id=group.id,
            user_id=created_by,
            role="admin",
        )
        self.session.add(membership)
        self.session.flush()
        return group

    def get_group(self, group_id: uuid.UUID) -> Group:
        result = self.session.execute(
            select(Group).where(Group.id == group_id)
        )
        group = result.scalar_one_or_none()
        if not group:
            raise NotFoundError("Group not found")
        return group

    def get_user_groups(self, user_id: uuid.UUID) -> list[Group]:
        result = self.session.execute(
            select(Group)
            .join(GroupMember, Group.id == GroupMember.group_id)
            .where(
                GroupMember.user_id == user_id,
                GroupMember.left_at.is_(None)
            )
            .order_by(Group.created_at.desc())
        )
        return list(result.scalars().all())

    def update_group(
        self,
        group_id: uuid.UUID,
        user_id: uuid.UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        default_currency: Optional[str] = None,
    ) -> Group:
        group = self.get_group(group_id)
        self._check_admin(group_id, user_id)

        if name is not None:
            group.name = name
        if description is not None:
            group.description = description
        if default_currency is not None:
            group.default_currency = default_currency

        self.session.flush()
        return group

    def delete_group(self, group_id: uuid.UUID, user_id: uuid.UUID) -> None:
        group = self.get_group(group_id)
        self._check_admin(group_id, user_id)
        self.session.delete(group)

    def add_member(
        self,
        group_id: uuid.UUID,
        admin_id: uuid.UUID,
        email: str,
        role: str = "member",
    ) -> GroupMember:
        self._check_admin(group_id, admin_id)
        group = self.get_group(group_id)

        # Email lookup is case-insensitive and tolerates leading/trailing whitespace.
        # Use .first() rather than scalar_one_or_none() because User.email is not unique
        # (Clerk allows the same address on multiple accounts), and we don't want a
        # 500 if more than one row matches. We pick the most-recently-created match.
        normalized_email = (email or "").strip().lower()
        if not normalized_email:
            raise ValidationError("Email is required")
        result = self.session.execute(
            select(User)
            .where(func.lower(User.email) == normalized_email)
            .order_by(User.created_at.desc())
        )
        user = result.scalars().first()
        if not user:
            raise NotFoundError("User not found")

        # Check for an active membership first
        active = self.session.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user.id,
                GroupMember.left_at.is_(None)
            )
        )
        if active.scalar_one_or_none():
            raise ConflictError("User is already a member")

        # Check for a previous (left) membership — reactivate it instead of creating a duplicate
        past = self.session.execute(
            select(GroupMember)
            .where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user.id,
                GroupMember.left_at.is_not(None)
            )
            .order_by(GroupMember.left_at.desc())
            .limit(1)
        )
        past_membership = past.scalar_one_or_none()
        if past_membership:
            past_membership.left_at = None
            # Don't downgrade a former admin back to a plain member unless explicitly told to.
            if role == "admin" or past_membership.role != "admin":
                past_membership.role = role
            self.session.flush()
            return past_membership

        membership = GroupMember(
            group_id=group_id,
            user_id=user.id,
            role=role,
        )
        self.session.add(membership)
        self.session.flush()
        return membership

    def remove_member(
        self,
        group_id: uuid.UUID,
        admin_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> GroupMember:
        self._check_admin(group_id, admin_id)

        result = self.session.execute(
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
            admin_count = self.session.execute(
                select(func.count(GroupMember.id)).where(
                    GroupMember.group_id == group_id,
                    GroupMember.role == "admin",
                    GroupMember.left_at.is_(None)
                )
            )
            if admin_count.scalar() <= 1:
                raise ConflictError("Cannot remove last admin")

        membership.left_at = datetime.now(timezone.utc)
        self.session.flush()
        return membership

    def get_members(self, group_id: uuid.UUID) -> list[GroupMember]:
        result = self.session.execute(
            select(GroupMember)
            .where(GroupMember.group_id == group_id)
            .options(selectinload(GroupMember.user))
            .order_by(GroupMember.joined_at)
        )
        return list(result.scalars().all())

    def get_member_timeline(self, group_id: uuid.UUID) -> dict:
        members = self.get_members(group_id)
        current = [m for m in members if m.is_active()]
        past = [m for m in members if not m.is_active()]
        return {
            "memberships": members,
            "current_members": current,
            "past_members": past,
        }

    def _check_admin(self, group_id: uuid.UUID, user_id: uuid.UUID) -> None:
        result = self.session.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
                GroupMember.role == "admin",
                GroupMember.left_at.is_(None)
            )
        )
        if not result.scalar_one_or_none():
            raise ForbiddenError("Admin access required")