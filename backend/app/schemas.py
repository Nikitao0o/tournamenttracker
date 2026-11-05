import datetime
import re
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def validate_image_url(url: str | None) -> str | None:
    """Validates that an image URL begins with /uploads/, http://, https://, or data:image/."""
    if url is None:
        return None
    url = url.strip()
    if not url:
        return None
    if (
        url.startswith("/uploads/")
        or url.startswith("http://")
        or url.startswith("https://")
        or url.startswith("data:image/")
    ):
        return url
    raise ValueError("Image URL must start with 'http://', 'https://', '/uploads/', or 'data:image/'")


class UserRegister(BaseModel):
    email: str = Field(..., min_length=3, max_length=120, description="Valid user email address")
    nickname: str = Field(..., min_length=2, max_length=60, description="Display nickname")
    password: str = Field(..., min_length=6, max_length=100, description="Account password")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, clean):
            raise ValueError("Invalid email format. Must follow user@domain.tld")
        return clean


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    """Standard user can update nickname, password, and avatar. Email changes are restricted."""
    nickname: str | None = Field(default=None, min_length=2, max_length=60)
    password: str | None = Field(default=None, min_length=6, max_length=100)
    avatar_url: str | None = Field(default=None, max_length=10_000_000)

    @field_validator("avatar_url", mode="before")
    @classmethod
    def check_avatar_url(cls, v: str | None) -> str | None:
        return validate_image_url(v)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    nickname: str
    is_active: bool
    created_at: str | datetime.datetime
    is_admin: bool = False
    player_id: int | None = None
    avatar_url: str | None = None


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Valid refresh token string")


class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Full team name")
    short_name: str = Field(..., min_length=1, max_length=40, description="Short tag or name")
    region: str = Field(..., min_length=1, max_length=60, description="Region (Europe, Americas, etc.)")
    coach: str = Field(..., min_length=1, max_length=120, description="Head coach")
    description: str = Field(..., max_length=500, description="Team description")
    ranking: int = Field(..., ge=1, description="World ranking position")
    logo_url: str | None = Field(default=None, max_length=10_000_000, description="Team logo URL")

    @field_validator("logo_url", mode="before")
    @classmethod
    def check_logo_url(cls, v: str | None) -> str | None:
        return validate_image_url(v)


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    short_name: str | None = Field(default=None, min_length=1, max_length=40)
    region: str | None = Field(default=None, min_length=1, max_length=60)
    coach: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    ranking: int | None = Field(default=None, ge=1)
    logo_url: str | None = Field(default=None, max_length=10_000_000)

    @field_validator("logo_url", mode="before")
    @classmethod
    def check_logo_url(cls, v: str | None) -> str | None:
        return validate_image_url(v)


