import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    clerk_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    groups_created: Mapped[list["Group"]] = relationship(
        "Group", back_populates="creator", foreign_keys="Group.created_by"
    )
    group_memberships: Mapped[list["GroupMember"]] = relationship(
        "GroupMember", back_populates="user", cascade="all, delete-orphan"
    )
    expenses_paid: Mapped[list["Expense"]] = relationship(
        "Expense", back_populates="payer", foreign_keys="Expense.paid_by"
    )
    expenses_created: Mapped[list["Expense"]] = relationship(
        "Expense", back_populates="creator", foreign_keys="Expense.created_by"
    )
    expense_participations: Mapped[list["ExpenseParticipant"]] = relationship(
        "ExpenseParticipant", back_populates="user", cascade="all, delete-orphan"
    )
    settlements_sent: Mapped[list["Settlement"]] = relationship(
        "Settlement", back_populates="from_user", foreign_keys="Settlement.from_user_id"
    )
    settlements_received: Mapped[list["Settlement"]] = relationship(
        "Settlement", back_populates="to_user", foreign_keys="Settlement.to_user_id"
    )
    import_jobs: Mapped[list["ImportJob"]] = relationship(
        "ImportJob", back_populates="uploader", foreign_keys="ImportJob.uploaded_by"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"