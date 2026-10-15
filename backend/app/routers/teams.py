from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("", response_model=list[schemas.TeamOut])
def list_teams(db: Session = Depends(get_db)):
    return db.query(models.Team).order_by(models.Team.ranking).all()


@router.get("/{team_id}", response_model=schemas.TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db)):
    t = db.get(models.Team, team_id)
    if not t:
        raise HTTPException(404, "Team not found")
    return t


@router.get("/{team_id}/players", response_model=list[schemas.PlayerOut])
def get_team_players(team_id: int, db: Session = Depends(get_db)):
    t = db.get(models.Team, team_id)
    if not t:
        raise HTTPException(404, "Team not found")
    return t.players


@router.post("", response_model=schemas.TeamOut, status_code=201)
def create_team(payload: schemas.TeamCreate, db: Session = Depends(get_db)):
    t = models.Team(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.patch("/{team_id}", response_model=schemas.TeamOut)
def update_team(team_id: int, payload: schemas.TeamUpdate,
                db: Session = Depends(get_db)):
    t = db.get(models.Team, team_id)
    if not t:
        raise HTTPException(404, "Team not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(t, key, value)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: int, db: Session = Depends(get_db)):
    t = db.get(models.Team, team_id)
    if not t:
        raise HTTPException(404, "Team not found")
    db.delete(t)
    db.commit()