from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from ..database import SessionLocal
from .. import models, schemas
from ..auth import hash_password, verify_password, create_token, get_current_user

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

# User Management Endpoints
@router.get("/users", response_model=list[schemas.UserOut])
def get_users(
    skip: int = 0,
    limit: int = 100,
    org_id: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all users with optional filtering"""
    query = select(models.User)
    if org_id:
        query = query.where(models.User.org_id == org_id)
    
    users = db.execute(query.offset(skip).limit(limit)).scalars().all()
    return users

@router.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific user by ID"""
    user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users", response_model=schemas.UserOut)
def create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new user"""
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
    return user

@router.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a user"""
    user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.email and payload.email != user.email:
        if db.execute(select(models.User).where(models.User.email == payload.email)).first():
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = payload.email

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.org_id is not None:
        user.org_id = payload.org_id
    if payload.password:
        user.password_hash = hash_password(payload.password)

    if payload.branch_code:
        br = db.execute(select(models.Branch).where(models.Branch.code == payload.branch_code)).scalar_one_or_none()
        if not br:
            raise HTTPException(404, "Branch not found")
        user.branch_id = br.id

    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a user"""
    user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/users/{user_id}/face-count")
def get_user_face_count(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get face count for a user"""
    face_count = db.execute(
        select(func.count(models.FaceImage.id)).where(models.FaceImage.user_id == user_id)
    ).scalar()
    return {"user_id": user_id, "face_count": face_count}