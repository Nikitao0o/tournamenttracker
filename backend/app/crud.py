import base64
import datetime
import io
import math
import re
import time
from urllib.parse import urlparse

from fastapi import HTTPException, status
from PIL import Image
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models, schemas
from .auth import hash_password, is_user_admin
from .config import settings


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email.strip().lower()).first()


def get_user_by_nickname(db: Session, nickname: str) -> models.User | None:
    return db.query(models.User).filter(models.User.nickname == nickname.strip()).first()


def enrich_user(user: models.User) -> schemas.UserOut:
    created_at_val = (
        user.created_at.isoformat()
        if isinstance(user.created_at, datetime.datetime)
        else str(user.created_at)
    )
    return schemas.UserOut(
        id=user.id,
        email=user.email,
        nickname=user.nickname,
        is_active=user.is_active,
        created_at=created_at_val,
        is_admin=bool(user.is_admin),
        player_id=user.player.id if user.player else None,
        avatar_url=user.player.avatar_url if (user.player and user.player.avatar_url) else user.avatar_url,
    )


def create_user(db: Session, payload: schemas.UserRegister) -> schemas.UserOut:
    email_clean = payload.email.strip().lower()
    nick_clean = payload.nickname.strip()

    if get_user_by_email(db, email_clean):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{payload.email}' already exists",
        )
    if get_user_by_nickname(db, nick_clean):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with nickname '{payload.nickname}' already exists",
        )

    hashed_pw, salt = hash_password(payload.password)

    user = models.User(
        email=email_clean,
        nickname=nick_clean,
        hashed_password=hashed_pw,
        salt=salt,
        is_active=True,
        is_admin=False,
        created_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return enrich_user(user)


def update_user_self(db: Session, user: models.User, payload: schemas.UserUpdate) -> schemas.UserOut:
    """Standard user can update nickname, password, and avatar."""
    if payload.nickname is not None:
        new_nick = payload.nickname.strip()
        if new_nick != user.nickname:
            existing = get_user_by_nickname(db, new_nick)
            if existing and existing.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Nickname '{payload.nickname}' is already taken",
                )
            user.nickname = new_nick

    if payload.password is not None and len(payload.password) >= 6:
        hashed_pw, salt = hash_password(payload.password)
        user.hashed_password = hashed_pw
        user.salt = salt

    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
        if user.player:
            user.player.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(user)
    return enrich_user(user)


def get_all_users(db: Session) -> list[schemas.UserOut]:
    users = db.query(models.User).order_by(models.User.id).all()
    return [enrich_user(u) for u in users]


def get_teams(db: Session) -> list[models.Team]:
    return db.query(models.Team).order_by(models.Team.ranking).all()


def get_team_or_404(db: Session, team_id: int) -> models.Team:
    team = db.get(models.Team, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id={team_id} not found",
        )
    return team


def create_team(db: Session, payload: schemas.TeamCreate) -> models.Team:
    existing = db.query(models.Team).filter(models.Team.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Team with name '{payload.name}' already exists",
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
            detail="Integrity error while creating team",
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
                detail=f"Team with name '{update_data['name']}' already exists",
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
            detail="Error saving team updates",
        )
    return team


def delete_team(db: Session, team_id: int) -> None:
    team = get_team_or_404(db, team_id)
    db.query(models.Match).filter(models.Match.team_a_id == team_id).update({models.Match.team_a_id: None})
    db.query(models.Match).filter(models.Match.team_b_id == team_id).update({models.Match.team_b_id: None})
    db.query(models.Match).filter(models.Match.winner_id == team_id).update({models.Match.winner_id: None})
    db.query(models.Match).filter(models.Match.loser_id == team_id).update({models.Match.loser_id: None})
    db.delete(team)
    db.commit()


def enrich_player(player: models.Player) -> schemas.PlayerOut:
    out = schemas.PlayerOut.model_validate(player)
    out.team_name = player.team.name if player.team else None
    out.user_email = player.user.email if player.user else None
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
            detail=f"Player with id={player_id} not found",
        )
    return player


