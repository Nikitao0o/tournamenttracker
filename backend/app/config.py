import os
from pathlib import Path
from pydantic import BaseModel, Field


def _load_env_file():
    """Loads environment variables from .env file if it exists."""
    possible_paths = [
        Path(".env"),
        Path("backend/.env"),
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
    ]
    for p in possible_paths:
        if p.exists() and p.is_file():
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key not in os.environ:
                        os.environ[key] = val
            break


_load_env_file()


class Settings(BaseModel):
    """Application and database configuration settings."""

    APP_TITLE: str = "Tournament Tracker API"
    APP_VERSION: str = "0.2.0"
    DEBUG: bool = Field(default_factory=lambda: os.getenv("DEBUG", "False").lower() in ("true", "1", "t"))

    # PostgreSQL connection parameters
    POSTGRES_USER: str = Field(default_factory=lambda: os.getenv("POSTGRES_USER", "tracker"))
    POSTGRES_PASSWORD: str = Field(default_factory=lambda: os.getenv("POSTGRES_PASSWORD", "tracker"))
    POSTGRES_DB: str = Field(default_factory=lambda: os.getenv("POSTGRES_DB", "tracker"))
    POSTGRES_HOST: str = Field(default_factory=lambda: os.getenv("POSTGRES_HOST", "localhost"))
    POSTGRES_PORT: int = Field(default_factory=lambda: int(os.getenv("POSTGRES_PORT", "5432")))

    # Direct database connection URL (takes priority if provided)
    DATABASE_URL: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", ""))

    # Static uploads directory for logos and avatars
    UPLOAD_DIR: Path = Field(
        default_factory=lambda: Path(os.getenv("UPLOAD_DIR", "uploads")).resolve()
    )

    def get_database_url(self) -> str:
        """Returns the final database connection URL.
        If DATABASE_URL environment variable is set, it is used directly.
        If running in Docker or psycopg driver is available, builds PostgreSQL URL.
        If running locally and psycopg driver is absent, falls back to SQLite.
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL

        postgres_url = (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

        if self.POSTGRES_HOST == "db" or os.getenv("DOCKER_CONTAINER"):
            return postgres_url

        try:
            import psycopg  # noqa: F401
            return postgres_url
        except ImportError:
            return "sqlite:///./tracker.db"


settings = Settings()
