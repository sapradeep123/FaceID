import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv
import psycopg


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

    # Connect to default 'postgres' database
    dsn_root = f"host={db_host} port={db_port} dbname=postgres user={db_user} password={db_pass}"
    with psycopg.connect(dsn_root, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
            exists = cur.fetchone() is not None
            if not exists:
                cur.execute(f"CREATE DATABASE {db_name}")
                print(f"Created database: {db_name}")
            else:
                print(f"Database already exists: {db_name}")


def run_migrations():
    load_dotenv(find_dotenv())
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres")
    db_name = os.getenv("POSTGRES_DB", "faceid")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = int(os.getenv("DB_PORT", "5432"))

    sql_path = Path(__file__).resolve().parents[1] / "migrations.sql"
    sql = read_sql_file(sql_path)

    dsn = f"host={db_host} port={db_port} dbname={db_name} user={db_user} password={db_pass}"
    with psycopg.connect(dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            for statement in sql.split(';'):
                stmt = statement.strip()
                if not stmt:
                    continue
                # Skip pgvector-dependent statements proactively if extension isn't present
                lower_stmt = stmt.lower()
                if 'face_embeddings' in lower_stmt or 'ivfflat' in lower_stmt or 'vector_cosine_ops' in lower_stmt:
                    # These depend on the vector extension
                    try:
                        cur.execute("SELECT installed_version FROM pg_available_extensions WHERE name='vector'")
                        row = cur.fetchone()
                        if not row:
                            print("Skipped pgvector-dependent DDL (vector extension not available)")
                            continue
                    except Exception:
                        print("Skipped pgvector-dependent DDL (could not verify vector extension)")
                        continue
                try:
                    cur.execute(stmt)
                except Exception as e:
                    msg = str(e)
                    if ('extension "vector" is not available' in msg or
                        'type "vector" does not exist' in msg or
                        'index method "ivfflat" does not exist' in msg or
                        'operator class "vector_cosine_ops" does not exist' in msg or
                        'relation "face_embeddings" does not exist' in msg):
                        print(f"Skipped vector-related statement: {e}")
                        continue
                    raise
    print("Migrations applied")


if __name__ == "__main__":
    ensure_database_exists()
    run_migrations()
    print("DB ready")


