from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..auth import create_access_token, get_current_user, verify_password
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    """Регистрация нового пользователя."""
    return crud.create_user(db, payload)


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Аутентификация пользователя и получение Bearer токена."""
    user = crud.get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password, user.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Учетная запись отключена",
        )

    token = create_access_token(user.id, user.email, user.nickname)
    user_out = crud.enrich_user(user)
    return schemas.TokenOut(access_token=token, token_type="bearer", user=user_out)


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user = Depends(get_current_user)):
    """Получение профиля текущего пользователя."""
    return crud.enrich_user(current_user)


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Обычный пользователь может редактировать ТОЛЬКО свою почту, никнейм и пароль."""
    return crud.update_user_self(db, current_user, payload)
