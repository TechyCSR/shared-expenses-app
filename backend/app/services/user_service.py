from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from app.models.user import User
from app.utils.exceptions import NotFoundError, ConflictError


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def sync_user(
        self,
        clerk_id: str,
        email: str,
        full_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> tuple[User, bool]:
        result = await self.session.execute(select(User).where(User.clerk_id == clerk_id))
        user = result.scalar_one_or_none()

        if user:
            user.email = email
            user.full_name = full_name
            user.avatar_url = avatar_url
            is_new = False
        else:
            user = User(
                clerk_id=clerk_id,
                email=email,
                full_name=full_name,
                avatar_url=avatar_url,
            )
            self.session.add(user)
            is_new = True

        await self.session.flush()
        return user, is_new

    async def get_by_clerk_id(self, clerk_id: str) -> User:
        result = await self.session.execute(select(User).where(User.clerk_id == clerk_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found")
        return user

    async def get_by_id(self, user_id: uuid.UUID) -> User:
        result = await self.session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found")
        return user

    async def search_users(self, query: str, limit: int = 10) -> list[User]:
        search_term = f"%{query}%"
        result = await self.session.execute(
            select(User).where(
                or_(
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term),
                )
            ).limit(limit)
        )
        return list(result.scalars().all())