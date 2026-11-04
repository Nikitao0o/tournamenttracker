from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    revoke_refresh_token,
    verify_password,
    verify_refresh_token,
)
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    return crud.create_user(db, payload)


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return a signed JWT access token and refresh token."""
    user = crud.get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password, user.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    user_out = crud.enrich_user(user)
    access_token = create_access_token(
        user.id, user.email, user.nickname, is_admin=user_out.is_admin
    )
    refresh_token = create_refresh_token(db, user.id)

    return schemas.TokenOut(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_out,
    )


@router.post("/refresh", response_model=schemas.TokenOut)
def refresh_token_endpoint(payload: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    """Issues a new JWT access token using a valid, unrevoked, unexpired refresh token."""
    token_record = verify_refresh_token(db, payload.refresh_token)
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = token_record.user
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or not found",
        )

    user_out = crud.enrich_user(user)
    new_access_token = create_access_token(
        user.id, user.email, user.nickname, is_admin=user_out.is_admin
    )

    return schemas.TokenOut(
        access_token=new_access_token,
        refresh_token=token_record.token,
        token_type="bearer",
        user=user_out,
    )


@router.post("/logout")
def logout(
    payload: schemas.RefreshTokenRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Terminates session and revokes refresh token."""
    revoked = revoke_refresh_token(db, payload.refresh_token)
    return {"status": "ok", "message": "Successfully logged out", "token_revoked": revoked}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user = Depends(get_current_user)):
    """Retrieve profile of the currently authenticated user."""
    return crud.enrich_user(current_user)


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Standard user can update nickname, password, and avatar."""
    return crud.update_user_self(db, current_user, payload)


@router.post("/me/avatar", response_model=schemas.UserOut)
def upload_my_avatar(
    payload: schemas.ImageUploadPayload,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload avatar for current user account and any linked player profile."""
    url = crud.save_uploaded_image("players", current_user.id, payload)
    current_user.avatar_url = url
    if current_user.player:
        current_user.player.avatar_url = url
    db.commit()
    db.refresh(current_user)
    return crud.enrich_user(current_user)
