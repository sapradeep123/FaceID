from fastapi import Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from .database import SessionLocal
from . import models
from typing import Optional

def _db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def tenant_context(
    x_org_id: str | None = Header(default=None),
    x_branch_code: str | None = Header(default=None),
    x_device_code: Optional[str] = Header(default=None),
):
    if not x_org_id or not x_branch_code:
        raise HTTPException(400, "Missing X-Org-Id or X-Branch-Code")
    db: Session = next(_db())
    br = db.execute(select(models.Branch).where(models.Branch.code == x_branch_code)).scalar_one_or_none()
    if not br:
        raise HTTPException(404, "Branch not found")
    if x_device_code:
        dev = db.execute(
            select(models.Device).where(
                models.Device.device_code == x_device_code,
                models.Device.branch_id == br.id
            )
        ).scalar_one_or_none()
        if not dev or not bool(dev.active):
            raise HTTPException(401, "Unregistered or inactive device")
    return {"org_id": x_org_id, "branch_id": br.id, "device_code": x_device_code}