import os
from fastapi import Header, HTTPException

API_KEY = os.getenv("INTERNAL_API_KEY", "change_me")

async def require_api_key(x_api_key: str | None = Header(default=None)):
    if not x_api_key or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")