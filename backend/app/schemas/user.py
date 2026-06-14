from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import uuid


class UserSearchResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class UserSearchListResponse(BaseModel):
    users: list[UserSearchResponse]
    total: int