def create_player(db: Session, payload: schemas.PlayerCreate) -> schemas.PlayerOut:
    if not db.get(models.Team, payload.team_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Associated team with id={payload.team_id} not found",
        )

    if payload.user_id is not None:
        user = db.get(models.User, payload.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User account with id={payload.user_id} not found",
            )
        existing_profile = db.query(models.Player).filter(models.Player.user_id == payload.user_id).first()
        if existing_profile:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with id={payload.user_id} is already linked to player {existing_profile.nickname}",
            )

    player = models.Player(**payload.model_dump())
    db.add(player)
    db.commit()
    db.refresh(player)
    return enrich_player(player)


def update_player(db: Session, player_id: int, payload: schemas.PlayerUpdate) -> schemas.PlayerOut:
    player = get_player_or_404(db, player_id)
    update_data = payload.model_dump(exclude_unset=True)

    if "team_id" in update_data and update_data["team_id"] is not None:
        if not db.get(models.Team, update_data["team_id"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Associated team with id={update_data['team_id']} not found",
            )

    if "user_id" in update_data:
        if update_data["user_id"] is not None:
            user = db.get(models.User, update_data["user_id"])
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User account with id={update_data['user_id']} not found",
                )
            existing_profile = (
                db.query(models.Player)
                .filter(models.Player.user_id == update_data["user_id"], models.Player.id != player.id)
                .first()
            )
            if existing_profile:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This account is already linked to another player",
                )

    for key, value in update_data.items():
        setattr(player, key, value)

    db.commit()
    db.refresh(player)
    return enrich_player(player)


def claim_player_for_user(db: Session, player_id: int, user_id: int) -> schemas.PlayerOut:
    player = get_player_or_404(db, player_id)
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id={user_id} not found",
        )
    existing = db.query(models.Player).filter(models.Player.user_id == user_id, models.Player.id != player_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User is already bound to player '{existing.nickname}'",
        )
    player.user_id = user_id
    db.commit()
    db.refresh(player)
    return enrich_player(player)


def delete_player(db: Session, player_id: int) -> None:
    player = get_player_or_404(db, player_id)
    db.delete(player)
    db.commit()


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
            detail=f"Tournament with id={tournament_id} not found",
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
    """Deletes tournament and lets DB and ORM cascades clean up all brackets and matches."""
    tournament = get_tournament_or_404(db, tournament_id)
    db.delete(tournament)
    db.commit()


def enrich_match(match: models.Match) -> schemas.MatchOut:
    out = schemas.MatchOut.model_validate(match)
    out.team_a_name = match.team_a.name if match.team_a else "TBD"
    out.team_b_name = match.team_b.name if match.team_b else "TBD"
    out.team_a_logo_url = match.team_a.logo_url if match.team_a else None
    out.team_b_logo_url = match.team_b.logo_url if match.team_b else None
    out.winner_name = match.winner.name if match.winner else None
    out.tournament_name = match.tournament.title if match.tournament else None

    # Enrich maps
    out.map_results = [
        schemas.MapResultOut(
            id=mr.id,
            match_id=mr.match_id,
            map_number=mr.map_number,
            map_name=mr.map_name,
            score_a=mr.score_a,
            score_b=mr.score_b,
            winner_id=mr.winner_id,
            winner_name=mr.winner.name if mr.winner else None,
        )
        for mr in match.map_results
    ]

    # Enrich player stats
    out.player_stats = [
        schemas.PlayerMatchStatOut(
            id=ps.id,
            match_id=ps.match_id,
            map_id=ps.map_id,
            player_id=ps.player_id,
            player_nickname=ps.player.nickname if ps.player else "Unknown",
            team_id=ps.team_id,
            team_name=ps.team.name if ps.team else "Unknown",
            kills=ps.kills,
            deaths=ps.deaths,
            assists=ps.assists,
            headshots=ps.headshots,
            adr=ps.adr,
            kast=ps.kast,
            rating=ps.rating,
            is_mvp=ps.is_mvp,
        )
        for ps in match.player_stats
    ]
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
            detail=f"Match with id={match_id} not found",
        )
    return match


