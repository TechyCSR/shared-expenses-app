from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime


class ImportJobCreate(BaseModel):
    filename: str
    original_csv: str

    model_config = ConfigDict(extra="ignore")


class ImportJobResponse(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    filename: str
    status: str
    total_rows: int
    imported_rows: int
    rejected_rows: int
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ImportAnomalyResponse(BaseModel):
    id: uuid.UUID
    import_job_id: uuid.UUID
    row_number: int
    anomaly_type: str
    severity: str
    message: str
    suggested_action: Optional[Dict[str, Any]]
    raw_row_data: Dict[str, Any]
    user_decision: Optional[str]
    user_resolution: Optional[Dict[str, Any]]
    created_at: datetime
    resolved_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ImportAnomalyResolve(BaseModel):
    decision: str = Field(..., pattern="^(approve|reject|override)$")
    resolution: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(extra="ignore")


class ImportCommitRequest(BaseModel):
    force: bool = False

    model_config = ConfigDict(extra="ignore")


class ImportReportResponse(BaseModel):
    import_job_id: uuid.UUID
    report_data: Dict[str, Any]
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)