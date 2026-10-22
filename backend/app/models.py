from sqlalchemy import ForeignKey, Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Tournament(Base):
    __tablename__ = "tournaments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    prize_pool: Mapped[str] = mapped_column(String(50))
    start_date: Mapped[str] = mapped_column(String(10))   # YYYY-MM-DD
    end_date: Mapped[str] = mapped_column(String(10))     # YYYY-MM-DD
    status: Mapped[str] = mapped_column(String(20), index=True)  # Ongoing/Upcoming/Completed
    location: Mapped[str] = mapped_column(String(120))

    # Каскадное удаление матчей при удалении турнира
    matches: Mapped[list["Match"]] = relationship(
        back_populates="tournament",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    short_name: Mapped[str] = mapped_column(String(40))
    region: Mapped[str] = mapped_column(String(60))
    coach: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(500))
    ranking: Mapped[int] = mapped_column(Integer, index=True)

    # Каскадное удаление игроков при удалении команды
    players: Mapped[list["Player"]] = relationship(
        back_populates="team",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Player(Base):
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


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    status: Mapped[str] = mapped_column(String(20), index=True)  # LIVE/UPCOMING/FINISHED
    score_a: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_b: Mapped[int | None] = mapped_column(Integer, nullable=True)
    date: Mapped[str] = mapped_column(String(10), index=True)    # YYYY-MM-DD
    map_name: Mapped[str | None] = mapped_column(String(40), nullable=True)

    team_a_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), index=True)
    team_b_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), index=True)
    tournament_id: Mapped[int] = mapped_column(ForeignKey("tournaments.id", ondelete="CASCADE"), index=True)

    team_a: Mapped["Team"] = relationship(foreign_keys=[team_a_id])
    team_b: Mapped["Team"] = relationship(foreign_keys=[team_b_id])
    tournament: Mapped["Tournament"] = relationship(back_populates="matches")
