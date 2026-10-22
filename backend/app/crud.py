import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from . import models, schemas
from .auth import hash_password, is_user_admin


# ==========================================
# Users & Authentication
# ==========================================

def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email.strip().lower()).first()


def get_user_by_nickname(db: Session, nickname: str) -> models.User | None:
    return db.query(models.User).filter(models.User.nickname == nickname.strip()).first()


def enrich_user(user: models.User) -> schemas.UserOut:
    out = schemas.UserOut.model_validate(user)
    out.is_admin = is_user_admin(user.email, user.nickname)
    out.player_id = user.player.id if user.player else None
    return out


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
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    user = models.User(
        email=email_clean,
        nickname=nick_clean,
        hashed_password=hashed_pw,
        salt=salt,
        is_active=True,
        created_at=now_str,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return enrich_user(user)


def update_user_self(db: Session, user: models.User, payload: schemas.UserUpdate) -> schemas.UserOut:
    """Standard user can update ONLY their email, nickname, and password."""
    if payload.email is not None:
        new_email = payload.email.strip().lower()
        if new_email != user.email:
            existing = get_user_by_email(db, new_email)
            if existing and existing.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Email '{payload.email}' is already taken",
                )
            user.email = new_email

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

    db.commit()
    db.refresh(user)
    return enrich_user(user)


def get_all_users(db: Session) -> list[schemas.UserOut]:
    users = db.query(models.User).order_by(models.User.id).all()
    return [enrich_user(u) for u in users]


# ==========================================
# Teams
# ==========================================

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
    # Clear matches referencing this team to prevent FK deadlocks
    db.query(models.Match).filter(models.Match.team_a_id == team_id).update({models.Match.team_a_id: None})
    db.query(models.Match).filter(models.Match.team_b_id == team_id).update({models.Match.team_b_id: None})
    db.query(models.Match).filter(models.Match.winner_id == team_id).update({models.Match.winner_id: None})
    db.query(models.Match).filter(models.Match.loser_id == team_id).update({models.Match.loser_id: None})
    db.delete(team)
    db.commit()


# ==========================================
# Players
# ==========================================

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
    """Administrator links a registered user to a player profile."""
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


# ==========================================
# Tournaments
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
    tournament = get_tournament_or_404(db, tournament_id)
    # Clear self-referential match links first to prevent FK deadlock
    db.query(models.Match).filter(models.Match.tournament_id == tournament_id).update({
        models.Match.next_match_id: None,
        models.Match.next_loser_match_id: None,
    })
    db.delete(tournament)
    db.commit()


# ==========================================
# Matches
# ==========================================

def enrich_match(match: models.Match) -> schemas.MatchOut:
    out = schemas.MatchOut.model_validate(match)
    out.team_a_name = match.team_a.name if match.team_a else "TBD"
    out.team_b_name = match.team_b.name if match.team_b else "TBD"
    out.winner_name = match.winner.name if match.winner else None
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
            detail=f"Match with id={match_id} not found",
        )
    return match


def advance_bracket_progression(
    db: Session,
    match: models.Match,
    old_winner_id: int | None = None,
    old_loser_id: int | None = None,
) -> None:
    """Automatically advances match winner and loser to their next bracket positions."""
    if old_winner_id is None:
        old_winner_id = match.winner_id
    if old_loser_id is None:
        old_loser_id = match.loser_id

    # If match is not finished or scores are missing/tied, clear downstream slots
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
                if next_m.team_a_id == old_winner_id:
                    next_m.team_a_id = None
                elif next_m.team_b_id == old_winner_id:
                    next_m.team_b_id = None
        if old_loser_id is not None and match.next_loser_match_id:
            loser_m = db.get(models.Match, match.next_loser_match_id)
            if loser_m:
                if loser_m.team_a_id == old_loser_id:
                    loser_m.team_a_id = None
                elif loser_m.team_b_id == old_loser_id:
                    loser_m.team_b_id = None
        match.winner_id = None
        match.loser_id = None
        return

    winner_id = match.team_a_id if match.score_a > match.score_b else match.team_b_id
    loser_id = match.team_b_id if match.score_a > match.score_b else match.team_a_id

    match.winner_id = winner_id
    match.loser_id = loser_id

    # 1. Advance winner to next match (next_match_id)
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

    # 2. Advance loser to lower bracket match (next_loser_match_id)
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
    # Clear references from other matches to this match
    db.query(models.Match).filter(models.Match.next_match_id == match_id).update({models.Match.next_match_id: None})
    db.query(models.Match).filter(models.Match.next_loser_match_id == match_id).update({models.Match.next_loser_match_id: None})
    db.delete(match)
    db.commit()


# ==========================================
# Bracket Generation
# ==========================================

def get_tournament_brackets(db: Session, tournament_id: int) -> list[models.Bracket]:
    return db.query(models.Bracket).filter(models.Bracket.tournament_id == tournament_id).all()


