from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..auth import get_current_admin
from ..database import get_db

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("", response_model=list[schemas.TeamOut])
def list_teams(db: Session = Depends(get_db)):
    """Public list of teams ordered by ranking."""
    return crud.get_teams(db)


@router.get("/{team_id}", response_model=schemas.TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db)):
    """Get team details by ID."""
    return crud.get_team_or_404(db, team_id)


@router.get("/{team_id}/players", response_model=list[schemas.PlayerOut])
def get_team_players(team_id: int, db: Session = Depends(get_db)):
    """Get roster of a team."""
    crud.get_team_or_404(db, team_id)
    return crud.get_players(db, team_id=team_id)


@router.post("", response_model=schemas.TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: schemas.TeamCreate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create team (admin only)."""
    return crud.create_team(db, payload)


@router.patch("/{team_id}", response_model=schemas.TeamOut)
def update_team(
    team_id: int,
    payload: schemas.TeamUpdate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update team details (admin only)."""
    return crud.update_team(db, team_id, payload)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete team (admin only)."""
    crud.delete_team(db, team_id)
