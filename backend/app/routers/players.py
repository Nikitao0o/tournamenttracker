from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..auth import get_current_admin, get_current_user
from ..database import get_db

router = APIRouter(prefix="/api/players", tags=["players"])


@router.get("", response_model=list[schemas.PlayerOut])
def list_players(team_id: int | None = None, db: Session = Depends(get_db)):
    """Public list of players with optional team filtering."""
    return crud.get_players(db, team_id=team_id)


@router.get("/{player_id}", response_model=schemas.PlayerOut)
def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get player profile by ID."""
    p = crud.get_player_or_404(db, player_id)
    return crud.enrich_player(p)


@router.post("", response_model=schemas.PlayerOut, status_code=status.HTTP_201_CREATED)
def create_player(
    payload: schemas.PlayerCreate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a player (admin only).
    Can be created without account (user_id=None) or bound to an existing registered user.
    """
    return crud.create_player(db, payload)


@router.patch("/{player_id}", response_model=schemas.PlayerOut)
def update_player(
    player_id: int,
    payload: schemas.PlayerUpdate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update player details and statistics (admin only)."""
    return crud.update_player(db, player_id, payload)


@router.post("/{player_id}/avatar", response_model=schemas.PlayerOut)
def upload_player_avatar(
    player_id: int,
    payload: schemas.ImageUploadPayload,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload or update player avatar image.
    Allowed for tournament administrators or the user linked to this player profile.
    """
    player = crud.get_player_or_404(db, player_id)
    is_owner = current_user.player and current_user.player.id == player_id
    if not current_user.is_admin and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own player avatar",
        )
    return crud.set_player_avatar(db, player_id, payload)


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(
    player_id: int,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete player profile (admin only)."""
    crud.delete_player(db, player_id)