class TeamOut(TeamBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class PlayerBase(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=60, description="Player nickname")
    name: str = Field(..., min_length=1, max_length=120, description="Full legal name")
    age: int = Field(..., ge=10, le=100, description="Player age")
    role: str = Field(..., min_length=1, max_length=60, description="Game role (AWPer, IGL, Rifler, etc.)")
    nationality: str = Field(..., min_length=1, max_length=60, description="Nationality")
    kd: str = Field(..., min_length=1, max_length=10, description="K/D ratio (e.g. '1.28')")
    impact: float = Field(..., ge=0.0, description="Impact rating")
    maps: int = Field(..., ge=0, description="Number of played maps")
    team_id: int = Field(..., ge=1, description="Team ID")
    user_id: int | None = Field(default=None, description="Linked user account ID (if any)")
    avatar_url: str | None = Field(default=None, max_length=10_000_000, description="Player avatar URL")

    @field_validator("avatar_url", mode="before")
    @classmethod
    def check_avatar_url(cls, v: str | None) -> str | None:
        return validate_image_url(v)


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
    user_id: int | None = Field(default=None)
    avatar_url: str | None = Field(default=None, max_length=10_000_000)

    @field_validator("avatar_url", mode="before")
    @classmethod
    def check_avatar_url(cls, v: str | None) -> str | None:
        return validate_image_url(v)


class PlayerOut(PlayerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    team_name: str | None = None
    user_email: str | None = None


class AdminClaimPlayer(BaseModel):
    player_id: int
    user_id: int


class TournamentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Tournament title")
    prize_pool: str = Field(..., min_length=1, max_length=50, description="Prize pool (e.g. '$1,000,000')")
    start_date: str = Field(..., min_length=8, max_length=10, description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., min_length=8, max_length=10, description="End date (YYYY-MM-DD)")
    status: Literal["Upcoming", "Ongoing", "Completed"] = "Upcoming"
    location: str = Field(..., min_length=1, max_length=120, description="Location (City, Country)")
    bracket_type: Literal["single_elimination", "double_elimination", "round_robin", "swiss"] = "double_elimination"

    @model_validator(mode="after")
    def validate_dates(self):
        try:
            d_start = datetime.date.fromisoformat(self.start_date)
            d_end = datetime.date.fromisoformat(self.end_date)
            if d_end < d_start:
                raise ValueError("end_date must be greater than or equal to start_date")
        except ValueError as e:
            if "greater than or equal to" in str(e):
                raise
            raise ValueError("Dates must be valid ISO dates in YYYY-MM-DD format")
        return self


class TournamentCreate(TournamentBase):
    pass


class TournamentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    prize_pool: str | None = Field(default=None, min_length=1, max_length=50)
    start_date: str | None = Field(default=None, min_length=8, max_length=10)
    end_date: str | None = Field(default=None, min_length=8, max_length=10)
    status: Literal["Upcoming", "Ongoing", "Completed"] | None = None
    location: str | None = Field(default=None, min_length=1, max_length=120)
    bracket_type: Literal["single_elimination", "double_elimination", "round_robin", "swiss"] | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date:
            try:
                d_start = datetime.date.fromisoformat(self.start_date)
                d_end = datetime.date.fromisoformat(self.end_date)
                if d_end < d_start:
                    raise ValueError("end_date must be greater than or equal to start_date")
            except ValueError as e:
                if "greater than or equal to" in str(e):
                    raise
                raise ValueError("Dates must be valid ISO dates in YYYY-MM-DD format")
        return self


class TournamentOut(TournamentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class MapResultBase(BaseModel):
    map_number: int = Field(default=1, ge=1)
    map_name: str = Field(..., min_length=1, max_length=40)
    score_a: int = Field(default=0, ge=0)
    score_b: int = Field(default=0, ge=0)
    winner_id: int | None = None


class MapResultCreate(MapResultBase):
    pass


class MapResultUpdate(BaseModel):
    map_number: int | None = Field(default=None, ge=1)
    map_name: str | None = Field(default=None, min_length=1, max_length=40)
    score_a: int | None = Field(default=None, ge=0)
    score_b: int | None = Field(default=None, ge=0)
    winner_id: int | None = None


class MapResultOut(MapResultBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    match_id: int
    winner_name: str | None = None


class PlayerMatchStatBase(BaseModel):
    player_id: int
    team_id: int
    map_id: int | None = None
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    headshots: int = 0
    adr: float = 70.0
    kast: float = 70.0
    rating: float = 1.0
    is_mvp: bool = False


class PlayerMatchStatCreate(PlayerMatchStatBase):
    rating: float | None = None


class PlayerMatchStatUpdate(BaseModel):
    map_id: int | None = None
    kills: int | None = None
    deaths: int | None = None
    assists: int | None = None
    headshots: int | None = None
    adr: float | None = None
    kast: float | None = None
    rating: float | None = None
    is_mvp: bool | None = None


class PlayerMatchStatOut(PlayerMatchStatBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    match_id: int
    player_nickname: str | None = None
    team_name: str | None = None


class MatchBase(BaseModel):
    status: Literal["UPCOMING", "LIVE", "FINISHED"] = Field(
        default="UPCOMING", description="Match status (UPCOMING, LIVE, FINISHED)"
    )
    score_a: int | None = Field(default=None, ge=0, description="Team A score")
    score_b: int | None = Field(default=None, ge=0, description="Team B score")
    date: str = Field(..., min_length=8, max_length=10, description="Match date (YYYY-MM-DD)")
    start_time: str | None = Field(default=None, description="Time and day (e.g. '21:00 Friday')")
    map_name: str | None = Field(default=None, max_length=40, description="Map name (Mirage, Inferno, Dust2...)")
    match_format: Literal["BO1", "BO3", "BO5"] = Field(default="BO3", description="Series format (BO1, BO3, BO5)")

    bracket_type: str | None = Field(default=None, description="upper, lower, grand_final, single, round_robin, swiss")
    round_name: str | None = Field(default=None, description="Opening round, Upper final, Grand final, etc.")
    round_order: int | None = Field(default=None, description="Round order sequence number")

    team_a_id: int | None = Field(default=None, description="Team A ID (None = TBD)")
    team_b_id: int | None = Field(default=None, description="Team B ID (None = TBD)")
    tournament_id: int = Field(..., ge=1, description="Tournament ID")
    bracket_id: int | None = Field(default=None, description="Bracket stage ID")

    next_match_id: int | None = Field(default=None, description="Next match for winner")
    next_loser_match_id: int | None = Field(default=None, description="Next match for loser (Double Elimination)")


class MatchCreate(MatchBase):
    @model_validator(mode="after")
    def validate_teams_distinct(self):
        if self.team_a_id is not None and self.team_b_id is not None and self.team_a_id == self.team_b_id:
            raise ValueError("team_a_id and team_b_id must reference distinct teams")
        return self


class MatchUpdate(BaseModel):
    status: Literal["UPCOMING", "LIVE", "FINISHED"] | None = None
    score_a: int | None = Field(default=None, ge=0)
    score_b: int | None = Field(default=None, ge=0)
    date: str | None = Field(default=None, min_length=8, max_length=10)
    start_time: str | None = Field(default=None)
    map_name: str | None = Field(default=None, max_length=40)
    match_format: Literal["BO1", "BO3", "BO5"] | None = None
    team_a_id: int | None = Field(default=None)
    team_b_id: int | None = Field(default=None)
    winner_id: int | None = Field(default=None)
    loser_id: int | None = Field(default=None)
    bracket_type: str | None = Field(default=None)
    round_name: str | None = Field(default=None)
    round_order: int | None = Field(default=None)
    next_match_id: int | None = Field(default=None)
    next_loser_match_id: int | None = Field(default=None)

    @model_validator(mode="after")
    def validate_teams_distinct(self):
        if (
            self.team_a_id is not None
            and self.team_b_id is not None
            and self.team_a_id == self.team_b_id
        ):
            raise ValueError("team_a_id and team_b_id must reference distinct teams")
        return self


class MatchListOut(MatchBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    winner_id: int | None = None
    loser_id: int | None = None
    team_a_name: str | None = None
    team_b_name: str | None = None
    team_a_short: str | None = None
    team_b_short: str | None = None
    team_a_logo_url: str | None = None
    team_b_logo_url: str | None = None
    winner_name: str | None = None
    tournament_name: str | None = None


class MatchDetailOut(MatchListOut):
    map_results: list[MapResultOut] = []
    player_stats: list[PlayerMatchStatOut] = []


MatchOut = MatchDetailOut


class BracketBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Bracket stage name (Playoffs, Group Stage)")
    bracket_type: Literal["single_elimination", "double_elimination", "round_robin", "swiss"] = Field(
        ...,
        description="Bracket type: single_elimination, double_elimination, round_robin, swiss",
    )
    status: str = Field(default="ACTIVE")


class BracketCreate(BracketBase):
    team_ids: list[int] = Field(..., min_length=2, description="List of participant team IDs")
    match_format: Literal["BO1", "BO3", "BO5"] = Field(default="BO3", description="Series format (BO1, BO3, BO5)")


class BracketOut(BracketBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tournament_id: int


class BracketRoundGroup(BaseModel):
    round_name: str
    round_order: int
    matches: list[MatchOut]


class TournamentBracketView(BaseModel):
    tournament_id: int
    tournament_title: str
    bracket_type: str
    upper_bracket: list[BracketRoundGroup] = []
    lower_bracket: list[BracketRoundGroup] = []
    grand_final: MatchOut | None = None
    all_rounds: list[BracketRoundGroup] = []


class TeamLeaderboardEntry(BaseModel):
    rank: int
    team_id: int
    name: str
    logo_url: str | None = None
    points: int = 1000
    win_rate: float = 0.0


class PlayerLeaderboardEntry(BaseModel):
    rank: int
    player_id: int
    nickname: str
    team_name: str
    avatar_url: str | None = None
    rating: float | None = None
    kd: str = "1.00"
    adr: float = 70.0


class ImageUploadPayload(BaseModel):
    image_base64: str | None = Field(default=None, description="Base64 encoded image data string")
    image_url: str | None = Field(default=None, max_length=500, description="Direct image URL")
    filename: str | None = Field(default=None, max_length=120, description="Original image filename")
