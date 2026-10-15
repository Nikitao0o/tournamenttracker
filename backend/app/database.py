from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os

# SQLite файл появится рядом с проектом
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tracker.db")

connect_args = (
    {"check_same_thread": False}
    if make_url(DATABASE_URL).get_backend_name() == "sqlite"
    else {}
)
engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI будет вызывать эту функцию для каждого запроса,
    чтобы получить сессию БД и закрыть её после ответа."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()