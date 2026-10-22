from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, schemas
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
    """Get match details by ID."""
    m = crud.get_match_or_404(db, match_id)
    return crud.enrich_match(m)


@router.post("", response_model=schemas.MatchOut, status_code=status.HTTP_201_CREATED)
def create_match(
    payload: schemas.MatchCreate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a match (admin only)."""
    return crud.create_match(db, payload)


@router.patch("/{match_id}", response_model=schemas.MatchOut)
def update_match(
    match_id: int,
    payload: schemas.MatchUpdate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update match score and status (admin only).
    When marked FINISHED, automatically advances winners/losers through the bracket.
    """
    return crud.update_match(db, match_id, payload)


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(
    match_id: int,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete match (admin only)."""
    crud.delete_match(db, match_id)
