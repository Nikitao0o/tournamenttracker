from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])


@router.get("", response_model=list[schemas.TournamentOut])
def list_tournaments(status: str | None = None, db: Session = Depends(get_db)):
    return crud.get_tournaments(db, status_filter=status)


@router.get("/{tournament_id}", response_model=schemas.TournamentOut)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    return crud.get_tournament_or_404(db, tournament_id)


@router.get("/{tournament_id}/matches", response_model=list[schemas.MatchOut])
def get_tournament_matches(tournament_id: int, db: Session = Depends(get_db)):
    crud.get_tournament_or_404(db, tournament_id)
    return crud.get_matches(db, tournament_id=tournament_id)


@router.post("", response_model=schemas.TournamentOut, status_code=status.HTTP_201_CREATED)
def create_tournament(payload: schemas.TournamentCreate, db: Session = Depends(get_db)):
    return crud.create_tournament(db, payload)


@router.patch("/{tournament_id}", response_model=schemas.TournamentOut)
def update_tournament(
    tournament_id: int,
    payload: schemas.TournamentUpdate,
    db: Session = Depends(get_db),
):
    return crud.update_tournament(db, tournament_id, payload)


@router.delete("/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tournament(tournament_id: int, db: Session = Depends(get_db)):
    crud.delete_tournament(db, tournament_id)
