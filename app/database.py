import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv, find_dotenv
from urllib.parse import quote_plus
from .core.config import settings

# Load environment variables from .env early
load_dotenv(find_dotenv())

# Use settings from configuration with URL encoding for special characters
user_enc = quote_plus(settings.POSTGRES_USER)
pass_enc = quote_plus(settings.POSTGRES_PASSWORD)
DATABASE_URL = f"postgresql+psycopg://{user_enc}:{pass_enc}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.POSTGRES_DB}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()