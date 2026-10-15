from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/players", tags=["players"])


def _enrich(p: models.Player) -> schemas.PlayerOut:
    out = schemas.PlayerOut.model_validate(p)
    out.team_name = p.team.name if p.team else None
    return out


@router.get("", response_model=list[schemas.PlayerOut])
def list_players(team_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Player)
    if team_id:
        q = q.filter(models.Player.team_id == team_id)
    return [_enrich(p) for p in q.all()]


@router.get("/{player_id}", response_model=schemas.PlayerOut)
def get_player(player_id: int, db: Session = Depends(get_db)):
    p = db.get(models.Player, player_id)
    if not p:
        raise HTTPException(404, "Player not found")
    return _enrich(p)


@router.post("", response_model=schemas.PlayerOut, status_code=201)
def create_player(payload: schemas.PlayerCreate, db: Session = Depends(get_db)):
    if not db.get(models.Team, payload.team_id):
        raise HTTPException(400, "Team not found")
    p = models.Player(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _enrich(p)


@router.patch("/{player_id}", response_model=schemas.PlayerOut)
def update_player(player_id: int, payload: schemas.PlayerUpdate,
                  db: Session = Depends(get_db)):
    p = db.get(models.Player, player_id)
    if not p:
        raise HTTPException(404, "Player not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(p, key, value)
    db.commit()
    db.refresh(p)
    return _enrich(p)


@router.delete("/{player_id}", status_code=204)
def delete_player(player_id: int, db: Session = Depends(get_db)):
    p = db.get(models.Player, player_id)
    if not p:
        raise HTTPException(404, "Player not found")
    db.delete(p)
    db.commit()