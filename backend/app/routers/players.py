from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..auth import get_current_admin
from ..database import get_db

router = APIRouter(prefix="/api/players", tags=["players"])


@router.get("", response_model=list[schemas.PlayerOut])
def list_players(team_id: int | None = None, db: Session = Depends(get_db)):
    """Публичный список игроков с фильтрацией по команде."""
    return crud.get_players(db, team_id=team_id)


@router.get("/{player_id}", response_model=schemas.PlayerOut)
def get_player(player_id: int, db: Session = Depends(get_db)):
    """Профиль игрока."""
    p = crud.get_player_or_404(db, player_id)
    return crud.enrich_player(p)


@router.post("", response_model=schemas.PlayerOut, status_code=status.HTTP_201_CREATED)
def create_player(
    payload: schemas.PlayerCreate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Создание игрока (только для администраторов).
    Может быть создан без почты и пароля (user_id=None), либо привязан к зарегистрированному аккаунту.
    """
    return crud.create_player(db, payload)


@router.patch("/{player_id}", response_model=schemas.PlayerOut)
def update_player(
    player_id: int,
    payload: schemas.PlayerUpdate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Изменение данных и статистики игрока (только для администраторов турнира)."""
    return crud.update_player(db, player_id, payload)


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(
    player_id: int,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Удаление профиля игрока (только для администраторов)."""
    crud.delete_player(db, player_id)
