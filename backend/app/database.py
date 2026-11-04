from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

DATABASE_URL = settings.get_database_url()
is_sqlite = make_url(DATABASE_URL).get_backend_name() == "sqlite"

connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

if is_sqlite:
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        # Enable foreign key constraint enforcement in SQLite
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def sync_db_schema():
    """Applies non-destructive schema migrations for existing database tables."""
    try:
        backend_name = engine.dialect.name
        if backend_name == "postgresql":
            with engine.begin() as conn:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;")
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);")

                conn.exec_driver_sql("ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);")

                conn.exec_driver_sql(
                    "ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;"
                )
                conn.exec_driver_sql("ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);")

                conn.exec_driver_sql(
                    "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS bracket_type VARCHAR(40) DEFAULT 'double_elimination';"
                )

                conn.exec_driver_sql("ALTER TABLE matches ADD COLUMN IF NOT EXISTS start_time VARCHAR(30);")
                conn.exec_driver_sql("ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_format VARCHAR(10) DEFAULT 'BO3';")
                conn.exec_driver_sql("ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_type VARCHAR(40);")
                conn.exec_driver_sql("ALTER TABLE matches ADD COLUMN IF NOT EXISTS round_name VARCHAR(80);")
                conn.exec_driver_sql("ALTER TABLE matches ADD COLUMN IF NOT EXISTS round_order INTEGER;")
                conn.exec_driver_sql("ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_id INTEGER REFERENCES brackets(id) ON DELETE CASCADE;")
                conn.exec_driver_sql("ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_id INTEGER REFERENCES teams(id) ON DELETE SET NULL;")
                conn.exec_driver_sql("ALTER TABLE matches ADD COLUMN IF NOT EXISTS loser_id INTEGER REFERENCES teams(id) ON DELETE SET NULL;")
                conn.exec_driver_sql("ALTER TABLE matches ADD COLUMN IF NOT EXISTS next_match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL;")
                conn.exec_driver_sql("ALTER TABLE matches ADD COLUMN IF NOT EXISTS next_loser_match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL;")
                conn.exec_driver_sql("ALTER TABLE matches ALTER COLUMN team_a_id DROP NOT NULL;")
                conn.exec_driver_sql("ALTER TABLE matches ALTER COLUMN team_b_id DROP NOT NULL;")
    except Exception as e:
        print(f"[migration] Note during schema sync: {e}")


def get_db():
    """FastAPI dependency that yields a database session for each request
    and guarantees its closing afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