def advance_bracket_progression(
    db: Session,
    match: models.Match,
    old_winner_id: int | None = None,
    old_loser_id: int | None = None,
) -> None:
    """Advances winner and loser down the bracket.
    Guards against bracket desync: prevents changes if downstream match is already finished.
    """
    if old_winner_id is None:
        old_winner_id = match.winner_id
    if old_loser_id is None:
        old_loser_id = match.loser_id

    # If score or status is incomplete
    if (
        match.status != "FINISHED"
        or match.score_a is None
        or match.score_b is None
        or match.score_a == match.score_b
        or match.team_a_id is None
        or match.team_b_id is None
    ):
        if old_winner_id is not None and match.next_match_id:
            next_m = db.get(models.Match, match.next_match_id)
            if next_m:
                if next_m.status == "FINISHED":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot reset match score: the next match in the bracket has already been completed.",
                    )
                if next_m.team_a_id == old_winner_id:
                    next_m.team_a_id = None
                elif next_m.team_b_id == old_winner_id:
                    next_m.team_b_id = None

        if old_loser_id is not None and match.next_loser_match_id:
            loser_m = db.get(models.Match, match.next_loser_match_id)
            if loser_m:
                if loser_m.status == "FINISHED":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot reset match score: the lower bracket match has already been completed.",
                    )
                if loser_m.team_a_id == old_loser_id:
                    loser_m.team_a_id = None
                elif loser_m.team_b_id == old_loser_id:
                    loser_m.team_b_id = None

        match.winner_id = None
        match.loser_id = None
        return

    winner_id = match.team_a_id if match.score_a > match.score_b else match.team_b_id
    loser_id = match.team_b_id if match.score_a > match.score_b else match.team_a_id

    # If winner changed and next match is already FINISHED, block illegal progression desync
    if old_winner_id is not None and old_winner_id != winner_id and match.next_match_id:
        next_m = db.get(models.Match, match.next_match_id)
        if next_m and next_m.status == "FINISHED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change match winner: the next bracket match has already been played. Reset it first.",
            )

    if old_loser_id is not None and old_loser_id != loser_id and match.next_loser_match_id:
        loser_m = db.get(models.Match, match.next_loser_match_id)
        if loser_m and loser_m.status == "FINISHED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change match loser: the downstream lower bracket match has already been played.",
            )

    match.winner_id = winner_id
    match.loser_id = loser_id

    if match.next_match_id:
        next_m = db.get(models.Match, match.next_match_id)
        if next_m:
            if old_winner_id is not None and next_m.team_a_id == old_winner_id:
                next_m.team_a_id = winner_id
            elif old_winner_id is not None and next_m.team_b_id == old_winner_id:
                next_m.team_b_id = winner_id
            elif next_m.team_a_id is None:
                next_m.team_a_id = winner_id
            elif next_m.team_b_id is None and next_m.team_a_id != winner_id:
                next_m.team_b_id = winner_id

    if match.next_loser_match_id:
        loser_m = db.get(models.Match, match.next_loser_match_id)
        if loser_m:
            if old_loser_id is not None and loser_m.team_a_id == old_loser_id:
                loser_m.team_a_id = loser_id
            elif old_loser_id is not None and loser_m.team_b_id == old_loser_id:
                loser_m.team_b_id = loser_id
            elif loser_m.team_a_id is None:
                loser_m.team_a_id = loser_id
            elif loser_m.team_b_id is None and loser_m.team_a_id != loser_id:
                loser_m.team_b_id = loser_id


def create_match(db: Session, payload: schemas.MatchCreate) -> schemas.MatchOut:
    if payload.team_a_id is not None and payload.team_b_id is not None and payload.team_a_id == payload.team_b_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team cannot play against itself (team_a_id == team_b_id)",
        )

    if payload.team_a_id and not db.get(models.Team, payload.team_a_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team A with id={payload.team_a_id} not found",
        )
    if payload.team_b_id and not db.get(models.Team, payload.team_b_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team B with id={payload.team_b_id} not found",
        )
    if not db.get(models.Tournament, payload.tournament_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tournament with id={payload.tournament_id} not found",
        )
    if payload.bracket_id and not db.get(models.Bracket, payload.bracket_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bracket stage with id={payload.bracket_id} not found",
        )
    if payload.next_match_id and not db.get(models.Match, payload.next_match_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Next match with id={payload.next_match_id} not found",
        )
    if payload.next_loser_match_id and not db.get(models.Match, payload.next_loser_match_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Next loser match with id={payload.next_loser_match_id} not found",
        )

    match = models.Match(**payload.model_dump())
    db.add(match)
    db.commit()
    db.refresh(match)

    if match.status == "FINISHED" and match.score_a is not None and match.score_b is not None:
        advance_bracket_progression(db, match)
        db.commit()
        db.refresh(match)

    return enrich_match(match)


