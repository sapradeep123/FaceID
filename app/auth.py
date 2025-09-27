import os, datetime
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret")
JWT_EXPIRE = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)

def verify_password(password: str, hash_: str) -> bool:
    return pwd_ctx.verify(password, hash_)

def create_token(sub: str) -> str:
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=JWT_EXPIRE)
    payload = {"sub": sub, "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def require_token(creds: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = creds.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_user(user_id: str = Depends(require_token)):
    """Get current user from token - simplified version"""
    from .database import SessionLocal
    from . import models
    from sqlalchemy import select
    
    db = SessionLocal()
    try:
        user = db.execute(select(models.User).where(models.User.id == int(user_id))).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    finally:
        db.close()