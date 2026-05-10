from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.project_schema import ProjectCreate, ProjectUpdate, ProjectResponse, MemberAdd
from app.utils.dependencies import get_current_user
import uuid
from datetime import datetime, timezone

router = APIRouter()

@router.get("", response_model=List[ProjectResponse])
async def list_projects(current_user: dict = Depends(get_current_user)):
    from app.database import db
    
    # Admins see all, members see their assigned
    if current_user.get("role") == "admin":
        cursor = db["Projects"].find()
    else:
        cursor = db["Projects"].find({"members": current_user["id"]})
        
    projects = await cursor.to_list(length=100)
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    from app.database import db
    project = await db["Projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.get("role") != "admin" and current_user["id"] not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized to view this project")
        
    return project

@router.post("", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    from app.database import db
    # Any user can create a project, they become the admin of it
        
    project_dict = {
        "id": str(uuid.uuid4()),
        "name": project.name,
        "description": project.description,
        "admin_id": current_user["id"],
        "members": [current_user["id"]], # Admin is a member by default
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db["Projects"].insert_one(project_dict)
    return project_dict

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project_update: ProjectUpdate, current_user: dict = Depends(get_current_user)):
    from app.database import db
    project = await db["Projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.get("role") != "admin" and project.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only project admins can update projects")
        
    update_data = {k: v for k, v in project_update.dict().items() if v is not None}
    if not update_data:
        return project
        
    await db["Projects"].update_one({"id": project_id}, {"$set": update_data})
    
    updated = await db["Projects"].find_one({"id": project_id})
    return updated

@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    from app.database import db
    project = await db["Projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.get("role") != "admin" and project.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only project admins can delete projects")
        
    result = await db["Projects"].delete_one({"id": project_id})
        
    # Also delete associated tasks
    await db["Tasks"].delete_many({"project_id": project_id})
    
    return {"message": "Project deleted"}

@router.post("/{project_id}/members")
async def add_member(project_id: str, member: MemberAdd, current_user: dict = Depends(get_current_user)):
    from app.database import db
    project = await db["Projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.get("role") != "admin" and project.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only project admins can add members")
        
    # check if user exists
    user = await db["Users"].find_one({"id": member.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if member.user_id not in project.get("members", []):
        await db["Projects"].update_one(
            {"id": project_id},
            {"$push": {"members": member.user_id}}
        )
        
    return {"message": "Member added"}

@router.delete("/{project_id}/members/{user_id}")
async def remove_member(project_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    from app.database import db
    project = await db["Projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.get("role") != "admin" and project.get("admin_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only project admins can remove members")
        
    if user_id in project.get("members", []):
        await db["Projects"].update_one(
            {"id": project_id},
            {"$pull": {"members": user_id}}
        )
        
    return {"message": "Member removed"}
