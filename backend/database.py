import os
import time
import psycopg2
import psycopg2.extensions

# Automatically load .env if present in backend or project root
def _load_env():
    for base in [os.path.dirname(__file__), os.path.dirname(os.path.dirname(__file__))]:
        env_file = os.path.join(base, ".env")
        if os.path.isfile(env_file):
            try:
                with open(env_file, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_load_env()

def _create_connection():
    """Establish a new PostgreSQL connection with resilient timeouts and keepalives."""
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        db_url = db_url.strip().strip("'\"")
        # Ensure SSL requirement for remote connections like Neon/Supabase/Render
        if "sslmode=" not in db_url and "localhost" not in db_url and "127.0.0.1" not in db_url:
            separator = "&" if "?" in db_url else "?"
            db_url = f"{db_url}{separator}sslmode=require"
        return psycopg2.connect(
            db_url,
            connect_timeout=15,
            keepalives=1,
            keepalives_idle=30,
            keepalives_interval=10,
            keepalives_count=5
        )
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "library_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "sb1234"),
        port=os.getenv("DB_PORT", "5432"),
        connect_timeout=10
    )


class DatabaseManager:
    """Manages database connection with lazy loading and auto-reconnection on sleep/SSL disconnects."""
    def __init__(self):
        self._conn = None
        self._cursor = None

    def _is_alive(self):
        if self._conn is None or getattr(self._conn, "closed", 0) != 0:
            return False
        try:
            status = self._conn.get_transaction_status()
            if status == psycopg2.extensions.TRANSACTION_STATUS_UNKNOWN:
                return False
            return True
        except Exception:
            return False

    def get_conn(self):
        if not self._is_alive():
            self.close()
            self._conn = _create_connection()
            self._cursor = self._conn.cursor()
        return self._conn

    def get_cursor(self):
        conn = self.get_conn()
        if self._cursor is None or getattr(self._cursor, "closed", False):
            self._cursor = conn.cursor()
        return self._cursor

    def execute(self, query, params=None):
        max_retries = 3
        for attempt in range(max_retries):
            try:
                cur = self.get_cursor()
                if params is not None:
                    cur.execute(query, params)
                else:
                    cur.execute(query)
                return cur
            except (psycopg2.OperationalError, psycopg2.InterfaceError):
                # Connection dropped (e.g. Neon serverless sleep, SSL closed, AWS NAT timeout)
                self.close()
                if attempt == max_retries - 1:
                    raise
                time.sleep(0.3)
            except psycopg2.Error:
                # Rollback aborted transaction so subsequent queries aren't poisoned
                self.rollback()
                raise

    def commit(self):
        for attempt in range(2):
            try:
                if self._conn and getattr(self._conn, "closed", 0) == 0:
                    self._conn.commit()
                return
            except (psycopg2.OperationalError, psycopg2.InterfaceError):
                self.close()
                if attempt == 1:
                    raise
                time.sleep(0.3)
            except psycopg2.Error:
                self.rollback()
                raise

    def rollback(self):
        try:
            if self._conn and getattr(self._conn, "closed", 0) == 0:
                self._conn.rollback()
        except Exception:
            pass

    def fetchone(self):
        if self._cursor is None:
            raise psycopg2.ProgrammingError("no results to fetch")
        try:
            return self._cursor.fetchone()
        except (psycopg2.OperationalError, psycopg2.InterfaceError):
            self.close()
            raise
        except psycopg2.Error:
            self.rollback()
            raise

    def fetchall(self):
        if self._cursor is None:
            raise psycopg2.ProgrammingError("no results to fetch")
        try:
            return self._cursor.fetchall()
        except (psycopg2.OperationalError, psycopg2.InterfaceError):
            self.close()
            raise
        except psycopg2.Error:
            self.rollback()
            raise

    def close(self):
        try:
            if self._cursor and not getattr(self._cursor, "closed", False):
                self._cursor.close()
        except Exception:
            pass
        try:
            if self._conn and getattr(self._conn, "closed", 0) == 0:
                self._conn.close()
        except Exception:
            pass
        self._cursor = None
        self._conn = None


db_manager = DatabaseManager()


class CursorProxy:
    """Proxy for psycopg2 cursor with auto-reconnection and rollback safety."""
    def execute(self, query, params=None):
        return db_manager.execute(query, params)

    def fetchone(self):
        return db_manager.fetchone()

    def fetchall(self):
        return db_manager.fetchall()

    def close(self):
        return db_manager.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            db_manager.rollback()

    def __getattr__(self, name):
        return getattr(db_manager.get_cursor(), name)


class ConnectionProxy:
    """Proxy for psycopg2 connection with auto-reconnection and transaction management."""
    def commit(self):
        return db_manager.commit()

    def rollback(self):
        return db_manager.rollback()

    def cursor(self):
        return CursorProxy()

    def close(self):
        return db_manager.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            db_manager.rollback()
        else:
            db_manager.commit()

    def __getattr__(self, name):
        return getattr(db_manager.get_conn(), name)


# Exported instances maintain 100% backward compatibility
conn = ConnectionProxy()
cursor = CursorProxy()
