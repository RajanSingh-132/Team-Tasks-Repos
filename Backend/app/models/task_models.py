from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskDB(BaseModel):
    """
    Internal Database Model for a Task
    """
    id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "medium"  # low, medium, high
    status: str = "todo"      # todo, in_progress, done
    project_id: str
    assigned_to: Optional[str] = None
    created_by: str
    created_at: datetime