def update_match(db: Session, match_id: int, payload: schemas.MatchUpdate) -> schemas.MatchOut:
    match = get_match_or_404(db, match_id)
    update_data = payload.model_dump(exclude_unset=True)

    target_team_a = update_data.get("team_a_id", match.team_a_id)
    target_team_b = update_data.get("team_b_id", match.team_b_id)

    if target_team_a is not None and target_team_b is not None and target_team_a == target_team_b:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team cannot play against itself (team_a_id == team_b_id)",
        )

    if "team_a_id" in update_data and update_data["team_a_id"] and not db.get(models.Team, update_data["team_a_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team A with id={update_data['team_a_id']} not found",
        )
    if "team_b_id" in update_data and update_data["team_b_id"] and not db.get(models.Team, update_data["team_b_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team B with id={update_data['team_b_id']} not found",
        )
    if "winner_id" in update_data and update_data["winner_id"] and not db.get(models.Team, update_data["winner_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Winner team with id={update_data['winner_id']} not found",
        )
    if "loser_id" in update_data and update_data["loser_id"] and not db.get(models.Team, update_data["loser_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loser team with id={update_data['loser_id']} not found",
        )
    if "next_match_id" in update_data and update_data["next_match_id"] and not db.get(models.Match, update_data["next_match_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Next match with id={update_data['next_match_id']} not found",
        )
    if "next_loser_match_id" in update_data and update_data["next_loser_match_id"] and not db.get(models.Match, update_data["next_loser_match_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Next loser match with id={update_data['next_loser_match_id']} not found",
        )

    old_winner_id = match.winner_id
    old_loser_id = match.loser_id

    for key, value in update_data.items():
        setattr(match, key, value)

    advance_bracket_progression(db, match, old_winner_id=old_winner_id, old_loser_id=old_loser_id)

    db.commit()
    db.refresh(match)
    return enrich_match(match)


def delete_match(db: Session, match_id: int) -> None:
    match = get_match_or_404(db, match_id)
    db.query(models.Match).filter(models.Match.next_match_id == match_id).update({models.Match.next_match_id: None})
    db.query(models.Match).filter(models.Match.next_loser_match_id == match_id).update({models.Match.next_loser_match_id: None})
    db.delete(match)
    db.commit()


def get_tournament_brackets(db: Session, tournament_id: int) -> list[models.Bracket]:
    return db.query(models.Bracket).filter(models.Bracket.tournament_id == tournament_id).all()


# Generalized tournament bracket generation for N teams
def generate_tournament_bracket(
    db: Session,
    tournament_id: int,
    payload: schemas.BracketCreate,
) -> schemas.TournamentBracketView:
    """Generates an esports tournament bracket of any type
    (double_elimination, single_elimination, round_robin, swiss) for N teams.
    """
    tournament = get_tournament_or_404(db, tournament_id)

    if len(payload.team_ids) != len(set(payload.team_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Participant team IDs must be unique without duplicates",
        )

    teams = [db.get(models.Team, tid) for tid in payload.team_ids]
    if any(t is None for t in teams):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more specified teams do not exist in database",
        )

    bracket_type = payload.bracket_type.lower()
    valid_types = {"double_elimination", "single_elimination", "round_robin", "swiss"}
    if bracket_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported bracket type. Supported: {', '.join(valid_types)}",
        )

    # Clean existing brackets and matches for this tournament to generate fresh bracket
    db.query(models.Match).filter(models.Match.tournament_id == tournament.id).update(
        {models.Match.next_match_id: None, models.Match.next_loser_match_id: None}
    )
    db.query(models.Match).filter(models.Match.tournament_id == tournament.id).delete()
    db.query(models.Bracket).filter(models.Bracket.tournament_id == tournament.id).delete()
    db.commit()

    tournament.bracket_type = bracket_type

    bracket_model = models.Bracket(
        tournament_id=tournament.id,
        name=payload.name,
        bracket_type=bracket_type,
        status="ACTIVE",
    )
    db.add(bracket_model)
    db.commit()
    db.refresh(bracket_model)

    tour_date = tournament.start_date
    n_teams = len(payload.team_ids)
    team_ids = payload.team_ids

    # 1. Single Elimination (general for N teams: 2, 4, 8, 16...)
    if bracket_type == "single_elimination":
        # Calculate rounds required: ceil(log2(n_teams))
        rounds_count = max(1, math.ceil(math.log2(n_teams)))
        total_slots = 2 ** rounds_count

        # Pad teams with None (byes) if not power of 2
        padded_teams: list[int | None] = list(team_ids) + [None] * (total_slots - n_teams)

        # Standard seeding order: [0, total_slots-1, 1, total_slots-2, ...]
        seeded_pairs: list[tuple[int | None, int | None]] = []
        for i in range(total_slots // 2):
            seeded_pairs.append((padded_teams[i * 2], padded_teams[i * 2 + 1]))

        round_names = {
            1: "Grand final",
            2: "Semifinals",
            3: "Quarterfinals",
            4: "Round of 16",
            5: "Round of 32",
        }

        # Build matches backwards from Grand Final to Opening round
        # current_round_matches holds the matches of the layer ahead
        next_layer_matches: list[models.Match] = []

        # Grand final
        grand_final = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="grand_final",
            round_name=round_names.get(1, "Final"),
            round_order=rounds_count,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="20:00 Sunday",
        )
        db.add(grand_final)
        db.commit()
        db.refresh(grand_final)
        next_layer_matches = [grand_final]

        for r in range(rounds_count - 1, 0, -1):
            num_matches_in_round = 2 ** (rounds_count - r)
            r_name = round_names.get(rounds_count - r + 1, f"Round {r}")
            current_matches: list[models.Match] = []

            for m_idx in range(num_matches_in_round):
                parent_match = next_layer_matches[m_idx // 2]
                m = models.Match(
                    tournament_id=tournament.id,
                    bracket_id=bracket_model.id,
                    bracket_type="single",
                    round_name=r_name,
                    round_order=r,
                    status="UPCOMING",
                    match_format=payload.match_format,
                    date=tour_date,
                    start_time=f"{14 + (m_idx % 4) * 2}:00",
                    next_match_id=parent_match.id,
                )
                db.add(m)
                current_matches.append(m)

            db.commit()
            for m in current_matches:
                db.refresh(m)
            next_layer_matches = current_matches

        # Assign initial teams to round 1 matches
        r1_matches = next_layer_matches
        for idx, pair in enumerate(seeded_pairs):
            if idx < len(r1_matches):
                r1_matches[idx].team_a_id = pair[0]
                r1_matches[idx].team_b_id = pair[1]

        db.commit()

    # 2. Double Elimination (generalized for 4 to 8 teams)
    elif bracket_type == "double_elimination":
        # Grand Final
        grand_final = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="grand_final",
            round_name="Grand final",
            round_order=4,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="21:00 Sunday",
        )
        db.add(grand_final)
        db.commit()
        db.refresh(grand_final)

        # Upper Final
        upper_final = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="upper",
            round_name="Upper final",
            round_order=2,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="17:00 Saturday",
            next_match_id=grand_final.id,
        )
        db.add(upper_final)
        db.commit()
        db.refresh(upper_final)

        # Consolidation Final (Lower Final)
        consolidation_final = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="lower",
            round_name="Consolidation final",
            round_order=3,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="19:00 Sunday",
            next_match_id=grand_final.id,
        )
        db.add(consolidation_final)
        db.commit()
        db.refresh(consolidation_final)

        upper_final.next_loser_match_id = consolidation_final.id

        # Lower Final (semifinal in lower bracket)
        lower_round_match = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="lower",
            round_name="Lower final",
            round_order=2,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="15:00 Saturday",
            next_match_id=consolidation_final.id,
        )
        db.add(lower_round_match)
        db.commit()
        db.refresh(lower_round_match)

        # Upper Opening Round
        num_pairs = min(4, max(2, n_teams // 2))
        for i in range(num_pairs):
            t_a = team_ids[i * 2] if (i * 2) < n_teams else None
            t_b = team_ids[i * 2 + 1] if (i * 2 + 1) < n_teams else None

            opening = models.Match(
                tournament_id=tournament.id,
                bracket_id=bracket_model.id,
                bracket_type="upper",
                round_name="Opening round",
                round_order=1,
                status="UPCOMING",
                match_format=payload.match_format,
                date=tour_date,
                start_time=f"{12 + i * 2}:00 Friday",
                team_a_id=t_a,
                team_b_id=t_b,
                next_match_id=upper_final.id,
                next_loser_match_id=lower_round_match.id,
            )
            db.add(opening)
        db.commit()

    # 3. Round Robin (circle algorithm: all teams play balanced rounds)
    elif bracket_type == "round_robin":
        teams_list: list[int | None] = list(team_ids)
        if len(teams_list) % 2 != 0:
            teams_list.append(None)  # Bye for odd teams

        num_teams = len(teams_list)
        total_rounds = num_teams - 1
        matches_per_round = num_teams // 2

        rotating_teams = list(teams_list)
        for r in range(total_rounds):
            round_name = f"Round {r + 1}"
            for m in range(matches_per_round):
                t1 = rotating_teams[m]
                t2 = rotating_teams[num_teams - 1 - m]

                if t1 is not None and t2 is not None:
                    match = models.Match(
                        tournament_id=tournament.id,
                        bracket_id=bracket_model.id,
                        bracket_type="round_robin",
                        round_name=round_name,
                        round_order=r + 1,
                        status="UPCOMING",
                        match_format=payload.match_format,
                        date=tour_date,
                        start_time=f"{14 + m * 2}:00",
                        team_a_id=t1,
                        team_b_id=t2,
                    )
                    db.add(match)

            # Rotate teams keeping first fixed
            rotating_teams = [rotating_teams[0]] + [rotating_teams[-1]] + rotating_teams[1:-1]

        db.commit()

    # 4. Swiss Bracket (multi-round Swiss system)
    elif bracket_type == "swiss":
        rounds_count = 3  # Standard 3 Swiss rounds
        for r in range(rounds_count):
            round_name = f"Swiss Round {r + 1}"
            for i in range(0, len(team_ids) - 1, 2):
                match = models.Match(
                    tournament_id=tournament.id,
                    bracket_id=bracket_model.id,
                    bracket_type="swiss",
                    round_name=round_name,
                    round_order=r + 1,
                    status="UPCOMING",
                    match_format=payload.match_format,
                    date=tour_date,
                    start_time=f"{15 + i}:00",
                    # First round has teams seeded, subsequent rounds populate as games finish
                    team_a_id=team_ids[i] if r == 0 else None,
                    team_b_id=team_ids[i + 1] if r == 0 else None,
                )
                db.add(match)

        db.commit()

    return get_tournament_bracket_view(db, tournament_id)


def get_tournament_bracket_view(db: Session, tournament_id: int) -> schemas.TournamentBracketView:
    tournament = get_tournament_or_404(db, tournament_id)
    matches = (
        db.query(models.Match)
        .filter(models.Match.tournament_id == tournament_id)
        .order_by(models.Match.round_order, models.Match.id)
        .all()
    )

    enriched_matches = [enrich_match(m) for m in matches]

    upper_rounds: dict[str, list[schemas.MatchOut]] = {}
    lower_rounds: dict[str, list[schemas.MatchOut]] = {}
    all_rounds_dict: dict[str, list[schemas.MatchOut]] = {}
    grand_final = None

    for m in enriched_matches:
        r_name = m.round_name or "General"

        if m.bracket_type == "grand_final":
            grand_final = m
        elif m.bracket_type == "upper":
            upper_rounds.setdefault(r_name, []).append(m)
        elif m.bracket_type == "lower":
            lower_rounds.setdefault(r_name, []).append(m)
        else:
            all_rounds_dict.setdefault(r_name, []).append(m)

    upper_bracket = [
        schemas.BracketRoundGroup(
            round_name=r_name,
            round_order=matches_list[0].round_order or 1,
            matches=matches_list,
        )
        for r_name, matches_list in upper_rounds.items()
    ]
    lower_bracket = [
        schemas.BracketRoundGroup(
            round_name=r_name,
            round_order=matches_list[0].round_order or 1,
            matches=matches_list,
        )
        for r_name, matches_list in lower_rounds.items()
    ]
    all_rounds = [
        schemas.BracketRoundGroup(
            round_name=r_name,
            round_order=matches_list[0].round_order or 1,
            matches=matches_list,
        )
        for r_name, matches_list in all_rounds_dict.items()
    ]

    return schemas.TournamentBracketView(
        tournament_id=tournament.id,
        tournament_title=tournament.title,
        bracket_type=tournament.bracket_type,
        upper_bracket=upper_bracket,
        lower_bracket=lower_bracket,
        grand_final=grand_final,
        all_rounds=all_rounds,
    )


def calculate_team_points(db: Session, team_id: int) -> tuple[int, float]:
    """Calculates dynamic points and win rate for a team based on played matches."""
    matches = (
        db.query(models.Match)
        .filter(
            (models.Match.team_a_id == team_id) | (models.Match.team_b_id == team_id),
            models.Match.status == "FINISHED",
        )
        .all()
    )
    if not matches:
        return 1000, 0.0

    wins = sum(1 for m in matches if m.winner_id == team_id)
    losses = len(matches) - wins
    win_rate = round((wins / len(matches)) * 100, 1)
    points = 1000 + (wins * 45) - (losses * 25)
    return max(0, points), win_rate


def get_team_leaderboard(db: Session) -> list[schemas.TeamLeaderboardEntry]:
    teams = db.query(models.Team).order_by(models.Team.ranking).all()
    entries = []
    for i, t in enumerate(teams):
        pts, wr = calculate_team_points(db, t.id)
        entries.append(
            schemas.TeamLeaderboardEntry(
                rank=i + 1,
                team_id=t.id,
                name=t.name,
                logo_url=t.logo_url,
                points=pts,
                win_rate=wr,
            )
        )
    return entries


def calculate_player_rating(kills: int, deaths: int, maps: int, adr: float, kast: float) -> float:
    """Calculates HLTV 2.0 / 3.0 style rating based on real statistics."""
    rounds = max(1, maps * 24)
    kpr = kills / rounds
    dpr = deaths / rounds
    # HLTV 2.0 approximation
    rating = (
        0.35 * (kpr / 0.679)
        + 0.25 * ((rounds - deaths) / rounds / 0.317)
        + 0.25 * (adr / 75.0)
        + 0.15 * (kast / 70.0)
    )
    return round(max(0.40, min(2.50, rating)), 2)


def get_player_leaderboard(db: Session, limit: int = 15) -> list[schemas.PlayerLeaderboardEntry]:
    players = db.query(models.Player).all()

    player_entries = []
    for p in players:
        # Check if match stats exist for player
        stats = db.query(models.PlayerMatchStat).filter(models.PlayerMatchStat.player_id == p.id).all()
        if stats:
            avg_rating = round(sum(s.rating for s in stats) / len(stats), 2)
            avg_adr = round(sum(s.adr for s in stats) / len(stats), 1)
        else:
            try:
                kd_f = float(p.kd)
            except Exception:
                kd_f = 1.0
            avg_rating = round(p.impact / 10.0 + 0.30, 2)
            avg_adr = round(kd_f * 65.0, 1)

        player_entries.append({
            "player_id": p.id,
            "nickname": p.nickname,
            "team_name": p.team.name if p.team else "",
            "avatar_url": p.avatar_url,
            "rating": avg_rating,
            "kd": p.kd,
            "adr": avg_adr,
        })

    # Sort descending by rating
    player_entries.sort(key=lambda x: x["rating"], reverse=True)

    return [
        schemas.PlayerLeaderboardEntry(
            rank=i + 1,
            player_id=item["player_id"],
            nickname=item["nickname"],
            team_name=item["team_name"],
            avatar_url=item["avatar_url"],
            rating=item["rating"],
            kd=item["kd"],
            adr=item["adr"],
        )
        for i, item in enumerate(player_entries[:limit])
    ]


def validate_image_url(url: str) -> str:
    """Validates that image URL has a safe http/https/uploads scheme."""
    cleaned = url.strip()
    if cleaned.startswith("/uploads/"):
        return cleaned

    parsed = urlparse(cleaned)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image URL scheme. Only HTTP and HTTPS are permitted.",
        )
    if any(char in cleaned for char in ("<", ">", '"', "'", "`")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image URL contains illegal characters.",
        )
    return cleaned


def save_uploaded_image(target_subfolder: str, entity_id: int, payload: schemas.ImageUploadPayload) -> str:
    """Safely decodes and validates image upload with magic bytes (Pillow).
    Rejects SVG and unverified image formats to prevent XSS and file upload vulnerabilities.
    """
    if payload.image_url:
        return validate_image_url(payload.image_url)

    if not payload.image_base64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either image_base64 or image_url must be provided",
        )

    data = payload.image_base64
    if "," in data:
        header, data = data.split(",", 1)
        if "image/svg" in header.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SVG format is disallowed for security reasons. Please upload PNG, JPG, or WEBP.",
            )

    try:
        binary_data = base64.b64decode(data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 image data",
        )

    if len(binary_data) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size exceeds maximum limit of 5MB",
        )

    # Magic byte verification using Pillow
    try:
        img = Image.open(io.BytesIO(binary_data))
        img_format = img.format.upper() if img.format else ""
        if img_format not in ("PNG", "JPEG", "WEBP"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image format '{img_format}'. Only PNG, JPEG, and WEBP are allowed.",
            )
        img.verify()  # Verifies file integrity
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded file is corrupted or not a valid raster image: {exc}",
        )

    ext = "png" if img_format == "PNG" else ("jpg" if img_format == "JPEG" else "webp")

    upload_dir = settings.UPLOAD_DIR / target_subfolder
    upload_dir.mkdir(parents=True, exist_ok=True)

    timestamp = int(time.time() * 1000)
    filename = f"{target_subfolder}_{entity_id}_{timestamp}.{ext}"
    filepath = upload_dir / filename

    with open(filepath, "wb") as f:
        f.write(binary_data)

    return f"/uploads/{target_subfolder}/{filename}"


