from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])


@router.get("", response_model=list[schemas.TournamentOut])
def list_tournaments(status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Tournament)
    if status:
        q = q.filter(models.Tournament.status == status)
    return q.all()


@router.get("/{tournament_id}", response_model=schemas.TournamentOut)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    t = db.get(models.Tournament, tournament_id)
    if not t:
        raise HTTPException(404, "Tournament not found")
    return t


@router.get("/{tournament_id}/matches", response_model=list[schemas.MatchOut])
def get_tournament_matches(tournament_id: int, db: Session = Depends(get_db)):
    t = db.get(models.Tournament, tournament_id)
    if not t:
        raise HTTPException(404, "Tournament not found")
    return t.matches


@router.post("", response_model=schemas.TournamentOut, status_code=201)
def create_tournament(payload: schemas.TournamentCreate, db: Session = Depends(get_db)):
    t = models.Tournament(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.patch("/{tournament_id}", response_model=schemas.TournamentOut)
def update_tournament(tournament_id: int, payload: schemas.TournamentUpdate,
                      db: Session = Depends(get_db)):
    t = db.get(models.Tournament, tournament_id)
    if not t:
        raise HTTPException(404, "Tournament not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(t, key, value)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{tournament_id}", status_code=204)
def delete_tournament(tournament_id: int, db: Session = Depends(get_db)):
    t = db.get(models.Tournament, tournament_id)
    if not t:
        raise HTTPException(404, "Tournament not found")
    db.delete(t)
    db.commit()