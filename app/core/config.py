"""
Application configuration settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    """Application settings."""
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "FaceID API"
    API_PORT: int = 8000
    
    # Security
    SECRET_KEY: str = "super_secret_random"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    JWT_SECRET: str = "dev_secret"
    JWT_EXPIRE_MINUTES: int = 1440
    INTERNAL_API_KEY: str = "change_me"
    
    # Database
    DATABASE_URL: str = "postgresql://faceuser:facepass@db:5432/faceid"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "faceid"
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    
    # Environment
    ENVIRONMENT: str = "dev"
    ENV: str = "dev"
    WEB_CONCURRENCY: int = 2
    
    # Face Recognition
    FACE_MODEL_PATH: str = "models/arcface_r100_v1"
    FACE_THRESHOLD: float = 0.6
    LIVENESS_MODEL_PATH: str = "models/liveness_model"
    FACE_ENGINE_URL: str = os.getenv("FACE_ENGINE_URL", "http://127.0.0.1:9000")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields from .env

# Create settings instance
settings = Settings()
