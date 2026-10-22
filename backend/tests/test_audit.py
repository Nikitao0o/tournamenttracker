import unittest
import os
import sys

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi import HTTPException
from pydantic import ValidationError

from app import models, schemas, crud
from app.auth import is_user_admin
from app.seed import seed_if_empty


class TestAllRoutesAndEdgeCases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.Session = sessionmaker(bind=cls.engine, autoflush=False, autocommit=False)

    def setUp(self):
        models.Base.metadata.create_all(bind=self.engine)
        self.db = self.Session()
        seed_if_empty(self.db)

    def tearDown(self):
        self.db.close()
        models.Base.metadata.drop_all(bind=self.engine)

    def test_all_entity_crud_and_invalid_foreign_keys(self):
        # 1. Teams
        teams = crud.get_teams(self.db)
        self.assertTrue(len(teams) >= 4)
        team = teams[0]

        # Read team
        t_read = crud.get_team_or_404(self.db, team.id)
        self.assertEqual(t_read.id, team.id)

        # 404 on non-existing team
        with self.assertRaises(HTTPException) as ctx:
            crud.get_team_or_404(self.db, 999999)
        self.assertEqual(ctx.exception.status_code, 404)

        # 409 on duplicate team name
        with self.assertRaises(HTTPException) as ctx:
            crud.create_team(
                self.db,
                schemas.TeamCreate(
                    name=team.name,
                    short_name="DUP",
                    region="EU",
                    coach="Coach",
                    description="Desc",
                    ranking=99,
                ),
            )
        self.assertEqual(ctx.exception.status_code, 409)

        # 2. Players with invalid foreign key
        with self.assertRaises(HTTPException) as ctx:
            crud.create_player(
                self.db,
                schemas.PlayerCreate(
                    nickname="fake",
                    name="Fake",
                    age=20,
                    role="Rifler",
                    nationality="EU",
                    kd="1.0",
                    impact=8.0,
                    maps=10,
                    team_id=999999,
                ),
            )
        self.assertEqual(ctx.exception.status_code, 400)

        # 3. Matches with invalid foreign keys
        tourneys = crud.get_tournaments(self.db)
        valid_tourney_id = tourneys[0].id

        # Non-existing Team A
        with self.assertRaises(HTTPException) as ctx:
            crud.create_match(
                self.db,
                schemas.MatchCreate(
                    status="UPCOMING",
                    date="2026-11-01",
                    team_a_id=999999,
                    team_b_id=team.id,
                    tournament_id=valid_tourney_id,
                ),
            )
        self.assertEqual(ctx.exception.status_code, 400)

        # Non-existing Tournament
        with self.assertRaises(HTTPException) as ctx:
            crud.create_match(
                self.db,
                schemas.MatchCreate(
                    status="UPCOMING",
                    date="2026-11-01",
                    team_a_id=teams[0].id,
                    team_b_id=teams[1].id,
                    tournament_id=999999,
                ),
            )
        self.assertEqual(ctx.exception.status_code, 400)

        # Non-existing Bracket ID
        with self.assertRaises(HTTPException) as ctx:
            crud.create_match(
                self.db,
                schemas.MatchCreate(
                    status="UPCOMING",
                    date="2026-11-01",
                    team_a_id=teams[0].id,
                    team_b_id=teams[1].id,
                    tournament_id=valid_tourney_id,
                    bracket_id=999999,
                ),
            )
        self.assertEqual(ctx.exception.status_code, 400)

    def test_bracket_duplicate_teams_and_progression_correction(self):
        tourneys = crud.get_tournaments(self.db)
        tourney_id = tourneys[0].id
        teams = crud.get_teams(self.db)

        # Duplicate team IDs in bracket creation -> 400
        with self.assertRaises(HTTPException) as ctx:
            crud.generate_tournament_bracket(
                self.db,
                tourney_id,
                schemas.BracketCreate(
                    name="Bad Bracket",
                    bracket_type="double_elimination",
                    team_ids=[teams[0].id, teams[0].id, teams[1].id, teams[2].id],
                    match_format="BO3",
                ),
            )
        self.assertEqual(ctx.exception.status_code, 400)

        # Valid bracket generation
        bracket_view = crud.generate_tournament_bracket(
            self.db,
            tourney_id,
            schemas.BracketCreate(
                name="Playoffs Valid",
                bracket_type="double_elimination",
                team_ids=[teams[0].id, teams[1].id, teams[2].id, teams[3].id],
                match_format="BO3",
            ),
        )
        self.assertIsNotNone(bracket_view.grand_final)

        # Locate opening match
        op_match = (
            self.db.query(models.Match)
            .filter(
                models.Match.tournament_id == tourney_id,
                models.Match.round_name == "Opening round",
                models.Match.team_a_id == teams[0].id,
            )
            .first()
        )
        self.assertIsNotNone(op_match)

        # Team 0 wins 2-0
        crud.update_match(
            self.db,
            op_match.id,
            schemas.MatchUpdate(status="FINISHED", score_a=2, score_b=0),
        )
        next_m = self.db.get(models.Match, op_match.next_match_id)
        self.assertIn(teams[0].id, [next_m.team_a_id, next_m.team_b_id])

        # Correction of score: Team B actually won 2-1
        crud.update_match(
            self.db,
            op_match.id,
            schemas.MatchUpdate(status="FINISHED", score_a=1, score_b=2),
        )
        next_m_updated = self.db.get(models.Match, op_match.next_match_id)
        self.assertIn(op_match.team_b_id, [next_m_updated.team_a_id, next_m_updated.team_b_id])
        self.assertNotIn(op_match.team_a_id, [next_m_updated.team_a_id, next_m_updated.team_b_id])

    def test_safe_cascading_deletion(self):
        # Create dedicated tournament with bracket matches
        t = crud.create_tournament(
            self.db,
            schemas.TournamentCreate(
                title="Deletable Major",
                prize_pool="$500,000",
                start_date="2026-11-01",
                end_date="2026-11-15",
                status="Upcoming",
                location="Stockholm",
                bracket_type="single_elimination",
            ),
        )
        teams = crud.get_teams(self.db)
        crud.generate_tournament_bracket(
            self.db,
            t.id,
            schemas.BracketCreate(
                name="SE Bracket",
                bracket_type="single_elimination",
                team_ids=[teams[0].id, teams[1].id, teams[2].id, teams[3].id],
                match_format="BO3",
            ),
        )

        # Delete tournament with interconnected bracket matches -> must succeed without FK error!
        crud.delete_tournament(self.db, t.id)
        with self.assertRaises(HTTPException) as ctx:
            crud.get_tournament_or_404(self.db, t.id)
        self.assertEqual(ctx.exception.status_code, 404)

        # Delete team that has matches and players -> must succeed cleanly!
        crud.delete_team(self.db, teams[0].id)
        with self.assertRaises(HTTPException) as ctx:
            crud.get_team_or_404(self.db, teams[0].id)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_all_bracket_types_generation(self):
        teams = crud.get_teams(self.db)
        team_ids = [t.id for t in teams[:4]]

        for b_type in ["single_elimination", "round_robin", "swiss"]:
            tourney = crud.create_tournament(
                self.db,
                schemas.TournamentCreate(
                    title=f"Test {b_type}",
                    prize_pool="$100k",
                    start_date="2026-12-01",
                    end_date="2026-12-05",
                    status="Upcoming",
                    location="Online",
                    bracket_type=b_type,
                ),
            )
            view = crud.generate_tournament_bracket(
                self.db,
                tourney.id,
                schemas.BracketCreate(
                    name=f"{b_type} stage",
                    bracket_type=b_type,
                    team_ids=team_ids,
                    match_format="BO1",
                ),
            )
            self.assertEqual(view.bracket_type, b_type)
            if b_type == "single_elimination":
                self.assertIsNotNone(view.grand_final)
            elif b_type == "round_robin":
                # 4 teams = 6 round-robin matches
                self.assertEqual(len(view.all_rounds), 6)
            elif b_type == "swiss":
                # 4 teams = 2 opening matches in round 1
                self.assertEqual(len(view.all_rounds), 1)
                self.assertEqual(len(view.all_rounds[0].matches), 2)

    def test_match_unfinish_resets_downstream_slots(self):
        tourneys = crud.get_tournaments(self.db)
        tourney_id = tourneys[0].id
        teams = crud.get_teams(self.db)

        # Find opening match
        op = (
            self.db.query(models.Match)
            .filter(
                models.Match.tournament_id == tourney_id,
                models.Match.round_name == "Opening round",
                models.Match.team_a_id == teams[0].id,
            )
            .first()
        )
        self.assertIsNotNone(op)
        next_m_id = op.next_match_id

        # 1. Finish match
        crud.update_match(
            self.db,
            op.id,
            schemas.MatchUpdate(status="FINISHED", score_a=2, score_b=0),
        )
        next_m = self.db.get(models.Match, next_m_id)
        self.assertEqual(next_m.team_a_id, teams[0].id)

        # 2. Reset match back to UPCOMING
        crud.update_match(
            self.db,
            op.id,
            schemas.MatchUpdate(status="UPCOMING", score_a=None, score_b=None),
        )
        next_m_reset = self.db.get(models.Match, next_m_id)
        self.assertIsNone(next_m_reset.team_a_id)

    def test_leaderboards_and_filters(self):
        # Leaderboards
        team_lb = crud.get_team_leaderboard(self.db)
        self.assertTrue(len(team_lb) >= 4)
        self.assertEqual(team_lb[0].rank, 1)

        player_lb = crud.get_player_leaderboard(self.db, limit=5)
        self.assertTrue(len(player_lb) <= 5)
        self.assertTrue(player_lb[0].rating > 0)

        # Match filters
        tourneys = crud.get_tournaments(self.db)
        t_id = tourneys[0].id
        all_matches = crud.get_matches(self.db, tournament_id=t_id)
        self.assertTrue(len(all_matches) > 0)

        upcoming_matches = crud.get_matches(self.db, status_filter="UPCOMING")
        for m in upcoming_matches:
            self.assertEqual(m.status, "UPCOMING")


if __name__ == "__main__":
    unittest.main()
