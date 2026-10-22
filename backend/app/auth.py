import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db

# Секретный ключ для подписи токенов
SECRET_KEY = os.getenv("SECRET_KEY", "tournament-tracker-super-secret-key-2026")
TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * 7  # 7 дней

security_bearer = HTTPBearer(auto_error=False)


# ==========================================
# Хеширование паролей (PBKDF2-HMAC-SHA256)
# ==========================================

def hash_password(password: str) -> tuple[str, str]:
    """Генерирует случайную соль и вычисляет PBKDF2 хеш пароля."""
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    ).hex()
    return hashed, salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Проверяет соответствие пароля его хешу с солью."""
    check = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    ).hex()
    return hmac.compare_digest(check, hashed)


# ==========================================
# Токены авторизации (HMAC-SHA256 Bearer Token)
# ==========================================

def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def create_access_token(user_id: int, email: str, nickname: str) -> str:
    """Создает подписанный токен доступа с временем жизни."""
    payload = {
        "sub": user_id,
        "email": email,
        "nickname": nickname,
        "exp": int(time.time()) + TOKEN_EXPIRE_SECONDS,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = _b64_encode(payload_bytes)

    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    sig_b64 = _b64_encode(signature)

    return f"{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> dict | None:
    """Проверяет подпись и срок действия токена, возвращает payload."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, sig_b64 = parts

        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"),
            payload_b64.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        provided_sig = _b64_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        payload_bytes = _b64_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        if payload.get("exp", 0) < int(time.time()):
            return None

        return payload
    except Exception:
        return None


# ==========================================
# Чтение файла администраторов (admins.txt)
# ==========================================

def get_admin_identifiers() -> set[str]:
    """Считывает список учетных записей администраторов из файла.
    Проверяются пути в backend/admins.txt, admins.txt и рядом с приложением.
    Считывание происходит динамически, поэтому изменения файла вступают в силу немедленно.
    """
    possible_paths = [
        Path("admins.txt"),
        Path("backend/admins.txt"),
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
            break
    return admins


def is_user_admin(email: str, nickname: str | None = None) -> bool:
    """Проверяет, является ли пользователь администратором на основе файла admins.txt."""
    admins = get_admin_identifiers()
    if email.lower() in admins:
        return True
    if nickname and nickname.lower() in admins:
        return True
    return False


# ==========================================
# Зависимости FastAPI (Dependency Injection)
# ==========================================

def get_current_user_optional(
    auth: HTTPAuthorizationCredentials | None = Depends(security_bearer),
    db: Session = Depends(get_db),
):
    """Возвращает текущего пользователя, если передан валидный токен, либо None."""
    if not auth or not auth.credentials:
        return None

    payload = decode_access_token(auth.credentials)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    # Импорт внутри функции для исключения циклических импортов
    from .models import User
    user = db.get(User, user_id)
    if not user or not user.is_active:
        return None
    return user


def get_current_user(
    auth: HTTPAuthorizationCredentials | None = Depends(security_bearer),
    db: Session = Depends(get_db),
):
    """Требует аутентификации. Возвращает объект пользователя User или 401."""
    user = get_current_user_optional(auth, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Необходима авторизация (недействительный или отсутствующий Bearer token)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_admin(
    current_user = Depends(get_current_user),
):
    """Требует прав администратора (наличие email или никнейма в файле admins.txt)."""
    if not is_user_admin(current_user.email, current_user.nickname):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен. Действие разрешено только администраторам турнира.",
        )
    return current_user
