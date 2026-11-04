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


def hash_refresh_token(token_str: str) -> str:
    """Returns the SHA-256 digest of the refresh token to prevent plain-text storage."""
    return hashlib.sha256(token_str.encode("utf-8")).hexdigest()


def cleanup_stale_refresh_tokens(db: Session) -> None:
    """Removes expired or revoked refresh token records older than 30 days."""
    from .models import RefreshToken

    try:
        cutoff = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) - datetime.timedelta(days=30)
        db.query(RefreshToken).filter(RefreshToken.created_at < cutoff).delete(synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()


def create_refresh_token(db: Session, user_id: int) -> str:
    """Generates and persists a cryptographically secure refresh token for the user session."""
    from .models import RefreshToken

    cleanup_stale_refresh_tokens(db)
    raw_token = secrets.token_urlsafe(64)
    token_hash = hash_refresh_token(raw_token)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    db_token = RefreshToken(
        token_hash=token_hash,
        user_id=user_id,
        expires_at=expires_at.replace(tzinfo=None),
        revoked=False,
        revoked_at=None,
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return raw_token


def verify_and_rotate_refresh_token(db: Session, token_str: str):
    """Validates refresh token, checks for revoked token reuse, and performs rotation.
    Returns (user, new_raw_token, status_reason).
    """
    from .models import RefreshToken

    if not token_str:
        return None, None, "missing"

    token_hash = hash_refresh_token(token_str)
    token_record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if not token_record:
        return None, None, "not_found"

    now_naive = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

    # Token reuse detection: if token was already revoked, revoke all tokens for this user
    if token_record.revoked or token_record.revoked_at is not None:
        db.query(RefreshToken).filter(
            RefreshToken.user_id == token_record.user_id,
            RefreshToken.revoked.is_(False),
        ).update({"revoked": True, "revoked_at": now_naive}, synchronize_session=False)
        db.commit()
        return None, None, "revoked_reuse"

    # Check expiration
    if token_record.expires_at < now_naive:
        token_record.revoked = True
        token_record.revoked_at = now_naive
        db.commit()
        return None, None, "expired"

    user = token_record.user
    if not user or not user.is_active:
        return None, None, "inactive"

    # Revoke old token
    token_record.revoked = True
    token_record.revoked_at = now_naive

    # Issue new rotated refresh token
    new_raw_token = secrets.token_urlsafe(64)
    new_token_hash = hash_refresh_token(new_raw_token)
    new_expires = now_naive + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    new_token_record = RefreshToken(
        token_hash=new_token_hash,
        user_id=user.id,
        expires_at=new_expires,
        revoked=False,
        revoked_at=None,
    )
    db.add(new_token_record)
    db.commit()

    return user, new_raw_token, "ok"


def verify_refresh_token(db: Session, token_str: str):
    """Validates that a refresh token exists, is not revoked, and has not expired."""
    from .models import RefreshToken

    if not token_str:
        return None

    token_hash = hash_refresh_token(token_str)
    token_record = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash, RefreshToken.revoked.is_(False))
        .first()
    )
    if not token_record:
        return None

    now_naive = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    if token_record.expires_at < now_naive:
        token_record.revoked = True
        token_record.revoked_at = now_naive
        db.commit()
        return None

    return token_record


def revoke_refresh_token(db: Session, token_str: str) -> bool:
    """Revokes a refresh token on user logout."""
    from .models import RefreshToken

    if not token_str:
        return False

    token_hash = hash_refresh_token(token_str)
    token_record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if token_record:
        if not token_record.revoked:
            token_record.revoked = True
            token_record.revoked_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
            db.commit()
        return True
    return False


def ensure_admin(db: Session):
    """Idempotently ensures the primary administrator account exists based on ADMIN_EMAIL/ADMIN_PASSWORD."""
    from .models import User

    admin_email = settings.ADMIN_EMAIL.strip().lower()
    admin = db.query(User).filter(User.email == admin_email).first()
    if admin:
        if not admin.is_admin:
            admin.is_admin = True
            db.commit()
            db.refresh(admin)
        return admin

    pw_hash, salt = hash_password(settings.ADMIN_PASSWORD)
    admin = User(
        email=admin_email,
        nickname="admin",
        hashed_password=pw_hash,
        salt=salt,
        is_active=True,
        is_admin=True,
        created_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def is_user_admin(user=None, is_admin_flag: bool | None = None) -> bool:
    """Checks whether a user has administrator privileges strictly based on User.is_admin flag."""
    if user is not None and hasattr(user, "is_admin"):
        return bool(user.is_admin)
    if is_admin_flag is not None and isinstance(is_admin_flag, bool):
        return is_admin_flag
    return False


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
    """Requires administrator privileges (user.is_admin)."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Action allowed only for tournament administrators.",
        )
    return current_user
