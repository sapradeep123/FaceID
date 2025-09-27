from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
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

    upsert_embedding(db, int(user_id), tenant["branch_id"], emb)
    return {"status": "ok", "embeddings_added": 1}

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
        upsert_embedding(db, int(user_id), tenant["branch_id"], emb)
        added += 1
    if added == 0:
        raise HTTPException(400, "No valid live frames")
    return {"status": "ok", "embeddings_added": added}

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