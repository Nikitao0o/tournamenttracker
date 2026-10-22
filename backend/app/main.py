from contextlib import asynccontextmanager
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    swagger_ui_parameters={"persistAuthorization": True},
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Global exception handler guaranteeing CORS headers are always returned on 500 errors.
    Prevents browsers and Swagger UI from encountering 'Failed to fetch / CORS' on server faults.
    """
    traceback.print_exc()
    response = JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {exc}"},
    )
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
