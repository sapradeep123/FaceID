from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import SessionLocal
from ..auth_api_key import require_api_key
from ..tenant_guard import tenant_context
import cv2, numpy as np
try:
    import mediapipe as mp  # type: ignore
except Exception:
    mp = None
from ..face_engine_arcface import engine_arc
from ..nn import search_top1

router = APIRouter(prefix="/live", tags=["liveness"])
mp_face = mp.solutions.face_mesh if mp else None

POSE_THRESH_DEG = 12.0
SIM_THRESH = 0.45

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/challenge", dependencies=[Depends(require_api_key)])
async def challenge():
    import random
    c = random.choice(["turn_left", "turn_right", "blink", "open_mouth"])
    return {"challenge": c, "expires_in": 15}

@router.post("/verify", dependencies=[Depends(require_api_key)])
async def verify(
    challenge: str = Form(...),
    uid_hint: int | None = Form(None),
    frame_a: UploadFile = File(...),
    frame_b: UploadFile = File(...),
    tenant = Depends(tenant_context),
    db: Session = Depends(get_db),
):
    def load(b: bytes):
        arr = np.frombuffer(b, np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)

    a = load(await frame_a.read())
    b = load(await frame_b.read())
    if a is None or b is None:
        raise HTTPException(400, "Bad images")

    # Simple liveness check without MediaPipe - just check if images are different
    # This is a basic fallback when MediaPipe is not available
    if mp_face is None:
        # Simple pixel difference check as fallback
        diff = cv2.absdiff(a, b)
        mean_diff = np.mean(diff)
        liveness_passed = mean_diff > 10  # Simple threshold
        print(f"[liveness] MediaPipe not available, using simple diff check. Mean diff: {mean_diff}, passed: {liveness_passed}")
    else:
        liveness_passed = _check_liveness(a, b, challenge)

    if not liveness_passed:
        raise HTTPException(401, "Liveness failed")

    ok, uid, conf = _identify(b, db, tenant["branch_id"], uid_hint)
    db.execute(text("""
      INSERT INTO auth_audit(user_id, branch_id, device_code, challenge, ok, confidence)
      VALUES(:u,:b,:d,:c,:ok,:cf)
    """), {"u": uid or -1, "b": tenant["branch_id"], "d": tenant["device_code"], "c": challenge, "ok": ok, "cf": conf})
    db.commit()

    if not ok:
        raise HTTPException(401, "Face mismatch")
    return {"ok": True, "user_id": uid, "confidence": conf, "branch_id": tenant["branch_id"]}

def _check_liveness(a, b, challenge: str) -> bool:
    if mp_face is None:
        return False
    with mp_face.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True) as fm:
        ra = fm.process(cv2.cvtColor(a, cv2.COLOR_BGR2RGB))
        rb = fm.process(cv2.cvtColor(b, cv2.COLOR_BGR2RGB))
    if not ra.multi_face_landmarks or not rb.multi_face_landmarks:
        return False
    la, lb = ra.multi_face_landmarks[0], rb.multi_face_landmarks[0]

    def yaw(land):
        l = land.landmark[234].x; r = land.landmark[454].x; n = land.landmark[1].x
        return float((n - (l + r) / 2.0) * 100.0)

    def eye_aspect(land):
        return abs(land.landmark[159].y - land.landmark[145].y)

    def mouth_open(land):
        return abs(land.landmark[13].y - land.landmark[14].y)

    dyaw = abs(yaw(lb) - yaw(la))
    eye_delta = (eye_aspect(la) - eye_aspect(lb))
    mouth_delta = (mouth_open(lb) - mouth_open(la))

    if challenge in ("turn_left", "turn_right"):
        return dyaw >= POSE_THRESH_DEG
    if challenge == "blink":
        return eye_delta > 0.01
    if challenge == "open_mouth":
        return mouth_delta > 0.01
    return False

def _identify(bgr: np.ndarray, db: Session, branch_id: int, uid_hint: int | None):
    ok, buf = cv2.imencode(".jpg", bgr)
    if not ok: return (False, None, 0.0)
    emb = engine_arc.embed(buf.tobytes())
    if emb is None: return (False, None, 0.0)
    uid, sim = search_top1(db, emb, branch_id)
    if uid is None: return (False, None, 0.0)
    if uid_hint is not None:
        return (uid == uid_hint and sim >= SIM_THRESH, uid, float(sim))
    return (sim >= SIM_THRESH, uid, float(sim))