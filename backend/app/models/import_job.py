import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Integer, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


class ImportJob(db.Model):
    __tablename__ = "import_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_csv: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="pending"
    )
    total_rows: Mapped[int] = mapped_column(Integer, default=0)
    imported_rows: Mapped[int] = mapped_column(Integer, default=0)
    rejected_rows: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    group: Mapped["Group"] = relationship("Group", back_populates="import_jobs")
    uploader: Mapped["User"] = relationship("User", back_populates="import_jobs", foreign_keys=[uploaded_by])
    anomalies: Mapped[list["ImportAnomaly"]] = relationship(
        "ImportAnomaly", back_populates="import_job", cascade="all, delete-orphan"
    )
    report: Mapped["ImportReport | None"] = relationship(
        "ImportReport", back_populates="import_job", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ImportJob {self.filename} {self.status}>"


class ImportAnomaly(db.Model):
    __tablename__ = "import_anomalies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    import_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("import_jobs.id", ondelete="CASCADE"), nullable=False
    )
    row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    anomaly_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_action: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    raw_row_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    user_decision: Mapped[str | None] = mapped_column(String(20), nullable=True)
    user_resolution: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    import_job: Mapped["ImportJob"] = relationship("ImportJob", back_populates="anomalies")

    def __repr__(self) -> str:
        return f"<ImportAnomaly job={self.import_job_id} row={self.row_number} type={self.anomaly_type}>"


class ImportReport(db.Model):
    __tablename__ = "import_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    import_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("import_jobs.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    report_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    import_job: Mapped["ImportJob"] = relationship("ImportJob", back_populates="report")

    def __repr__(self) -> str:
        return f"<ImportReport job={self.import_job_id}>"