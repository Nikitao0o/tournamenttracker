from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

DATABASE_URL = settings.get_database_url()

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
    """FastAPI вызывает эту зависимость для каждого запроса,
    предоставляя сессию БД и автоматически закрывая её после ответа."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
