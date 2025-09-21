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
    cur.execute(sql)
    cur.close()
    conn.close()
    print("Migrations applied")


if __name__ == "__main__":
    ensure_database_exists()
    run_migrations()
    print("DB ready")


