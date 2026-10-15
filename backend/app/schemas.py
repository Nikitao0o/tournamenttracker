from pydantic import BaseModel, ConfigDict, Field


# ---------- Team ----------
class TeamBase(BaseModel):
    name: str
    short_name: str
    region: str
    coach: str
    description: str
    ranking: int


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: str | None = None
    short_name: str | None = None
    region: str | None = None
    coach: str | None = None
    description: str | None = None
    ranking: int | None = None


class TeamOut(TeamBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Player ----------
class PlayerBase(BaseModel):
    nickname: str
    name: str
    age: int
    role: str
    nationality: str
    kd: str
    impact: float
    maps: int
    team_id: int


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(BaseModel):
    nickname: str | None = None
    name: str | None = None
    age: int | None = None
    role: str | None = None
    nationality: str | None = None
    kd: str | None = None
    impact: float | None = None
    maps: int | None = None
    team_id: int | None = None


class PlayerOut(PlayerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    team_name: str | None = None


# ---------- Tournament ----------
class TournamentBase(BaseModel):
    title: str
    prize_pool: str
    start_date: str
    end_date: str
    status: str
    location: str


class TournamentCreate(TournamentBase):
    pass


class TournamentUpdate(BaseModel):
    title: str | None = None
    prize_pool: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    status: str | None = None
    location: str | None = None


class TournamentOut(TournamentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Match ----------
class MatchBase(BaseModel):
    status: str
    score_a: int | None = None
    score_b: int | None = None
    date: str
    map_name: str | None = None
    team_a_id: int
    team_b_id: int
    tournament_id: int


class MatchCreate(MatchBase):
    pass


class MatchUpdate(BaseModel):
    status: str | None = None
    score_a: int | None = None
    score_b: int | None = None
    date: str | None = None
    map_name: str | None = None


class MatchOut(MatchBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    team_a_name: str | None = None
    team_b_name: str | None = None
    tournament_name: str | None = None


# ---------- Leaderboards ----------
class TeamLeaderboardEntry(BaseModel):
    rank: int
    team_id: int
    name: str


class PlayerLeaderboardEntry(BaseModel):
    rank: int
    player_id: int
    nickname: str
    team_name: str
    rating: float