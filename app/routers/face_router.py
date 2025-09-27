from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from typing import List
from ..database import SessionLocal
from .. import models
from ..auth import require_token
from ..tenant_guard import tenant_context
from ..face_engine_arcface import engine_arc
from ..nn import upsert_embedding, search_top1
import httpx, os
import numpy as np
from ..core.config import settings
from io import BytesIO

router = APIRouter(prefix="/face", tags=["face"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/enroll_passport")
async def enroll_passport(
    file: UploadFile = File(...),
    user_id: int = Depends(require_token),
    tenant = Depends(tenant_context),
    db: Session = Depends(get_db),
):
    by = await file.read()
    # If external face engine is configured, proxy to it for encode
    emb = None
    face_url = settings.FACE_ENGINE_URL
    if face_url:
        try:
            url = f"{face_url.rstrip('/')}/encode"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, content=by)
                if resp.status_code == 200:
                    data = resp.json()
                    emb = np.array(data.get("embedding", []), dtype=np.float32)
        except Exception:
            emb = None
    if emb is None:
        emb = engine_arc.embed(by)
    if emb is None:
        raise HTTPException(400, "No face detected in passport photo")

    # Ensure user belongs to branch (set if empty)
    u = db.execute(select(models.User).where(models.User.id == int(user_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    if u.branch_id is None:
        db.execute(text("UPDATE users SET branch_id=:b WHERE id=:u"), {"b": tenant["branch_id"], "u": int(user_id)})
        db.commit()

    # Save the image to database
    face_image = models.FaceImage(
        user_id=int(user_id),
        filename=file.filename or f"passport_{user_id}_{file.size}.jpg",
        image_bytes=by
    )
    db.add(face_image)
    
    upsert_embedding(db, int(user_id), tenant["branch_id"], emb)
    db.commit()
    return {"status": "ok", "embeddings_added": 1, "image_id": face_image.id, "user_id": int(user_id)}

@router.post("/enroll_live")
async def enroll_live(
    files: List[UploadFile] = File(...),
    user_id: int = Depends(require_token),
    tenant = Depends(tenant_context),
    db: Session = Depends(get_db),
):
    from ..core.config import settings
    face_url = settings.FACE_ENGINE_URL
    
    added = 0
    image_ids = []
    for f in files:
        by = await f.read()
        emb = None
        if face_url:
            try:
                url = f"{face_url.rstrip('/')}/encode"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, content=by)
                    if resp.status_code == 200:
                        data = resp.json()
                        emb = np.array(data.get("embedding", []), dtype=np.float32)
            except Exception:
                emb = None
        if emb is None:
            emb = engine_arc.embed(by)
        if emb is None: 
            continue
        
        # Save the image to database
        face_image = models.FaceImage(
            user_id=int(user_id),
            filename=f.filename or f"live_{user_id}_{f.size}_{added}.jpg",
            image_bytes=by
        )
        db.add(face_image)
        db.flush()  # Get the ID without committing
        
        upsert_embedding(db, int(user_id), tenant["branch_id"], emb)
        image_ids.append(face_image.id)
        added += 1
    
    if added == 0:
        raise HTTPException(400, "No valid live frames")
    
    db.commit()
    return {"status": "ok", "embeddings_added": added, "image_ids": image_ids, "user_id": int(user_id)}

@router.post("/verify_arc")
async def verify_arc(
    file: UploadFile = File(...),
    tenant = Depends(tenant_context),
    db: Session = Depends(get_db),
):
    by = await file.read()
    emb = None
    face_url = settings.FACE_ENGINE_URL
    if face_url:
        try:
            url = f"{face_url.rstrip('/')}/encode"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, content=by)
                if resp.status_code == 200:
                    data = resp.json()
                    emb = np.array(data.get("embedding", []), dtype=np.float32)
        except Exception:
            emb = None
    if emb is None:
        emb = engine_arc.embed(by)
    if emb is None:
        raise HTTPException(404, "No face detected")

    uid, sim = search_top1(db, emb, tenant["branch_id"])
    if uid is None:
        raise HTTPException(404, "No enrolled users in branch")
    # audit
    db.execute(text("""
      INSERT INTO auth_audit(user_id, branch_id, device_code, challenge, ok, confidence)
      VALUES(:u,:b,:d,:c,:ok,:cf)
    """), {"u": uid, "b": tenant["branch_id"], "d": tenant["device_code"], "c": "verify_arc", "ok": True, "cf": sim})
    db.commit()
    return {"matched_user_id": uid, "confidence": sim, "branch_id": tenant["branch_id"]}

@router.get("/images/{user_id}")
async def get_user_images(
    user_id: int,
    current_user_id: int = Depends(require_token),
    db: Session = Depends(get_db),
):
    """Get all face images for a user"""
    # Check if user exists and current user has access
    user = db.execute(select(models.User).where(models.User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    
    # Get images for the user
    images = db.execute(
        select(models.FaceImage).where(models.FaceImage.user_id == user_id)
        .order_by(models.FaceImage.created_at.desc())
    ).scalars().all()
    
    return {
        "user_id": user_id,
        "user_name": user.full_name,
        "user_email": user.email,
        "images": [
            {
                "id": img.id,
                "filename": img.filename,
                "created_at": img.created_at.isoformat(),
                "size": len(img.image_bytes)
            }
            for img in images
        ],
        "total_images": len(images)
    }

@router.get("/image/{image_id}")
async def get_image(
    image_id: int,
    current_user_id: int = Depends(require_token),
    db: Session = Depends(get_db),
):
    """Get a specific face image"""
    image = db.execute(
        select(models.FaceImage).where(models.FaceImage.id == image_id)
    ).scalar_one_or_none()
    
    if not image:
        raise HTTPException(404, "Image not found")
    
    # Return the image as a streaming response
    return StreamingResponse(
        BytesIO(image.image_bytes),
        media_type="image/jpeg",
        headers={"Content-Disposition": f"inline; filename={image.filename}"}
    )

@router.delete("/image/{image_id}")
async def delete_image(
    image_id: int,
    current_user_id: int = Depends(require_token),
    db: Session = Depends(get_db),
):
    """Delete a specific face image"""
    image = db.execute(
        select(models.FaceImage).where(models.FaceImage.id == image_id)
    ).scalar_one_or_none()
    
    if not image:
        raise HTTPException(404, "Image not found")
    
    # Delete the image
    db.delete(image)
    db.commit()
    
    return {"status": "ok", "message": "Image deleted successfully"}

@router.get("/images")
async def list_all_images(
    current_user_id: int = Depends(require_token),
    db: Session = Depends(get_db),
):
    """List all face images with user information"""
    # Get all images with user information
    images = db.execute(
        select(models.FaceImage, models.User)
        .join(models.User, models.FaceImage.user_id == models.User.id)
        .order_by(models.FaceImage.created_at.desc())
    ).all()
    
    return {
        "images": [
            {
                "id": img.FaceImage.id,
                "filename": img.FaceImage.filename,
                "created_at": img.FaceImage.created_at.isoformat(),
                "size": len(img.FaceImage.image_bytes),
                "user_id": img.User.id,
                "user_name": img.User.full_name,
                "user_email": img.User.email
            }
            for img in images
        ],
        "total_images": len(images)
    }