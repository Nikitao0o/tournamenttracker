from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import leaderboards, matches, players, teams, tournaments


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация при старте приложения: создание таблиц и заполнение данными."""
    Base.metadata.create_all(bind=engine)
    from .seed import seed_if_empty
    seed_if_empty()
    yield


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description="REST API для управления киберспортивными турнирами, командами, игроками и матчами.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tournaments.router)
app.include_router(matches.router)
app.include_router(teams.router)
app.include_router(players.router)
app.include_router(leaderboards.router)


@app.get("/api/health", tags=["meta"], summary="Проверка доступности сервиса")
def health():
    return {"status": "ok", "version": settings.APP_VERSION}
