from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    org_id: Optional[str] = "default"
    branch_code: Optional[str] = None  # set at signup if you want

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class VerifyOut(BaseModel):
    matched_user_id: int
    confidence: float

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    org_id: Optional[str] = None
    password: Optional[str] = None
    branch_code: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    org_id: str
    branch_id: Optional[int] = None
    created_at: str

    class Config:
        from_attributes = True