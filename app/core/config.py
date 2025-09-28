"""
Application configuration settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    """Application settings."""
    
    # ===========================================
    # Application Settings
    # ===========================================
    APP_NAME: str = "FaceID"
    APP_VERSION: str = "1.0.0"
    ENV: str = "production"
    DEBUG: bool = False
    
    # ===========================================
    # Server Configuration
    # ===========================================
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    FRONTEND_PORT: int = 3000
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "FaceID API"
    
    # ===========================================
    # Database Configuration
    # ===========================================
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "faceid"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "abcd"
    POSTGRES_DB: str = "faceid"
    
    # ===========================================
    # Security Configuration
    # ===========================================
    SECRET_KEY: str = "3netra_faceid_super_secret_jwt_key_2024_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    JWT_SECRET: str = "3netra_faceid_super_secret_jwt_key_2024_production"
    JWT_EXPIRE_MINUTES: int = 1440
    INTERNAL_API_KEY: str = "3netra_faceid_internal_api_key_2024_production"
    
    # ===========================================
    # CORS Configuration
    # ===========================================
    CORS_ORIGINS: str = "https://3netra.in,https://www.3netra.in,http://3netra.in,http://www.3netra.in,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    
    # ===========================================
    # Face Engine Configuration
    # ===========================================
    FACE_ENGINE_URL: str = "http://127.0.0.1:9000"
    FACE_MODEL_PATH: str = "models/arcface_r100_v1"
    FACE_THRESHOLD: float = 0.6
    LIVENESS_MODEL_PATH: str = "models/liveness_model"
    
    # ===========================================
    # Performance Configuration
    # ===========================================
    WEB_CONCURRENCY: int = 4
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60
    
    # ===========================================
    # File Upload Configuration
    # ===========================================
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png"
    
    # ===========================================
    # Logging Configuration
    # ===========================================
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    # ===========================================
    # Email Configuration (Optional)
    # ===========================================
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    
    # ===========================================
    # Monitoring Configuration (Optional)
    # ===========================================
    SENTRY_DSN: str = ""
    HEALTH_CHECK_INTERVAL: int = 30
    
    # ===========================================
    # Development/Testing
    # ===========================================
    DEV_MODE: bool = False
    MOCK_FACE_ENGINE: bool = False
    
    # Legacy fields for backward compatibility
    ENVIRONMENT: str = "production"
    DATABASE_URL: str = ""  # Will be generated dynamically
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields from .env
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        """Parse allowed extensions from comma-separated string"""
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()]
    
    @property
    def database_url(self) -> str:
        """Generate database URL from components"""
        return f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.POSTGRES_DB}"

# Create settings instance
settings = Settings()
