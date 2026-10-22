from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine, sync_db_schema
from .routers import admin, auth, leaderboards, matches, players, teams, tournaments


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup initialization: database schema creation, sync and seed."""
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (settings.UPLOAD_DIR / "teams").mkdir(parents=True, exist_ok=True)
    (settings.UPLOAD_DIR / "players").mkdir(parents=True, exist_ok=True)

    Base.metadata.create_all(bind=engine)
    sync_db_schema()
    from .seed import seed_if_empty
    seed_if_empty()
    yield


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description="REST API for esports tournaments, multi-type brackets (Double/Single Elimination, Round Robin, Swiss), teams, matches, and user accounts.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static uploads route
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Router registrations
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(tournaments.router)
app.include_router(matches.router)
app.include_router(teams.router)
app.include_router(players.router)
app.include_router(leaderboards.router)


@app.get("/api/health", tags=["meta"], summary="Service health check")
def health():
    return {"status": "ok", "version": settings.APP_VERSION}
