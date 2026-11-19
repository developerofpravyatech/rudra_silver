from typing import List
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Rudra Silver Jewellery ERP"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/rudra_jewellery_erp"
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:5177"
    ]

    SCALE_COM_PORT: str = "COM1"
    SCALE_BAUDRATE: int = 9600

    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production-please")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
