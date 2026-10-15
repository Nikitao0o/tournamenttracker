from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import leaderboards, matches, players, teams, tournaments


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Выполняется один раз при старте приложения
    Base.metadata.create_all(bind=engine)
    # Импорт внутри функции, чтобы избежать циклических зависимостей
    from .seed import seed_if_empty
    seed_if_empty()
    yield
    # Здесь можно закрывать ресурсы при остановке


app = FastAPI(
    title="Tournament Tracker API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # в docker-режиме фронт ходит через nginx-прокси, CORS не нужен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tournaments.router)
app.include_router(matches.router)
app.include_router(teams.router)
app.include_router(players.router)
app.include_router(leaderboards.router)


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}