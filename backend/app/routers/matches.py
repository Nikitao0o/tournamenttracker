from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth import get_current_admin
from ..database import get_db

router = APIRouter(prefix="/api/matches", tags=["matches"])


@router.get("", response_model=list[schemas.MatchOut])
def list_matches(
    status: str | None = None,
    tournament_id: int | None = None,
    team_id: int | None = None,
    db: Session = Depends(get_db),
):
    """Public list of matches with filtering."""
    return crud.get_matches(
        db,
        status_filter=status,
        tournament_id=tournament_id,
        team_id=team_id,
    )


@router.get("/{match_id}", response_model=schemas.MatchOut)
def get_match(match_id: int, db: Session = Depends(get_db)):
    """Get match details by ID, including map results and player statistics."""
    m = crud.get_match_or_404(db, match_id)
    return crud.enrich_match(m)


@router.post("", response_model=schemas.MatchOut, status_code=status.HTTP_201_CREATED)
def create_match(
    payload: schemas.MatchCreate,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a match (admin only)."""
    return crud.create_match(db, payload)


@router.patch("/{match_id}", response_model=schemas.MatchOut)
def update_match(
    match_id: int,
    payload: schemas.MatchUpdate,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update match score and status (admin only).
    When marked FINISHED, automatically advances winners/losers through the bracket.
    """
    return crud.update_match(db, match_id, payload)


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(
    match_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete match (admin only)."""
    crud.delete_match(db, match_id)


@router.post("/{match_id}/maps", response_model=schemas.MapResultOut, status_code=status.HTTP_201_CREATED)
def add_map(
    match_id: int,
    payload: schemas.MapResultCreate,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Add individual map score breakdown to a match (admin only)."""
    return crud.add_map_result(db, match_id, payload)


@router.delete("/{match_id}/maps/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_map(
    match_id: int,
    map_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete individual map score breakdown from a match (admin only)."""
    crud.delete_map_result(db, match_id, map_id)


@router.post("/{match_id}/player-stats", response_model=schemas.PlayerMatchStatOut, status_code=status.HTTP_201_CREATED)
def add_player_stat(
    match_id: int,
    payload: schemas.PlayerMatchStatCreate,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Record player performance statistics for a match (admin only)."""
    return crud.add_player_match_stat(db, match_id, payload)


@router.patch("/{match_id}/player-stats/{stat_id}", response_model=schemas.PlayerMatchStatOut)
def update_player_stat(
    match_id: int,
    stat_id: int,
    payload: schemas.PlayerMatchStatUpdate,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update a player match stat (admin only)."""
    return crud.update_player_match_stat(db, match_id, stat_id, payload)


@router.delete("/{match_id}/player-stats/{stat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player_stat(
    match_id: int,
    stat_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a player match stat (admin only)."""
    crud.delete_player_match_stat(db, match_id, stat_id)