def set_team_logo(db: Session, team_id: int, payload: schemas.ImageUploadPayload) -> schemas.TeamOut:
    team = get_team_or_404(db, team_id)
    url = save_uploaded_image("teams", team.id, payload)
    team.logo_url = url
    db.commit()
    db.refresh(team)
    return schemas.TeamOut.model_validate(team)


def set_player_avatar(db: Session, player_id: int, payload: schemas.ImageUploadPayload) -> schemas.PlayerOut:
    player = get_player_or_404(db, player_id)
    url = save_uploaded_image("players", player.id, payload)
    player.avatar_url = url
    if player.user:
        player.user.avatar_url = url
    db.commit()
    db.refresh(player)
    return enrich_player(player)


# Map results & player match stats for HLTV-level fidelity
def add_map_result(db: Session, match_id: int, payload: schemas.MapResultCreate) -> schemas.MapResultOut:
    match = get_match_or_404(db, match_id)
    mr = models.MapResult(
        match_id=match.id,
        map_number=payload.map_number,
        map_name=payload.map_name,
        score_a=payload.score_a,
        score_b=payload.score_b,
        winner_id=payload.winner_id,
    )
    db.add(mr)
    db.commit()
    db.refresh(mr)
    return schemas.MapResultOut(
        id=mr.id,
        match_id=mr.match_id,
        map_number=mr.map_number,
        map_name=mr.map_name,
        score_a=mr.score_a,
        score_b=mr.score_b,
        winner_id=mr.winner_id,
        winner_name=mr.winner.name if mr.winner else None,
    )


