from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from . import models, schemas


# ==========================================
# Teams (Команды)
# ==========================================

def get_teams(db: Session) -> list[models.Team]:
    return db.query(models.Team).order_by(models.Team.ranking).all()


def get_team_or_404(db: Session, team_id: int) -> models.Team:
    team = db.get(models.Team, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Команда с id={team_id} не найдена",
        )
    return team


def create_team(db: Session, payload: schemas.TeamCreate) -> models.Team:
    existing = db.query(models.Team).filter(models.Team.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Команда с названием '{payload.name}' уже существует",
        )
    team = models.Team(**payload.model_dump())
    db.add(team)
    try:
        db.commit()
        db.refresh(team)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ошибка целостности данных при создании команды",
        )
    return team


def update_team(db: Session, team_id: int, payload: schemas.TeamUpdate) -> models.Team:
    team = get_team_or_404(db, team_id)
    update_data = payload.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] != team.name:
        existing = db.query(models.Team).filter(models.Team.name == update_data["name"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Команда с названием '{update_data['name']}' уже существует",
            )

    for key, value in update_data.items():
        setattr(team, key, value)

    try:
        db.commit()
        db.refresh(team)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ошибка сохранения изменений команды",
        )
    return team


def delete_team(db: Session, team_id: int) -> None:
    team = get_team_or_404(db, team_id)
    db.delete(team)
    db.commit()


# ==========================================
# Players (Игроки)
# ==========================================

def enrich_player(player: models.Player) -> schemas.PlayerOut:
    out = schemas.PlayerOut.model_validate(player)
    out.team_name = player.team.name if player.team else None
    return out


def get_players(db: Session, team_id: int | None = None) -> list[schemas.PlayerOut]:
    q = db.query(models.Player)
    if team_id is not None:
        q = q.filter(models.Player.team_id == team_id)
    return [enrich_player(p) for p in q.all()]


def get_player_or_404(db: Session, player_id: int) -> models.Player:
    player = db.get(models.Player, player_id)
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Игрок с id={player_id} не найден",
        )
    return player


def create_player(db: Session, payload: schemas.PlayerCreate) -> schemas.PlayerOut:
    # Валидация существования связанной команды
    if not db.get(models.Team, payload.team_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Связанная команда с id={payload.team_id} не найдена",
        )

    player = models.Player(**payload.model_dump())
    db.add(player)
    db.commit()
    db.refresh(player)
    return enrich_player(player)


def update_player(db: Session, player_id: int, payload: schemas.PlayerUpdate) -> schemas.PlayerOut:
    player = get_player_or_404(db, player_id)
    update_data = payload.model_dump(exclude_unset=True)

    # Проверка существования команды при смене team_id
    if "team_id" in update_data and update_data["team_id"] is not None:
        if not db.get(models.Team, update_data["team_id"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Связанная команда с id={update_data['team_id']} не найдена",
            )

    for key, value in update_data.items():
        setattr(player, key, value)

    db.commit()
    db.refresh(player)
    return enrich_player(player)


def delete_player(db: Session, player_id: int) -> None:
    player = get_player_or_404(db, player_id)
    db.delete(player)
    db.commit()


# ==========================================
# Tournaments (Турниры)
# ==========================================

def get_tournaments(db: Session, status_filter: str | None = None) -> list[models.Tournament]:
    q = db.query(models.Tournament)
    if status_filter:
        q = q.filter(models.Tournament.status == status_filter)
    return q.all()


def get_tournament_or_404(db: Session, tournament_id: int) -> models.Tournament:
    tournament = db.get(models.Tournament, tournament_id)
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Турнир с id={tournament_id} не найден",
        )
    return tournament


def create_tournament(db: Session, payload: schemas.TournamentCreate) -> models.Tournament:
    tournament = models.Tournament(**payload.model_dump())
    db.add(tournament)
    db.commit()
    db.refresh(tournament)
    return tournament


