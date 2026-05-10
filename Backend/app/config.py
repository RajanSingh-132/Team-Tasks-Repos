import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Team Task Manager"
    
    # MongoDB configuration
    MONGODB_URL: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DB_NAME", "team_task_db")
    
    # JWT configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-it")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

settings = Settings()
