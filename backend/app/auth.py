import datetime
import hashlib
import hmac
import secrets
from pathlib import Path

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db

security_bearer = HTTPBearer(auto_error=False)

try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError
    _hasher = PasswordHasher(
        time_cost=3,
        memory_cost=65536,
        parallelism=4,
        hash_len=32,
        salt_len=16,
    )
except ImportError:
    _hasher = None


def hash_password(password: str) -> tuple[str, str]:
    """Computes a cryptographically secure Argon2id hash (or OWASP 600k+ PBKDF2 fallback)."""
    if _hasher is not None:
        hashed = _hasher.hash(password)
        return hashed, ""

    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        600_000,
    ).hex()
    return hashed, salt


def verify_password(password: str, hashed: str, salt: str = "") -> bool:
    """Verifies that a password matches its hash (supports Argon2 and PBKDF2)."""
    if hashed.startswith("$argon2"):
        if _hasher is None:
            return False
        try:
            return _hasher.verify(hashed, password)
        except Exception:
            return False

    # PBKDF2 fallback (handles both 600k and legacy 100k)
    for rounds in (600_000, 100_000):
        check = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            rounds,
        ).hex()
        if hmac.compare_digest(check, hashed):
            return True
    return False


def create_access_token(user_id: int, email: str, nickname: str, is_admin: bool = False) -> str:
    """Creates a strictly signed JWT access token with expiration."""
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "nickname": nickname,
        "is_admin": is_admin,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict | None:
    """Strictly verifies JWT signature and expiration.
    Returns decoded payload if authentic, None otherwise.
    """
    try:
        raw = token.strip()
        if raw.lower().startswith("bearer "):
            raw = raw[7:].strip()

        payload = jwt.decode(
            raw,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.PyJWTError:
        return None
    except Exception:
        return None


def create_refresh_token(db: Session, user_id: int) -> str:
    """Generates and persists a cryptographically secure refresh token for the user session."""
    from .models import RefreshToken

    raw_token = secrets.token_urlsafe(64)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    db_token = RefreshToken(
        token=raw_token,
        user_id=user_id,
        expires_at=expires_at.replace(tzinfo=None),
        revoked=False,
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return raw_token


def verify_refresh_token(db: Session, token_str: str):
    """Validates that a refresh token exists, is not revoked, and has not expired."""
    from .models import RefreshToken

    token_record = (
        db.query(RefreshToken)
        .filter(RefreshToken.token == token_str, RefreshToken.revoked.is_(False))
        .first()
    )
    if not token_record:
        return None

    now_naive = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    if token_record.expires_at < now_naive:
        token_record.revoked = True
        db.commit()
        return None

    return token_record


def revoke_refresh_token(db: Session, token_str: str) -> bool:
    """Revokes a refresh token on user logout."""
    from .models import RefreshToken

    token_record = db.query(RefreshToken).filter(RefreshToken.token == token_str).first()
    if token_record:
        token_record.revoked = True
        db.commit()
        return True
    return False


def get_admin_identifiers() -> set[str]:
    """Reads administrator email addresses from admins.txt.
    Evaluated dynamically so file edits take effect immediately without restart.
    """
    possible_paths = [
        Path("/app/admins.txt"),
        Path("admins.txt"),
        Path("backend/admins.txt"),
        Path(__file__).resolve().parent / "admins.txt",
        Path(__file__).resolve().parent.parent / "admins.txt",
        Path(__file__).resolve().parent.parent.parent / "admins.txt",
    ]
    admins = set()
    for p in possible_paths:
        if p.exists() and p.is_file():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        admins.add(line.lower())
            except Exception:
                pass
            if admins:
                break
    return admins


def is_user_admin(email: str, flag_or_nick: bool | str | None = None) -> bool:
    """Checks whether a user is an administrator based on DB flag or admins.txt email list.
    Strictly checks EMAIL only; never checks nickname to prevent spoofing.
    """
    if isinstance(flag_or_nick, bool) and flag_or_nick:
        return True
    admins = get_admin_identifiers()
    return email.strip().lower() in admins


def get_current_user_optional(
    auth: HTTPAuthorizationCredentials | None = Depends(security_bearer),
    db: Session = Depends(get_db),
):
    """Returns the current authenticated User if a valid bearer token is provided, or None."""
    if not auth or not auth.credentials:
        return None

    payload = decode_access_token(auth.credentials)
    if not payload:
        return None

    user_id_raw = payload.get("sub")
    if not user_id_raw:
        return None

    try:
        user_id = int(user_id_raw)
    except (ValueError, TypeError):
        return None

    from .models import User
    user = db.get(User, user_id)
    if not user or not user.is_active:
        return None
    return user


def get_current_user(
    auth: HTTPAuthorizationCredentials | None = Depends(security_bearer),
    db: Session = Depends(get_db),
):
    """Requires authentication. Returns the authenticated User model or raises 401."""
    user = get_current_user_optional(auth, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required (invalid or missing Bearer token)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_admin(
    current_user = Depends(get_current_user),
):
    """Requires administrator privileges (user.is_admin or email in admins.txt)."""
    if not is_user_admin(current_user.email, current_user.is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Action allowed only for tournament administrators.",
        )
    return current_user
