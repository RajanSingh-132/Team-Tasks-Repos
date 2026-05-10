from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProjectDB(BaseModel):
    """
    Internal Database Model for a Project
    """
    id: str
    name: str
    description: Optional[str] = None
    admin_id: str
    members: List[str] = []
    created_at: datetime
