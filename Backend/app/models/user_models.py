from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserDB(BaseModel):
    """
    Internal Database Model for a User
    """
    id: str
    name: str
    email: EmailStr
    password: str  # Hashed password
    role: str      # 'admin' or 'member'
    created_at: datetime
