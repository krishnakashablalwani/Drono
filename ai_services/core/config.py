import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Drono Tactical Reconnaissance Engine"
    API_V1_STR: str = "/api"
    
    # Path where uploaded files are stored
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.getcwd(), "..", "web", "public", "uploads"))
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
