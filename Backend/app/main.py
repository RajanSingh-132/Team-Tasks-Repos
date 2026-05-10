from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_db, close_db
from app.routes import auth, projects, tasks, dashboard
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://outstanding-fascination-production-cab6.up.railway.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,      prefix="/api/auth",      tags=["Auth"])
app.include_router(projects.router,  prefix="/api/projects",  tags=["Projects"])
app.include_router(tasks.router,     prefix="/api/tasks",     tags=["Tasks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/")
async def root():
    return {"message": "Team Task Manager API is running 🚀"}
