import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi import HTTPException
from pydantic import ValidationError

from app import models, schemas, crud, auth
from app.auth import is_user_admin
from app.seed import seed_if_empty


class TestTournamentTrackerFull(unittest.TestCase):
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
        auth.ensure_admin(self.db)
        seed_if_empty(self.db)

    def tearDown(self):
        self.db.close()
        models.Base.metadata.drop_all(bind=self.engine)

    def test_users_and_admin_file(self):
        admin = crud.get_user_by_email(self.db, "admin@local.com")
        self.assertIsNotNone(admin)
        self.assertTrue(is_user_admin(admin))

        regular_out = crud.create_user(
            self.db,
            schemas.UserRegister(email="regular@example.com", nickname="regular_guy", password="securePass123"),
        )
        regular = self.db.get(models.User, regular_out.id)
        self.assertIsNotNone(regular)
        self.assertFalse(is_user_admin(regular))

        updated = crud.update_user_self(
            self.db,
            regular,
            schemas.UserUpdate(nickname="new_alex_nick"),
        )
        self.assertEqual(updated.nickname, "new_alex_nick")

    def test_admin_create_player_with_and_without_account(self):
        teams = crud.get_teams(self.db)
        team_id = teams[0].id

        player_no_acc = crud.create_player(
            self.db,
            schemas.PlayerCreate(
                nickname="m0NESY",
                name="Ilya Osipov",
                age=19,
                role="AWPer",
                nationality="Russian",
                kd="1.25",
                impact=9.2,
                maps=50,
                team_id=team_id,
                user_id=None,
            ),
        )
        self.assertIsNotNone(player_no_acc.id)
        self.assertIsNone(player_no_acc.user_id)

        new_user = crud.create_user(
            self.db,
            schemas.UserRegister(
                email="pro_sniper@example.org",
                nickname="sniper_god",
                password="securePass123",
            ),
        )

        claimed = crud.claim_player_for_user(self.db, player_no_acc.id, new_user.id)
        self.assertEqual(claimed.user_email, "pro_sniper@example.org")

    def test_double_elimination_bracket_and_progression(self):
        tournament = crud.get_tournaments(self.db)[0]
        teams = crud.get_teams(self.db)
        team_ids = [t.id for t in teams[:4]]

        bracket_view = crud.generate_tournament_bracket(
            self.db,
            tournament.id,
            schemas.BracketCreate(
                name="Playoffs DE",
                bracket_type="double_elimination",
                team_ids=team_ids,
                match_format="BO3",
            ),
        )
        self.assertEqual(bracket_view.bracket_type, "double_elimination")
        self.assertTrue(len(bracket_view.upper_bracket) > 0)
        self.assertIsNotNone(bracket_view.grand_final)

        opening_match = (
            self.db.query(models.Match)
            .filter(
                models.Match.tournament_id == tournament.id,
                models.Match.round_name == "Opening round",
                models.Match.team_a_id == team_ids[0],
            )
            .first()
        )
        self.assertIsNotNone(opening_match)
        self.assertIsNotNone(opening_match.next_match_id)
        self.assertIsNotNone(opening_match.next_loser_match_id)

        winner_id = opening_match.team_a_id
        loser_id = opening_match.team_b_id

        crud.update_match(
            self.db,
            opening_match.id,
            schemas.MatchUpdate(status="FINISHED", score_a=2, score_b=0),
        )

        upper_final = self.db.get(models.Match, opening_match.next_match_id)
        self.assertIn(winner_id, [upper_final.team_a_id, upper_final.team_b_id])

        lower_final = self.db.get(models.Match, opening_match.next_loser_match_id)
        self.assertIn(loser_id, [lower_final.team_a_id, lower_final.team_b_id])

    def test_other_bracket_types(self):
        tournaments = crud.get_tournaments(self.db)
        teams = crud.get_teams(self.db)
        team_ids = [t.id for t in teams[:4]]

        se_view = crud.generate_tournament_bracket(
            self.db,
            tournaments[1].id,
            schemas.BracketCreate(
                name="Playoffs SE",
                bracket_type="single_elimination",
                team_ids=team_ids,
                match_format="BO3",
            ),
        )
        self.assertEqual(se_view.bracket_type, "single_elimination")
        se_matches = self.db.query(models.Match).filter(models.Match.tournament_id == tournaments[1].id).all()
        self.assertTrue(len(se_matches) >= 3)

        rr_view = crud.generate_tournament_bracket(
            self.db,
            tournaments[2].id,
            schemas.BracketCreate(
                name="Group Stage RR",
                bracket_type="round_robin",
                team_ids=team_ids,
                match_format="BO1",
            ),
        )
        self.assertEqual(rr_view.bracket_type, "round_robin")
        rr_matches = self.db.query(models.Match).filter(models.Match.tournament_id == tournaments[2].id).all()
        self.assertEqual(len(rr_matches), 6)


if __name__ == "__main__":
    unittest.main()