def generate_tournament_bracket(
    db: Session,
    tournament_id: int,
    payload: schemas.BracketCreate,
) -> schemas.TournamentBracketView:
    """Generates a tournament bracket of the chosen type
    (double_elimination, single_elimination, round_robin, swiss).
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

    # 1. DOUBLE ELIMINATION
    if bracket_type == "double_elimination":
        t_a = payload.team_ids[0] if len(payload.team_ids) > 0 else None
        t_b = payload.team_ids[1] if len(payload.team_ids) > 1 else None
        t_c = payload.team_ids[2] if len(payload.team_ids) > 2 else None
        t_d = payload.team_ids[3] if len(payload.team_ids) > 3 else None

        # Grand final
        grand_final = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="grand_final",
            round_name="Grand final",
            round_order=4,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="01:00 Monday",
        )
        db.add(grand_final)
        db.commit()
        db.refresh(grand_final)

        # Upper final
        upper_final = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="upper",
            round_name="Upper final",
            round_order=2,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="00:00 Sunday",
            next_match_id=grand_final.id,
        )
        db.add(upper_final)
        db.commit()
        db.refresh(upper_final)

        # Consolidation final
        consolidation_final = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="lower",
            round_name="Consolidation final",
            round_order=3,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="22:00 Sunday",
            next_match_id=grand_final.id,
        )
        db.add(consolidation_final)
        db.commit()
        db.refresh(consolidation_final)

        upper_final.next_loser_match_id = consolidation_final.id

        # Lower final
        lower_final = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="lower",
            round_name="Lower final",
            round_order=2,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="21:00 Saturday",
            next_match_id=consolidation_final.id,
        )
        db.add(lower_final)
        db.commit()
        db.refresh(lower_final)

        # Opening round
        m1 = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="upper",
            round_name="Opening round",
            round_order=1,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="21:00 Friday",
            team_a_id=t_a,
            team_b_id=t_b,
            next_match_id=upper_final.id,
            next_loser_match_id=lower_final.id,
        )
        m2 = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="upper",
            round_name="Opening round",
            round_order=1,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="00:00 Saturday",
            team_a_id=t_c,
            team_b_id=t_d,
            next_match_id=upper_final.id,
            next_loser_match_id=lower_final.id,
        )
        db.add_all([m1, m2])
        db.commit()

    # 2. SINGLE ELIMINATION
    elif bracket_type == "single_elimination":
        final_match = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="grand_final",
            round_name="Grand final",
            round_order=2,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="20:00 Sunday",
        )
        db.add(final_match)
        db.commit()
        db.refresh(final_match)

        sf1 = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="single",
            round_name="Semifinals",
            round_order=1,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="17:00 Saturday",
            team_a_id=payload.team_ids[0] if len(payload.team_ids) > 0 else None,
            team_b_id=payload.team_ids[1] if len(payload.team_ids) > 1 else None,
            next_match_id=final_match.id,
        )
        sf2 = models.Match(
            tournament_id=tournament.id,
            bracket_id=bracket_model.id,
            bracket_type="single",
            round_name="Semifinals",
            round_order=1,
            status="UPCOMING",
            match_format=payload.match_format,
            date=tour_date,
            start_time="20:00 Saturday",
            team_a_id=payload.team_ids[2] if len(payload.team_ids) > 2 else None,
            team_b_id=payload.team_ids[3] if len(payload.team_ids) > 3 else None,
            next_match_id=final_match.id,
        )
        db.add_all([sf1, sf2])
        db.commit()

    # 3. ROUND ROBIN
    elif bracket_type == "round_robin":
        team_ids = payload.team_ids
        round_idx = 1
        for i in range(len(team_ids)):
            for j in range(i + 1, len(team_ids)):
                match = models.Match(
                    tournament_id=tournament.id,
                    bracket_id=bracket_model.id,
                    bracket_type="round_robin",
                    round_name=f"Round {round_idx}",
                    round_order=round_idx,
                    status="UPCOMING",
                    match_format=payload.match_format,
                    date=tour_date,
                    team_a_id=team_ids[i],
                    team_b_id=team_ids[j],
                )
                db.add(match)
                round_idx += 1
        db.commit()

    # 4. SWISS SYSTEM
    elif bracket_type == "swiss":
        team_ids = payload.team_ids
        for i in range(0, len(team_ids) - 1, 2):
            match = models.Match(
                tournament_id=tournament.id,
                bracket_id=bracket_model.id,
                bracket_type="swiss",
                round_name="Swiss Round 1",
                round_order=1,
                status="UPCOMING",
                match_format=payload.match_format,
                date=tour_date,
                team_a_id=team_ids[i],
                team_b_id=team_ids[i + 1],
            )
            db.add(match)
        db.commit()

    return get_tournament_bracket_view(db, tournament_id)


def get_tournament_bracket_view(db: Session, tournament_id: int) -> schemas.TournamentBracketView:
    """Produces structured bracket view data for the frontend."""
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


# ==========================================
# Leaderboards
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
