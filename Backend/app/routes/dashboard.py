from fastapi import APIRouter, Depends
from app.utils.dependencies import get_current_user
from datetime import datetime, timezone

router = APIRouter()

@router.get("")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    from app.database import db
    
    if current_user.get("role") == "admin":
        tasks_cursor = db["Tasks"].find()
        projects_cursor = db["Projects"].find()
    else:
        projects_cursor = db["Projects"].find({"members": current_user["id"]})
        # Users see tasks assigned to them or in their projects
        my_projects = await projects_cursor.to_list(length=1000)
        project_ids = [p["id"] for p in my_projects]
        tasks_cursor = db["Tasks"].find({
            "$or": [
                {"assigned_to": current_user["id"]},
                {"project_id": {"$in": project_ids}}
            ]
        })
        
    tasks = await tasks_cursor.to_list(length=1000)
    projects_count = await db["Projects"].count_documents({}) if current_user.get("role") == "admin" else len(project_ids)
    
    now = datetime.now(timezone.utc)
    
    total_tasks = len(tasks)
    todo = sum(1 for t in tasks if t.get("status") == "todo")
    in_progress = sum(1 for t in tasks if t.get("status") == "in_progress")
    done = sum(1 for t in tasks if t.get("status") == "done")
    
    overdue_details = []
    for t in tasks:
        if t.get("status") != "done" and t.get("due_date"):
            try:
                due = datetime.fromisoformat(t["due_date"].replace('Z', '+00:00'))
                if due < now:
                    overdue_details.append({
                        "id": t["id"],
                        "title": t["title"],
                        "due_date": t["due_date"],
                        "assigned_to": t.get("assigned_to")
                    })
            except Exception:
                pass
                
    tasks_per_user = {}
    for t in tasks:
        u = t.get("assigned_to", "Unassigned")
        tasks_per_user[u] = tasks_per_user.get(u, 0) + 1
        
    recent_tasks = sorted(tasks, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
    recent_formatted = [{
        "id": t["id"],
        "title": t["title"],
        "status": t.get("status", "todo"),
        "due_date": t.get("due_date", "")
    } for t in recent_tasks]

    return {
        "total_tasks": total_tasks,
        "total_projects": projects_count,
        "tasks_by_status": {
            "todo": todo,
            "in_progress": in_progress,
            "done": done
        },
        "overdue_tasks": len(overdue_details),
        "overdue_details": overdue_details,
        "tasks_per_user": tasks_per_user,
        "recent_tasks": recent_formatted
    }
