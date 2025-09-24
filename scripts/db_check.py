import os
import psycopg2


def main() -> None:
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    db = os.getenv("POSTGRES_DB", "faceid")
    host = os.getenv("DB_HOST", "localhost")
    port = int(os.getenv("DB_PORT", "5432"))

    conn = psycopg2.connect(user=user, password=password, dbname=db, host=host, port=port)
    cur = conn.cursor()
    for tbl in ("branches", "devices", "users"):
        try:
            cur.execute(f"SELECT count(*) FROM {tbl}")
            count = cur.fetchone()[0]
            print(f"{tbl}: {count}")
        except Exception as exc:
            print(f"{tbl}: ERROR {exc}")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()


