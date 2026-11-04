import os
import sys
import logging
from pathlib import Path
from pydantic import BaseModel, Field

logger = logging.getLogger("tournament_tracker")


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
    APP_VERSION: str = "0.3.0"
    ENVIRONMENT: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    DEBUG: bool = Field(default_factory=lambda: os.getenv("DEBUG", "False").lower() in ("true", "1", "t"))

    SECRET_KEY: str = Field(
        default_factory=lambda: os.getenv(
            "SECRET_KEY", "tournament-tracker-super-secret-key-2026-development-only"
        )
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default_factory=lambda: int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default_factory=lambda: int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    )

    AUTO_SEED: bool = Field(
        default_factory=lambda: os.getenv("AUTO_SEED", "True").lower() in ("true", "1", "t")
    )
    ADMIN_EMAIL: str = Field(default_factory=lambda: os.getenv("ADMIN_EMAIL", "admin@local.com"))
    ADMIN_PASSWORD: str = Field(default_factory=lambda: os.getenv("ADMIN_PASSWORD", "admin"))

    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv(
                "ALLOWED_ORIGINS",
                "http://localhost:5173,http://localhost:8000,http://127.0.0.1:5173,http://127.0.0.1:8000",
            ).split(",")
            if origin.strip()
        ]
    )

    POSTGRES_USER: str = Field(default_factory=lambda: os.getenv("POSTGRES_USER", "tracker"))
    POSTGRES_PASSWORD: str = Field(default_factory=lambda: os.getenv("POSTGRES_PASSWORD", "tracker"))
    POSTGRES_DB: str = Field(default_factory=lambda: os.getenv("POSTGRES_DB", "tracker"))
    POSTGRES_HOST: str = Field(default_factory=lambda: os.getenv("POSTGRES_HOST", "localhost"))
    POSTGRES_PORT: int = Field(default_factory=lambda: int(os.getenv("POSTGRES_PORT", "5432")))

    DATABASE_URL: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", ""))

    UPLOAD_DIR: Path = Field(
        default_factory=lambda: Path(os.getenv("UPLOAD_DIR", "uploads")).resolve()
    )

    def validate_production_security(self):
        """Enforces that SECRET_KEY is not default in production and logs warning for default admin password."""
        is_prod = self.ENVIRONMENT.lower() in ("production", "prod") or (
            not self.DEBUG and os.getenv("DOCKER_CONTAINER")
        )
        if is_prod and "development-only" in self.SECRET_KEY:
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: SECRET_KEY must be explicitly set in production! "
                "Default development secret cannot be used."
            )
        if is_prod and self.ADMIN_PASSWORD == "admin":
            logger.warning(
                "SECURITY WARNING: Production environment is using default ADMIN_PASSWORD='admin'. "
                "Please set a strong ADMIN_PASSWORD in your production environment variables."
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
settings.validate_production_security()
