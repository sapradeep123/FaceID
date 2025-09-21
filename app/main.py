import os
import psycopg2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import Base, engine, SessionLocal
from . import models
from .routers import auth_router, face_router, liveness_router
from .auth import hash_password

# Create tables (DDL is handled by migrations.sql; this is safe)
models.Base.metadata.create_all(bind=engine)

# Enable CORS for frontend localhost
app = FastAPI(title="FaceID Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(face_router.router)
app.include_router(liveness_router.router)

@app.get("/")
def root():
    return {"status": "ok", "env": os.getenv("ENV", "dev")}


def _ensure_database_exists():
    """Create target database if it does not exist by connecting to 'postgres'."""
    db_user = os.getenv("POSTGRES_USER")
    db_pass = os.getenv("POSTGRES_PASSWORD")
    db_name = os.getenv("POSTGRES_DB")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = int(os.getenv("DB_PORT", "5432"))
    if not all([db_user, db_pass, db_name]):
        return
    try:
        conn = psycopg2.connect(dbname="postgres", user=db_user, password=db_pass, host=db_host, port=db_port)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone() is not None
        if not exists:
            cur.execute(f"CREATE DATABASE {psycopg2.sql.Identifier(db_name).string}")
        cur.close()
        conn.close()
    except Exception as exc:
        # Log but continue; may not have permissions
        print(f"[startup] ensure db exists skipped: {exc}")


def _run_migrations_if_needed():
    """Execute migrations.sql on startup to ensure vector extension and tables exist.
    Safe to run multiple times (DDL uses IF NOT EXISTS)."""
    try:
        import pathlib
        migrations_path = pathlib.Path(__file__).resolve().parents[1] / "migrations.sql"
        if migrations_path.exists():
            with open(migrations_path, "r", encoding="utf-8") as f:
                sql_script = f.read()
            with engine.begin() as conn:
                conn.exec_driver_sql(sql_script)
    except Exception as exc:
        # Log but don't block app startup
        print(f"[startup] migrations skipped: {exc}")


@app.on_event("startup")
def seed_defaults():
    _ensure_database_exists()
    _run_migrations_if_needed()
    """Seed default branch and device if not present so tenant headers work out of the box."""
    db = SessionLocal()
    try:
        # Ensure default branch exists
        res = db.execute(text("SELECT id FROM branches WHERE code=:c"), {"c": "main-branch"}).first()
        if not res:
            db.execute(
                text("INSERT INTO branches(org_id, code, name) VALUES (:o,:c,:n)"),
                {"o": "default", "c": "main-branch", "n": "Main Branch"},
            )
            db.commit()

        # Get branch id for seeding users/devices
        br = db.execute(text("SELECT id FROM branches WHERE code=:c"), {"c": "main-branch"}).first()
        branch_id = br[0] if br else None

        # Ensure a default device exists and active
        db.execute(text(
            """
            INSERT INTO devices(branch_id, device_code, active)
            SELECT b.id, :dc, 1
            FROM branches b
            WHERE b.code = :bc
            ON CONFLICT (device_code) DO NOTHING
            """
        ), {"dc": "web-client", "bc": "main-branch"})
        db.commit()

        # Seed admin users if not exists (use example.com which passes EmailStr)
        for admin_email in ("admin@example.com", "admin@local.test"):
            existing = db.execute(text("SELECT id FROM users WHERE email=:e"), {"e": admin_email}).first()
            if not existing and branch_id is not None:
                db.execute(text(
                    """
                    INSERT INTO users(email, password_hash, full_name, org_id, branch_id)
                    VALUES (:e, :ph, :fn, :org, :bid)
                    """
                ), {
                    "e": admin_email,
                    "ph": hash_password("Admin@12345"),
                    "fn": "Admin User",
                    "org": "default",
                    "bid": branch_id,
                })
                db.commit()
    finally:
        db.close()