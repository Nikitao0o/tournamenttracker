import unittest
import os
import sys

# Добавляем backend в sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi import HTTPException
from pydantic import ValidationError

from app import models, schemas, crud
from app.seed import seed_if_empty


class TestTournamentTrackerCRUD(unittest.TestCase):
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

    def test_seed_data_loaded(self):
        teams = crud.get_teams(self.db)
        self.assertEqual(len(teams), 4)

        players = crud.get_players(self.db)
        self.assertEqual(len(players), 11)

        tournaments = crud.get_tournaments(self.db)
        self.assertEqual(len(tournaments), 4)

        matches = crud.get_matches(self.db)
        self.assertEqual(len(matches), 3)

    def test_create_and_delete_team(self):
        new_team = crud.create_team(
            self.db,
            schemas.TeamCreate(
                name="Cloud9",
                short_name="C9",
                region="Americas",
                coach="groove",
                description="North American powerhouse",
                ranking=5,
            ),
        )
        self.assertIsNotNone(new_team.id)
        self.assertEqual(new_team.name, "Cloud9")

        # Conflict on duplicate name
        with self.assertRaises(HTTPException) as ctx:
            crud.create_team(
                self.db,
                schemas.TeamCreate(
                    name="Cloud9",
                    short_name="C9-2",
                    region="Americas",
                    coach="groove",
                    description="Another C9",
                    ranking=6,
                ),
            )
        self.assertEqual(ctx.exception.status_code, 409)

        # Delete team
        crud.delete_team(self.db, new_team.id)
        with self.assertRaises(HTTPException) as ctx:
            crud.get_team_or_404(self.db, new_team.id)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_player_foreign_key_validation(self):
        # Invalid team_id
        with self.assertRaises(HTTPException) as ctx:
            crud.create_player(
                self.db,
                schemas.PlayerCreate(
                    nickname="nobody",
                    name="No Name",
                    age=20,
                    role="Rifler",
                    nationality="Unknown",
                    kd="1.0",
                    impact=8.0,
                    maps=10,
                    team_id=99999,
                ),
            )
        self.assertEqual(ctx.exception.status_code, 400)

    def test_match_distinct_teams_validation(self):
        teams = crud.get_teams(self.db)
        tournaments = crud.get_tournaments(self.db)

        # 1. Pydantic validator rejects team_a == team_b
        with self.assertRaises(ValidationError):
            schemas.MatchCreate(
                status="UPCOMING",
                date="2026-11-01",
                team_a_id=teams[0].id,
                team_b_id=teams[0].id,
                tournament_id=tournaments[0].id,
            )

        # 2. Non-existent tournament -> HTTPException 400
        valid_schema = schemas.MatchCreate(
            status="UPCOMING",
            date="2026-11-01",
            team_a_id=teams[0].id,
            team_b_id=teams[1].id,
            tournament_id=99999,
        )
        with self.assertRaises(HTTPException) as ctx:
            crud.create_match(self.db, valid_schema)
        self.assertEqual(ctx.exception.status_code, 400)

    def test_leaderboards(self):
        team_lb = crud.get_team_leaderboard(self.db)
        self.assertTrue(len(team_lb) >= 4)
        self.assertEqual(team_lb[0].rank, 1)

        player_lb = crud.get_player_leaderboard(self.db, limit=5)
        self.assertEqual(len(player_lb), 5)
        self.assertTrue(player_lb[0].rating >= player_lb[1].rating)


if __name__ == "__main__":
    unittest.main()
