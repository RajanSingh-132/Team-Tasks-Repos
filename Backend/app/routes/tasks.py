from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskResponse
from app.utils.dependencies import get_current_user
import uuid
from datetime import datetime, timezone

router = APIRouter()

@router.get("/project/{project_id}", response_model=List[TaskResponse])
async def get_tasks_by_project(project_id: str, current_user: dict = Depends(get_current_user)):
    from app.database import db
    project = await db["Projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.get("role") != "admin" and current_user["id"] not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # ENFORCE: Member: View assigned tasks only
    if current_user.get("role") == "admin":
        cursor = db["Tasks"].find({"project_id": project_id})
    else:
        cursor = db["Tasks"].find({"project_id": project_id, "assigned_to": current_user["id"]})
        
    tasks = await cursor.to_list(length=1000)
    return tasks

@router.get("/my-tasks", response_model=List[TaskResponse])
async def get_my_tasks(current_user: dict = Depends(get_current_user)):
    from app.database import db
    
    # If admin, show all tasks. If member, show ONLY assigned tasks.
    if current_user.get("role") == "admin":
        cursor = db["Tasks"].find()
    else:
        cursor = db["Tasks"].find({"assigned_to": current_user["id"]})
        
    tasks = await cursor.to_list(length=1000)
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    from app.database import db
    task = await db["Tasks"].find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    project = await db["Projects"].find_one({"id": task["project_id"]})
    
    # ENFORCE: Member: View assigned tasks only
    if current_user.get("role") != "admin":
        if task.get("assigned_to") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to view this task")
        if not project or current_user["id"] not in project.get("members", []):
            raise HTTPException(status_code=403, detail="Not authorized")
        
    return task

@router.post("", response_model=TaskResponse)
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    from app.database import db
    project = await db["Projects"].find_one({"id": task.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.get("role") != "admin" and current_user["id"] not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized to create tasks in this project")
        
    task_dict = {
        "id": str(uuid.uuid4()),
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date,
        "priority": task.priority or "medium",
        "status": "todo",
        "project_id": task.project_id,
        "assigned_to": task.assigned_to or current_user["id"],
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db["Tasks"].insert_one(task_dict)
    return task_dict

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate, current_user: dict = Depends(get_current_user)):
    from app.database import db
    task = await db["Tasks"].find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    project = await db["Projects"].find_one({"id": task["project_id"]})
    
    # ENFORCE: Member: Update assigned tasks only
    if current_user.get("role") != "admin" and task.get("assigned_to") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
        
    if current_user.get("role") != "admin" and (not project or current_user["id"] not in project.get("members", [])):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    update_data = {k: v for k, v in task_update.dict().items() if v is not None}
    if not update_data:
        return task
        
    await db["Tasks"].update_one({"id": task_id}, {"$set": update_data})
    
    updated = await db["Tasks"].find_one({"id": task_id})
    return updated

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    from app.database import db
    task = await db["Tasks"].find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    project = await db["Projects"].find_one({"id": task["project_id"]})
    if current_user.get("role") != "admin" and (not project or current_user["id"] not in project.get("members", [])):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    await db["Tasks"].delete_one({"id": task_id})
    return {"message": "Task deleted"}
