from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..database import SessionLocal
from .. import models, schemas
from ..auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/signup", response_model=schemas.TokenOut)
def signup(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.execute(select(models.User).where(models.User.email == payload.email)).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    branch_id = None
    if payload.branch_code:
        br = db.execute(select(models.Branch).where(models.Branch.code == payload.branch_code)).scalar_one_or_none()
        if not br:
            raise HTTPException(404, "Branch not found")
        branch_id = br.id

    user = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        org_id=payload.org_id or "default",
        branch_id=branch_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(str(user.id))
    return {"access_token": token}

@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.execute(select(models.User).where(models.User.email == payload.email)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(str(user.id))
    return {"access_token": token}