from sqlalchemy import Boolean, ForeignKey, Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    """System user account."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    nickname: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(128))
    salt: Mapped[str] = mapped_column(String(64))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[str] = mapped_column(String(30))

    # Relationship to optional player profile (1:1)
    player: Mapped["Player | None"] = relationship(back_populates="user", uselist=False)


class Tournament(Base):
    """Esports tournament entity."""
    __tablename__ = "tournaments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    prize_pool: Mapped[str] = mapped_column(String(50))
    start_date: Mapped[str] = mapped_column(String(10))   # YYYY-MM-DD
    end_date: Mapped[str] = mapped_column(String(10))     # YYYY-MM-DD
    status: Mapped[str] = mapped_column(String(20), index=True)  # Upcoming / Ongoing / Completed
    location: Mapped[str] = mapped_column(String(120))

    # Tournament bracket type selection:
    # double_elimination / single_elimination / round_robin / swiss
    bracket_type: Mapped[str] = mapped_column(String(40), default="double_elimination", index=True)

    # Cascading relationships to brackets and matches
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
    tournament_id: Mapped[int] = mapped_column(ForeignKey("tournaments.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))          # "Playoffs", "Upper Bracket", "Group Stage"
    bracket_type: Mapped[str] = mapped_column(String(40))   # single_elimination, double_elimination, round_robin, swiss
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")  # PENDING / ACTIVE / COMPLETED

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
    kd: Mapped[str] = mapped_column(String(10))          # "1.28"
    impact: Mapped[float] = mapped_column(Float)
    maps: Mapped[int] = mapped_column(Integer)

    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), index=True)
    team: Mapped["Team"] = relationship(back_populates="players")

    # Optional account binding (Nullable: admins can create pro players without email/password)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        index=True,
    )
    user: Mapped["User | None"] = relationship(back_populates="player")


class Match(Base):
    """Tournament match entity."""
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="UPCOMING", index=True)  # UPCOMING / LIVE / FINISHED
    score_a: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_b: Mapped[int | None] = mapped_column(Integer, nullable=True)
    date: Mapped[str] = mapped_column(String(10), index=True)    # YYYY-MM-DD
    start_time: Mapped[str | None] = mapped_column(String(30), nullable=True)  # "21:00 Friday", "00:00 Saturday"
    map_name: Mapped[str | None] = mapped_column(String(40), nullable=True)
    match_format: Mapped[str] = mapped_column(String(10), default="BO3")       # BO1, BO3, BO5

    # Bracket positioning
    bracket_type: Mapped[str | None] = mapped_column(String(40), nullable=True) # upper, lower, grand_final, single, round_robin, swiss
    round_name: Mapped[str | None] = mapped_column(String(80), nullable=True)   # "Opening round", "Upper final", "Grand final"
    round_order: Mapped[int | None] = mapped_column(Integer, nullable=True)     # Round order number (1, 2, 3...)

    # Match participants (Nullable=True for TBD slots in tournament brackets)
    team_a_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    team_b_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    winner_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    loser_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)

    tournament_id: Mapped[int] = mapped_column(ForeignKey("tournaments.id", ondelete="CASCADE"), index=True)
    bracket_id: Mapped[int | None] = mapped_column(ForeignKey("brackets.id", ondelete="CASCADE"), nullable=True, index=True)

    # Progression graph links
    next_match_id: Mapped[int | None] = mapped_column(ForeignKey("matches.id", ondelete="SET NULL"), nullable=True)
    next_loser_match_id: Mapped[int | None] = mapped_column(ForeignKey("matches.id", ondelete="SET NULL"), nullable=True)

    team_a: Mapped["Team | None"] = relationship(foreign_keys=[team_a_id])
    team_b: Mapped["Team | None"] = relationship(foreign_keys=[team_b_id])
    winner: Mapped["Team | None"] = relationship(foreign_keys=[winner_id])
    tournament: Mapped["Tournament"] = relationship(back_populates="matches")
    bracket: Mapped["Bracket | None"] = relationship(back_populates="matches")
