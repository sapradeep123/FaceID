import os
import psycopg
from dotenv import load_dotenv, find_dotenv

# Load environment variables from .env
load_dotenv(find_dotenv())

def main() -> None:
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    db = os.getenv("POSTGRES_DB", "faceid")
    host = os.getenv("DB_HOST", "localhost")
    port = int(os.getenv("DB_PORT", "5432"))

    dsn = f"host={host} port={port} dbname={db} user={user} password={password}"
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            for tbl in ("branches", "devices", "users"):
                try:
                    cur.execute(f"SELECT count(*) FROM {tbl}")
                    count = cur.fetchone()[0]
                    print(f"{tbl}: {count}")
                except Exception as exc:
                    print(f"{tbl}: ERROR {exc}")


if __name__ == "__main__":
    main()


