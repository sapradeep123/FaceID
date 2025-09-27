import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import Base, engine, SessionLocal
from . import models
from .routers import auth_router, face_router, liveness_router
from .auth import hash_password
from .core.config import settings

# Optional psycopg (psycopg3) for local DB ensure
try:
    import psycopg  # type: ignore
except Exception:  # pragma: no cover
    psycopg = None  # noqa: N816

# Create tables (DDL is handled by migrations.sql; this is safe)
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as exc:
    # Database may not be available during startup - this is handled in startup event
    print(f"[startup] Database table creation skipped: {exc}")

# Enable CORS for configured origins
app = FastAPI(title=settings.PROJECT_NAME, version=settings.APP_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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
    if psycopg is None:
        return
    db_user = os.getenv("POSTGRES_USER")
    db_pass = os.getenv("POSTGRES_PASSWORD")
    db_name = os.getenv("POSTGRES_DB")
    db_host = settings.DB_HOST
    db_port = int(settings.DB_PORT)
    if not all([db_user, db_pass, db_name]):
        return
    try:
        dsn_root = f"host={db_host} port={db_port} dbname=postgres user={db_user} password={db_pass}"
        with psycopg.connect(dsn_root, autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
                exists = cur.fetchone() is not None
                if not exists:
                    cur.execute(f"CREATE DATABASE {db_name}")
    except Exception as exc:  # pragma: no cover
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
    except Exception as exc:  # pragma: no cover
        # Log but don't block app startup
        print(f"[startup] migrations skipped: {exc}")


@app.on_event("startup")
def seed_defaults():
    """Seed default branch and device if not present so tenant headers work out of the box."""
    try:
        _ensure_database_exists()
        _run_migrations_if_needed()
        db = SessionLocal()
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
            SELECT b.id, :dc, TRUE
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
        db.close()
    except Exception as exc:  # pragma: no cover
        # Log but continue; database may not be available
        print(f"[startup] seed defaults skipped: {exc}")