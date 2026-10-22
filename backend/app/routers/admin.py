from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..auth import get_admin_identifiers, get_current_admin
from ..database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[schemas.UserOut])
def list_users(
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Список всех зарегистрированных пользователей системы (только для админов)."""
    return crud.get_all_users(db)


@router.post("/players", response_model=schemas.PlayerOut, status_code=status.HTTP_201_CREATED)
def admin_create_player(
    payload: schemas.PlayerCreate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Создание профиля игрока админом.
    Может быть создан с привязкой к аккаунту (user_id) либо БЕЗ почты и пароля (user_id=None).
    """
    return crud.create_player(db, payload)


@router.post("/players/claim", response_model=schemas.PlayerOut)
def admin_claim_player(
    payload: schemas.AdminClaimPlayer,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Привязка зарегистрированного пользователя к профилю игрока (только для админов)."""
    return crud.claim_player_for_user(db, payload.player_id, payload.user_id)


@router.get("/admins-list")
def get_admins_list(admin = Depends(get_current_admin)):
    """Просмотр текущих учетных записей администраторов, загруженных из файла admins.txt."""
    return {"admins": sorted(list(get_admin_identifiers()))}