def update_tournament(db: Session, tournament_id: int, payload: schemas.TournamentUpdate) -> models.Tournament:
    tournament = get_tournament_or_404(db, tournament_id)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tournament, key, value)
    db.commit()
    db.refresh(tournament)
    return tournament


def delete_tournament(db: Session, tournament_id: int) -> None:
    tournament = get_tournament_or_404(db, tournament_id)
    db.delete(tournament)
    db.commit()


# ==========================================
# Matches (Матчи)
# ==========================================

def enrich_match(match: models.Match) -> schemas.MatchOut:
    out = schemas.MatchOut.model_validate(match)
    out.team_a_name = match.team_a.name if match.team_a else None
    out.team_b_name = match.team_b.name if match.team_b else None
    out.tournament_name = match.tournament.title if match.tournament else None
    return out


def get_matches(
    db: Session,
    status_filter: str | None = None,
    tournament_id: int | None = None,
    team_id: int | None = None,
) -> list[schemas.MatchOut]:
    q = db.query(models.Match)
    if status_filter:
        q = q.filter(models.Match.status == status_filter)
    if tournament_id:
        q = q.filter(models.Match.tournament_id == tournament_id)
    if team_id:
        q = q.filter(
            (models.Match.team_a_id == team_id) | (models.Match.team_b_id == team_id)
        )
    return [enrich_match(m) for m in q.all()]


def get_match_or_404(db: Session, match_id: int) -> models.Match:
    match = db.get(models.Match, match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Матч с id={match_id} не найден",
        )
    return match


def create_match(db: Session, payload: schemas.MatchCreate) -> schemas.MatchOut:
    if payload.team_a_id == payload.team_b_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Команда не может играть против самой себя (team_a_id == team_b_id)",
        )

    if not db.get(models.Team, payload.team_a_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Команда А с id={payload.team_a_id} не найдена",
        )
    if not db.get(models.Team, payload.team_b_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Команда B с id={payload.team_b_id} не найдена",
        )
    if not db.get(models.Tournament, payload.tournament_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Турнир с id={payload.tournament_id} не найден",
        )

    match = models.Match(**payload.model_dump())
    db.add(match)
    db.commit()
    db.refresh(match)
    return enrich_match(match)


def update_match(db: Session, match_id: int, payload: schemas.MatchUpdate) -> schemas.MatchOut:
    match = get_match_or_404(db, match_id)
    update_data = payload.model_dump(exclude_unset=True)

    target_team_a = update_data.get("team_a_id", match.team_a_id)
    target_team_b = update_data.get("team_b_id", match.team_b_id)

    if target_team_a == target_team_b:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Команда не может играть против самой себя (team_a_id == team_b_id)",
        )

    if "team_a_id" in update_data and not db.get(models.Team, update_data["team_a_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Команда А с id={update_data['team_a_id']} не найдена",
        )
    if "team_b_id" in update_data and not db.get(models.Team, update_data["team_b_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Команда B с id={update_data['team_b_id']} не найдена",
        )
    if "tournament_id" in update_data and not db.get(models.Tournament, update_data["tournament_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Турнир с id={update_data['tournament_id']} не найден",
        )

    for key, value in update_data.items():
        setattr(match, key, value)

    db.commit()
    db.refresh(match)
    return enrich_match(match)


def delete_match(db: Session, match_id: int) -> None:
    match = get_match_or_404(db, match_id)
    db.delete(match)
    db.commit()


# ==========================================
# Leaderboards (Таблицы лидеров)
# ==========================================

def get_team_leaderboard(db: Session) -> list[schemas.TeamLeaderboardEntry]:
    teams = db.query(models.Team).order_by(models.Team.ranking).all()
    return [
        schemas.TeamLeaderboardEntry(rank=i + 1, team_id=t.id, name=t.name)
        for i, t in enumerate(teams)
    ]


def get_player_leaderboard(db: Session, limit: int = 10) -> list[schemas.PlayerLeaderboardEntry]:
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
            team_name=p.team.name if p.team else "",
            rating=round(p.impact / 10 + 1, 2),
        )
        for i, p in enumerate(players)
    ]
