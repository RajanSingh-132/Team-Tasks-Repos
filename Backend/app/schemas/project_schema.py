from pydantic import BaseModel, Field
from typing import List, Optional

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    admin_id: str
    members: List[str]
    created_at: str

    class Config:
        from_attributes = True

class MemberAdd(BaseModel):
    user_id: str
