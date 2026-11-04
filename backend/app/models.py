import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    """System user account."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    nickname: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    salt: Mapped[str] = mapped_column(String(64), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    player: Mapped["Player | None"] = relationship(back_populates="user", uselist=False)
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class RefreshToken(Base):
    """Stored refresh tokens for user authentication sessions."""
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    expires_at: Mapped[datetime.datetime] = mapped_column(DateTime, index=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    revoked_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True, default=None)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")


class Tournament(Base):
    """Esports tournament entity."""
    __tablename__ = "tournaments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    prize_pool: Mapped[str] = mapped_column(String(50))
    start_date: Mapped[str] = mapped_column(String(10))
    end_date: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(20), index=True)
    location: Mapped[str] = mapped_column(String(120))

    bracket_type: Mapped[str] = mapped_column(String(40), default="double_elimination", index=True)

    brackets: Mapped[list["Bracket"]] = relationship(
        back_populates="tournament",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    matches: Mapped[list["Match"]] = relationship(
        back_populates="tournament",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Bracket(Base):
    """Tournament bracket stage entity."""
    __tablename__ = "brackets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tournament_id: Mapped[int] = mapped_column(
        ForeignKey("tournaments.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100))
    bracket_type: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")

    tournament: Mapped["Tournament"] = relationship(back_populates="brackets")
    matches: Mapped[list["Match"]] = relationship(
        back_populates="bracket",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Team(Base):
    """Esports team entity."""
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    short_name: Mapped[str] = mapped_column(String(40))
    region: Mapped[str] = mapped_column(String(60))
    coach: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(500))
    ranking: Mapped[int] = mapped_column(Integer, index=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    players: Mapped[list["Player"]] = relationship(
        back_populates="team",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Player(Base):
    """Player entity. Can be bound to a User account or created independently by admin."""
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nickname: Mapped[str] = mapped_column(String(60), index=True)
    name: Mapped[str] = mapped_column(String(120))
    age: Mapped[int] = mapped_column(Integer)
    role: Mapped[str] = mapped_column(String(60))
    nationality: Mapped[str] = mapped_column(String(60))
    kd: Mapped[str] = mapped_column(String(10))
    impact: Mapped[float] = mapped_column(Float)
    maps: Mapped[int] = mapped_column(Integer)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    team_id: Mapped[int] = mapped_column(
        ForeignKey("teams.id", ondelete="CASCADE"), index=True
    )
    team: Mapped["Team"] = relationship(back_populates="players")

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        index=True,
    )
    user: Mapped["User | None"] = relationship(back_populates="player")

    match_stats: Mapped[list["PlayerMatchStat"]] = relationship(
        back_populates="player",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Match(Base):
    """Tournament match entity."""
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="UPCOMING", index=True)
    score_a: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_b: Mapped[int | None] = mapped_column(Integer, nullable=True)
    date: Mapped[str] = mapped_column(String(10), index=True)
    start_time: Mapped[str | None] = mapped_column(String(30), nullable=True)
    map_name: Mapped[str | None] = mapped_column(String(40), nullable=True)
    match_format: Mapped[str] = mapped_column(String(10), default="BO3")

    bracket_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    round_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    round_order: Mapped[int | None] = mapped_column(Integer, nullable=True)

    team_a_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True
    )
    team_b_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True
    )
    winner_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"), nullable=True
    )
    loser_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"), nullable=True
    )

    tournament_id: Mapped[int] = mapped_column(
        ForeignKey("tournaments.id", ondelete="CASCADE"), index=True
    )
    bracket_id: Mapped[int | None] = mapped_column(
        ForeignKey("brackets.id", ondelete="CASCADE"), nullable=True, index=True
    )

    next_match_id: Mapped[int | None] = mapped_column(
        ForeignKey("matches.id", ondelete="SET NULL"), nullable=True
    )
    next_loser_match_id: Mapped[int | None] = mapped_column(
        ForeignKey("matches.id", ondelete="SET NULL"), nullable=True
    )

    team_a: Mapped["Team | None"] = relationship(foreign_keys=[team_a_id])
    team_b: Mapped["Team | None"] = relationship(foreign_keys=[team_b_id])
    winner: Mapped["Team | None"] = relationship(foreign_keys=[winner_id])
    tournament: Mapped["Tournament"] = relationship(back_populates="matches")
    bracket: Mapped["Bracket | None"] = relationship(back_populates="matches")

    map_results: Mapped[list["MapResult"]] = relationship(
        back_populates="match",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    player_stats: Mapped[list["PlayerMatchStat"]] = relationship(
        back_populates="match",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class MapResult(Base):
    """Individual map outcome within a match (BO3 / BO5 breakdown)."""
    __tablename__ = "map_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    match_id: Mapped[int] = mapped_column(
        ForeignKey("matches.id", ondelete="CASCADE"), index=True
    )
    map_number: Mapped[int] = mapped_column(Integer, default=1)
    map_name: Mapped[str] = mapped_column(String(40))
    score_a: Mapped[int] = mapped_column(Integer, default=0)
    score_b: Mapped[int] = mapped_column(Integer, default=0)
    winner_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"), nullable=True
    )

    match: Mapped["Match"] = relationship(back_populates="map_results")
    winner: Mapped["Team | None"] = relationship(foreign_keys=[winner_id])


class PlayerMatchStat(Base):
    """Detailed HLTV-style player statistics per match."""
    __tablename__ = "player_match_stats"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    match_id: Mapped[int] = mapped_column(
        ForeignKey("matches.id", ondelete="CASCADE"), index=True
    )
    map_id: Mapped[int | None] = mapped_column(
        ForeignKey("map_results.id", ondelete="CASCADE"), nullable=True
    )
    player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"), index=True
    )
    team_id: Mapped[int] = mapped_column(
        ForeignKey("teams.id", ondelete="CASCADE"), index=True
    )

    kills: Mapped[int] = mapped_column(Integer, default=0)
    deaths: Mapped[int] = mapped_column(Integer, default=0)
    assists: Mapped[int] = mapped_column(Integer, default=0)
    headshots: Mapped[int] = mapped_column(Integer, default=0)
    adr: Mapped[float] = mapped_column(Float, default=70.0)
    kast: Mapped[float] = mapped_column(Float, default=70.0)
    rating: Mapped[float] = mapped_column(Float, default=1.0)
    is_mvp: Mapped[bool] = mapped_column(Boolean, default=False)

    match: Mapped["Match"] = relationship(back_populates="player_stats")
    player: Mapped["Player"] = relationship(back_populates="match_stats")
    team: Mapped["Team"] = relationship()
