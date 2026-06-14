from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import uuid
from datetime import datetime


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    default_currency: str = Field(default="INR", min_length=3, max_length=3)

    model_config = ConfigDict(extra="ignore")


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    default_currency: Optional[str] = Field(None, min_length=3, max_length=3)

    model_config = ConfigDict(extra="ignore")


class GroupResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    default_currency: str
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    member_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class GroupDetailResponse(GroupResponse):
    members: List["GroupMemberResponse"] = []
    is_member: bool = False
    user_role: Optional[str] = None


class GroupMemberAdd(BaseModel):
    email: str = Field(..., min_length=1)
    role: str = Field(default="member", pattern="^(admin|member)$")

    model_config = ConfigDict(extra="ignore")


class GroupMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str
    joined_at: datetime
    left_at: Optional[datetime]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class GroupMemberTimelineResponse(BaseModel):
    memberships: List[GroupMemberResponse]
    current_members: List[GroupMemberResponse]
    past_members: List[GroupMemberResponse]


GroupDetailResponse.model_rebuild()