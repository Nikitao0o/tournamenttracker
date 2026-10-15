from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import leaderboards, matches, players, teams, tournaments

# Создаём таблицы, если их нет (не обязательно, если используешь seed)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tournament Tracker API",
    version="0.1.0",
    description="Backend for the CS tournament tracker demo.",
)

# CORS — чтобы фронт с localhost:5173 мог обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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