from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/leaderboards", tags=["leaderboards"])


@router.get("/teams", response_model=list[schemas.TeamLeaderboardEntry])
def team_leaderboard(db: Session = Depends(get_db)):
    teams = db.query(models.Team).order_by(models.Team.ranking).all()
    return [
        schemas.TeamLeaderboardEntry(rank=i + 1, team_id=t.id, name=t.name)
        for i, t in enumerate(teams)
    ]


@router.get("/players", response_model=list[schemas.PlayerLeaderboardEntry])
def player_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    # Сортируем по impact, т.к. kd у нас строка (как в исходном фронте)
    players = (
        db.query(models.Player)
        .order_by(models.Player.impact.desc())
        .limit(limit)
        .all()
    )
    return [
        schemas.PlayerLeaderboardEntry(
            rank=i + 1,
            player_id=p.id,
            nickname=p.nickname,
            team_name=p.team.name,
            rating=round(p.impact / 10 + 1, 2),  # нормализуем к "1.x"
        )
        for i, p in enumerate(players)
    ]