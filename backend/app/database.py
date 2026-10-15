from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# SQLite файл появится рядом с проектом
DATABASE_URL = "sqlite:///./tracker.db"

# check_same_thread=False нужен только для SQLite
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

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