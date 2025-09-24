import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv
import psycopg2


def read_sql_file(path: Path) -> str:
    with path.open("r", encoding="utf-8") as f:
        return f.read()


def ensure_database_exists():
    load_dotenv(find_dotenv())
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres")
    db_name = os.getenv("POSTGRES_DB", "faceid")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = int(os.getenv("DB_PORT", "5432"))

    conn = psycopg2.connect(dbname="postgres", user=db_user, password=db_pass, host=db_host, port=db_port)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
    exists = cur.fetchone() is not None
    if not exists:
        cur.execute(f"CREATE DATABASE {db_name}")
        print(f"Created database: {db_name}")
    else:
        print(f"Database already exists: {db_name}")
    cur.close()
    conn.close()


def run_migrations():
    load_dotenv(find_dotenv())
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres")
    db_name = os.getenv("POSTGRES_DB", "faceid")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = int(os.getenv("DB_PORT", "5432"))

    sql_path = Path(__file__).resolve().parents[1] / "migrations.sql"
    sql = read_sql_file(sql_path)

    conn = psycopg2.connect(dbname=db_name, user=db_user, password=db_pass, host=db_host, port=db_port)
    conn.autocommit = True
    cur = conn.cursor()
    try:
        cur.execute(sql)
        print("Migrations applied")
    except Exception as exc:
        # If pgvector is unavailable, apply a reduced schema without the extension and vector types
        msg = str(exc).lower()
        needs_fallback = (
            "extension \"vector\" is not available" in msg or
            "type \"vector\" does not exist" in msg or
            "pgvector" in msg
        )
        if not needs_fallback:
            raise
        print("pgvector not available; applying fallback schema without vector extension")
        fallback_sql = """
        -- Fallback schema: no pgvector
        CREATE TABLE IF NOT EXISTS branches (
          id SERIAL PRIMARY KEY,
          org_id VARCHAR(64) NOT NULL DEFAULT 'default',
          code VARCHAR(64) UNIQUE NOT NULL,
          name VARCHAR(128) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS devices (
          id SERIAL PRIMARY KEY,
          branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
          device_code VARCHAR(128) UNIQUE NOT NULL,
          active BOOLEAN DEFAULT TRUE
        );

        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          org_id VARCHAR(64) DEFAULT 'default',
          branch_id INT REFERENCES branches(id),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS face_images (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          filename VARCHAR(255),
          image_bytes BYTEA NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Audit table used by liveness/verify endpoints
        CREATE TABLE IF NOT EXISTS auth_audit (
          id BIGSERIAL PRIMARY KEY,
          user_id INT,
          branch_id INT,
          device_code VARCHAR(128),
          challenge VARCHAR(32),
          ok BOOLEAN,
          confidence REAL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        """
        cur.execute(fallback_sql)
        print("Fallback migrations applied")
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    ensure_database_exists()
    run_migrations()
    print("DB ready")


