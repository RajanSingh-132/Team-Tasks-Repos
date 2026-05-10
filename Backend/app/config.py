import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Team Task Manager"
    
    # MongoDB configuration
    MONGODB_URL: str = os.getenv("MONGO_URI")
    DATABASE_NAME: str = os.getenv("DB_NAME")
    
    # JWT configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-it")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

settings = Settings()