def add_player_match_stat(
    db: Session, match_id: int, payload: schemas.PlayerMatchStatCreate
) -> schemas.PlayerMatchStatOut:
    match = get_match_or_404(db, match_id)
    player = get_player_or_404(db, payload.player_id)
    team = get_team_or_404(db, payload.team_id)

    rating = payload.rating
    if rating == 1.0 and payload.kills > 0:
        rounds = 24
        kpr = payload.kills / rounds
        rating = round(
            0.35 * (kpr / 0.679)
            + 0.25 * ((rounds - payload.deaths) / rounds / 0.317)
            + 0.25 * (payload.adr / 75.0)
            + 0.15 * (payload.kast / 70.0),
            2,
        )

    stat = models.PlayerMatchStat(
        match_id=match.id,
        map_id=payload.map_id,
        player_id=player.id,
        team_id=team.id,
        kills=payload.kills,
        deaths=payload.deaths,
        assists=payload.assists,
        headshots=payload.headshots,
        adr=payload.adr,
        kast=payload.kast,
        rating=rating,
        is_mvp=payload.is_mvp,
    )
    db.add(stat)
    db.commit()
    db.refresh(stat)

    return schemas.PlayerMatchStatOut(
        id=stat.id,
        match_id=stat.match_id,
        map_id=stat.map_id,
        player_id=stat.player_id,
        player_nickname=player.nickname,
        team_id=stat.team_id,
        team_name=team.name,
        kills=stat.kills,
        deaths=stat.deaths,
        assists=stat.assists,
        headshots=stat.headshots,
        adr=stat.adr,
        kast=stat.kast,
        rating=stat.rating,
        is_mvp=stat.is_mvp,
    )
