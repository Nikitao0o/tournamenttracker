from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/leaderboards", tags=["leaderboards"])


@router.get("/teams", response_model=list[schemas.TeamLeaderboardEntry])
def team_leaderboard(db: Session = Depends(get_db)):
    return crud.get_team_leaderboard(db)


@router.get("/players", response_model=list[schemas.PlayerLeaderboardEntry])
def player_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_player_leaderboard(db, limit=limit)
