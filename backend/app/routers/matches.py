from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/matches", tags=["matches"])


def _enrich(match: models.Match) -> schemas.MatchOut:
    out = schemas.MatchOut.model_validate(match)
    out.team_a_name = match.team_a.name
    out.team_b_name = match.team_b.name
    out.tournament_name = match.tournament.title
    return out


@router.get("", response_model=list[schemas.MatchOut])
def list_matches(
    status: str | None = None,
    tournament_id: int | None = None,
    team_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Match)
    if status:
        q = q.filter(models.Match.status == status)
    if tournament_id:
        q = q.filter(models.Match.tournament_id == tournament_id)
    if team_id:
        q = q.filter(
            (models.Match.team_a_id == team_id) | (models.Match.team_b_id == team_id)
        )
    return [_enrich(m) for m in q.all()]


@router.get("/{match_id}", response_model=schemas.MatchOut)
def get_match(match_id: int, db: Session = Depends(get_db)):
    m = db.get(models.Match, match_id)
    if not m:
        raise HTTPException(404, "Match not found")
    return _enrich(m)


@router.post("", response_model=schemas.MatchOut, status_code=201)
def create_match(payload: schemas.MatchCreate, db: Session = Depends(get_db)):
    if not db.get(models.Team, payload.team_a_id) or not db.get(models.Team, payload.team_b_id):
        raise HTTPException(400, "Team not found")
    if not db.get(models.Tournament, payload.tournament_id):
        raise HTTPException(400, "Tournament not found")

    m = models.Match(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return _enrich(m)


@router.patch("/{match_id}", response_model=schemas.MatchOut)
def update_match(match_id: int, payload: schemas.MatchUpdate,
                 db: Session = Depends(get_db)):
    m = db.get(models.Match, match_id)
    if not m:
        raise HTTPException(404, "Match not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(m, key, value)
    db.commit()
    db.refresh(m)
    return _enrich(m)


@router.delete("/{match_id}", status_code=204)
def delete_match(match_id: int, db: Session = Depends(get_db)):
    m = db.get(models.Match, match_id)
    if not m:
        raise HTTPException(404, "Match not found")
    db.delete(m)
    db.commit()