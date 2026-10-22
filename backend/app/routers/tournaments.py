from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..auth import get_current_admin
from ..database import get_db

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])


@router.get("", response_model=list[schemas.TournamentOut])
def list_tournaments(status: str | None = None, db: Session = Depends(get_db)):
    """Public list of all tournaments."""
    return crud.get_tournaments(db, status_filter=status)


@router.get("/{tournament_id}", response_model=schemas.TournamentOut)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    """Get tournament details by ID."""
    return crud.get_tournament_or_404(db, tournament_id)


@router.get("/{tournament_id}/matches", response_model=list[schemas.MatchOut])
def get_tournament_matches(tournament_id: int, db: Session = Depends(get_db)):
    """Matches of a tournament."""
    crud.get_tournament_or_404(db, tournament_id)
    return crud.get_matches(db, tournament_id=tournament_id)


@router.get("/{tournament_id}/bracket", response_model=schemas.TournamentBracketView)
def get_tournament_bracket(tournament_id: int, db: Session = Depends(get_db)):
    """Get structured tournament bracket (Upper, Lower, Grand final)."""
    return crud.get_tournament_bracket_view(db, tournament_id)


@router.post("", response_model=schemas.TournamentOut, status_code=status.HTTP_201_CREATED)
def create_tournament(
    payload: schemas.TournamentCreate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a tournament (admin only)."""
    return crud.create_tournament(db, payload)


@router.patch("/{tournament_id}", response_model=schemas.TournamentOut)
def update_tournament(
    tournament_id: int,
    payload: schemas.TournamentUpdate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Modify tournament details (admin only)."""
    return crud.update_tournament(db, tournament_id, payload)


@router.delete("/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tournament(
    tournament_id: int,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete tournament (admin only)."""
    crud.delete_tournament(db, tournament_id)


@router.post("/{tournament_id}/bracket/generate", response_model=schemas.TournamentBracketView)
def generate_bracket(
    tournament_id: int,
    payload: schemas.BracketCreate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Generate tournament bracket of chosen type (admin only).
    Supported types: double_elimination, single_elimination, round_robin, swiss.
    """
    return crud.generate_tournament_bracket(db, tournament_id, payload)
