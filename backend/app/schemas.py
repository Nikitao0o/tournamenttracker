from pydantic import BaseModel, ConfigDict, Field, model_validator


# ---------- Team ----------
class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Полное название команды")
    short_name: str = Field(..., min_length=1, max_length=40, description="Короткое название/тег")
    region: str = Field(..., min_length=1, max_length=60, description="Регион (Europe, Americas и т.д.)")
    coach: str = Field(..., min_length=1, max_length=120, description="Тренер команды")
    description: str = Field(..., max_length=500, description="Описание команды")
    ranking: int = Field(..., ge=1, description="Позиция в мировом рейтинге")


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    short_name: str | None = Field(default=None, min_length=1, max_length=40)
    region: str | None = Field(default=None, min_length=1, max_length=60)
    coach: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    ranking: int | None = Field(default=None, ge=1)


class TeamOut(TeamBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Player ----------
class PlayerBase(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=60, description="Никнейм игрока")
    name: str = Field(..., min_length=1, max_length=120, description="Реальное имя и фамилия")
    age: int = Field(..., ge=10, le=100, description="Возраст игрока")
    role: str = Field(..., min_length=1, max_length=60, description="Игровая роль (AWPer, IGL, Rifler и др.)")
    nationality: str = Field(..., min_length=1, max_length=60, description="Национальность/гражданство")
    kd: str = Field(..., min_length=1, max_length=10, description="Соотношение K/D (например, '1.28')")
    impact: float = Field(..., ge=0.0, description="Рейтинг влияния (Impact)")
    maps: int = Field(..., ge=0, description="Количество сыгранных карт")
    team_id: int = Field(..., ge=1, description="ID команды, за которую выступает игрок")


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(BaseModel):
    nickname: str | None = Field(default=None, min_length=1, max_length=60)
    name: str | None = Field(default=None, min_length=1, max_length=120)
    age: int | None = Field(default=None, ge=10, le=100)
    role: str | None = Field(default=None, min_length=1, max_length=60)
    nationality: str | None = Field(default=None, min_length=1, max_length=60)
    kd: str | None = Field(default=None, min_length=1, max_length=10)
    impact: float | None = Field(default=None, ge=0.0)
    maps: int | None = Field(default=None, ge=0)
    team_id: int | None = Field(default=None, ge=1)


class PlayerOut(PlayerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    team_name: str | None = None


# ---------- Tournament ----------
class TournamentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Название турнира")
    prize_pool: str = Field(..., min_length=1, max_length=50, description="Призовой фонд (например, '$1,000,000')")
    start_date: str = Field(..., min_length=8, max_length=10, description="Дата начала (YYYY-MM-DD)")
    end_date: str = Field(..., min_length=8, max_length=10, description="Дата окончания (YYYY-MM-DD)")
    status: str = Field(..., min_length=1, max_length=20, description="Статус (Upcoming, Ongoing, Completed)")
    location: str = Field(..., min_length=1, max_length=120, description="Место проведения (город, страна)")


class TournamentCreate(TournamentBase):
    pass


class TournamentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    prize_pool: str | None = Field(default=None, min_length=1, max_length=50)
    start_date: str | None = Field(default=None, min_length=8, max_length=10)
    end_date: str | None = Field(default=None, min_length=8, max_length=10)
    status: str | None = Field(default=None, min_length=1, max_length=20)
    location: str | None = Field(default=None, min_length=1, max_length=120)


class TournamentOut(TournamentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Match ----------
class MatchBase(BaseModel):
    status: str = Field(..., min_length=1, max_length=20, description="Статус матча (LIVE, UPCOMING, FINISHED)")
    score_a: int | None = Field(default=None, ge=0, description="Счёт команды A")
    score_b: int | None = Field(default=None, ge=0, description="Счёт команды B")
    date: str = Field(..., min_length=8, max_length=10, description="Дата проведения (YYYY-MM-DD)")
    map_name: str | None = Field(default=None, max_length=40, description="Карта (Mirage, Inferno, Dust2...)")
    team_a_id: int = Field(..., ge=1, description="ID команды A")
    team_b_id: int = Field(..., ge=1, description="ID команды B")
    tournament_id: int = Field(..., ge=1, description="ID турнира")


class MatchCreate(MatchBase):
    @model_validator(mode="after")
    def validate_teams_distinct(self):
        if self.team_a_id == self.team_b_id:
            raise ValueError("team_a_id и team_b_id должны ссылаться на разные команды")
        return self


class MatchUpdate(BaseModel):
    status: str | None = Field(default=None, min_length=1, max_length=20)
    score_a: int | None = Field(default=None, ge=0)
    score_b: int | None = Field(default=None, ge=0)
    date: str | None = Field(default=None, min_length=8, max_length=10)
    map_name: str | None = Field(default=None, max_length=40)
    team_a_id: int | None = Field(default=None, ge=1)
    team_b_id: int | None = Field(default=None, ge=1)
    tournament_id: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_teams_distinct(self):
        if (
            self.team_a_id is not None
            and self.team_b_id is not None
            and self.team_a_id == self.team_b_id
        ):
            raise ValueError("team_a_id и team_b_id должны ссылаться на разные команды")
        return self


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
