from pydantic import BaseModel, ConfigDict, Field, model_validator


# ==========================================
# User / Auth
# ==========================================

class UserRegister(BaseModel):
    email: str = Field(..., min_length=3, max_length=120, description="User email address")
    nickname: str = Field(..., min_length=2, max_length=60, description="Display nickname")
    password: str = Field(..., min_length=6, max_length=100, description="Account password")


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    """Standard user can update ONLY email, nickname, and password."""
    email: str | None = Field(default=None, min_length=3, max_length=120)
    nickname: str | None = Field(default=None, min_length=2, max_length=60)
    password: str | None = Field(default=None, min_length=6, max_length=100)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    nickname: str
    is_active: bool
    created_at: str
    is_admin: bool = False
    player_id: int | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ==========================================
# Team
# ==========================================

class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Full team name")
    short_name: str = Field(..., min_length=1, max_length=40, description="Short tag or name")
    region: str = Field(..., min_length=1, max_length=60, description="Region (Europe, Americas, etc.)")
    coach: str = Field(..., min_length=1, max_length=120, description="Head coach")
    description: str = Field(..., max_length=500, description="Team description")
    ranking: int = Field(..., ge=1, description="World ranking position")


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


# ==========================================
# Player
# ==========================================

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


class PlayerOut(PlayerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    team_name: str | None = None
    user_email: str | None = None


# Admin binding schema
class AdminClaimPlayer(BaseModel):
    player_id: int
    user_id: int


# ==========================================
# Tournament
# ==========================================

class TournamentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Tournament title")
    prize_pool: str = Field(..., min_length=1, max_length=50, description="Prize pool (e.g. '$1,000,000')")
    start_date: str = Field(..., min_length=8, max_length=10, description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., min_length=8, max_length=10, description="End date (YYYY-MM-DD)")
    status: str = Field(..., min_length=1, max_length=20, description="Status (Upcoming, Ongoing, Completed)")
    location: str = Field(..., min_length=1, max_length=120, description="Location (City, Country)")
    bracket_type: str = Field(
        default="double_elimination",
        description="Bracket type: double_elimination, single_elimination, round_robin, swiss",
    )


class TournamentCreate(TournamentBase):
    pass


class TournamentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    prize_pool: str | None = Field(default=None, min_length=1, max_length=50)
    start_date: str | None = Field(default=None, min_length=8, max_length=10)
    end_date: str | None = Field(default=None, min_length=8, max_length=10)
    status: str | None = Field(default=None, min_length=1, max_length=20)
    location: str | None = Field(default=None, min_length=1, max_length=120)
    bracket_type: str | None = Field(default=None)


class TournamentOut(TournamentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ==========================================
# Match
# ==========================================

class MatchBase(BaseModel):
    status: str = Field(default="UPCOMING", min_length=1, max_length=20, description="Match status (UPCOMING, LIVE, FINISHED)")
    score_a: int | None = Field(default=None, ge=0, description="Team A score")
    score_b: int | None = Field(default=None, ge=0, description="Team B score")
    date: str = Field(..., min_length=8, max_length=10, description="Match date (YYYY-MM-DD)")
    start_time: str | None = Field(default=None, description="Time and day (e.g. '21:00 Friday')")
    map_name: str | None = Field(default=None, max_length=40, description="Map name (Mirage, Inferno, Dust2...)")
    match_format: str = Field(default="BO3", description="Series format (BO1, BO3, BO5)")

    bracket_type: str | None = Field(default=None, description="upper, lower, grand_final, single, round_robin, swiss")
    round_name: str | None = Field(default=None, description="Opening round, Upper final, Grand final, etc.")
    round_order: int | None = Field(default=None, description="Round order sequence number")

    # None indicates TBD (participant team not yet determined)
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
    status: str | None = Field(default=None, min_length=1, max_length=20)
    score_a: int | None = Field(default=None, ge=0)
    score_b: int | None = Field(default=None, ge=0)
    date: str | None = Field(default=None, min_length=8, max_length=10)
    start_time: str | None = Field(default=None)
    map_name: str | None = Field(default=None, max_length=40)
    match_format: str | None = Field(default=None)
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


class MatchOut(MatchBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    team_a_name: str | None = None
    team_b_name: str | None = None
    winner_id: int | None = None
    loser_id: int | None = None
    winner_name: str | None = None
    tournament_name: str | None = None


# ==========================================
# Bracket
# ==========================================

class BracketBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Bracket stage name (Playoffs, Group Stage)")
    bracket_type: str = Field(
        ...,
        description="Bracket type: single_elimination, double_elimination, round_robin, swiss",
    )
    status: str = Field(default="ACTIVE")


class BracketCreate(BracketBase):
    team_ids: list[int] = Field(..., min_length=2, description="List of participant team IDs")
    match_format: str = Field(default="BO3", description="Series format (BO1, BO3, BO5)")


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


# ==========================================
# Leaderboards
# ==========================================

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
