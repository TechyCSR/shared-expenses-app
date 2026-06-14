from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
import uuid


class AuthSyncRequest(BaseModel):
    clerk_id: str = Field(..., min_length=1)
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class AuthSyncResponse(BaseModel):
    user_id: uuid.UUID
    clerk_id: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    created_at: str
    is_new: bool


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    clerk_id: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    created_at: str
    updated_at: str