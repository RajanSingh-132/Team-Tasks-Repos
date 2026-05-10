from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.auth_schema import UserCreate, UserLogin, UserResponse, Token
from app.utils.password_hash import hash_password, verify_password
from app.utils.jwt_handles import create_access_token
from app.utils.dependencies import get_current_user
import uuid
from datetime import datetime, timezone

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate):
    from app.database import db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    existing_user = await db["Users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    count = await db["Users"].count_documents({})
    # Use provided role, or default to admin for first user, otherwise member
    role = user.role if user.role else ("admin" if count == 0 else "member")

    user_id = str(uuid.uuid4())
    user_dict = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db["Users"].insert_one(user_dict)
    
    # Return user data without password
    return {
        "id": user_dict["id"],
        "name": user_dict["name"],
        "email": user_dict["email"],
        "role": user_dict["role"]
    }

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    from app.database import db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    db_user = await db["Users"].find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"email": db_user["email"], "sub": db_user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user.get("name", "User"),
        "email": current_user["email"],
        "role": current_user.get("role", "member")
    }

@router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: dict = Depends(get_current_user)):
    from app.database import db
    users_cursor = db["Users"].find()
    users = await users_cursor.to_list(length=1000)
    return users

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    from app.database import db
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete users")
    
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    result = await db["Users"].delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cleanup: Remove user from all projects and unassign tasks
    await db["Projects"].update_many(
        {"members": user_id},
        {"$pull": {"members": user_id}}
    )
    await db["Tasks"].update_many(
        {"assigned_to": user_id},
        {"$set": {"assigned_to": None}}
    )
    
    return None
