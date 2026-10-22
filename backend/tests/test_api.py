import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from fastapi.testclient import TestClient
    HAS_TESTCLIENT = True
except (ImportError, RuntimeError):
    HAS_TESTCLIENT = False
    TestClient = None
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.seed import seed_if_empty


class TestApiEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.Session = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        if not HAS_TESTCLIENT:
            self.skipTest("httpx is not installed in the local environment (available inside Docker container).")
        Base.metadata.create_all(bind=self.engine)
        self.db = self.Session()
        seed_if_empty(self.db)

        def override_get_db():
            try:
                yield self.db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")

    def test_auth_and_permissions(self):
        # 1. Register regular user
        reg_res = self.client.post(
            "/api/auth/register",
            json={"email": "newuser@test.local", "nickname": "new_player", "password": "password123"},
        )
        self.assertEqual(reg_res.status_code, 201)

        # 2. Login as regular user
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "newuser@test.local", "password": "password123"},
        )
        self.assertEqual(login_res.status_code, 200)
        token = login_res.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {token}"}

        # 3. Regular user views profile and updates nickname
        me_res = self.client.get("/api/auth/me", headers=user_headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertFalse(me_res.json()["is_admin"])

        up_res = self.client.patch("/api/auth/me", headers=user_headers, json={"nickname": "updated_nick"})
        self.assertEqual(up_res.status_code, 200)
        self.assertEqual(up_res.json()["nickname"], "updated_nick")

        # 4. Regular user attempts to create tournament -> 403 Forbidden
        tourney_payload = {
            "title": "Unauthorized Major",
            "prize_pool": "$100",
            "start_date": "2026-12-01",
            "end_date": "2026-12-10",
            "status": "Upcoming",
            "location": "Berlin",
            "bracket_type": "double_elimination",
        }
        forbidden_res = self.client.post("/api/tournaments", headers=user_headers, json=tourney_payload)
        self.assertEqual(forbidden_res.status_code, 403)

        # 5. Admin login (admin@tracker.local from admins.txt)
        self.client.post(
            "/api/auth/register",
            json={"email": "admin@tracker.local", "nickname": "admin", "password": "password123"},
        )
        admin_login = self.client.post(
            "/api/auth/login",
            json={"email": "admin@tracker.local", "password": "password123"},
        )
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 6. Admin creates tournament successfully
        create_tourney = self.client.post("/api/tournaments", headers=admin_headers, json=tourney_payload)
        self.assertEqual(create_tourney.status_code, 201)

        # 7. Admin creates team and player WITHOUT account
        team_res = self.client.post(
            "/api/teams",
            headers=admin_headers,
            json={
                "name": "Admin Team",
                "short_name": "AT",
                "region": "EU",
                "coach": "C",
                "description": "D",
                "ranking": 1,
            },
        )
        self.assertEqual(team_res.status_code, 201)
        team_id = team_res.json()["id"]

        player_res = self.client.post(
            "/api/admin/players",
            headers=admin_headers,
            json={
                "nickname": "free_agent",
                "name": "Ivan Ivanov",
                "age": 20,
                "role": "AWPer",
                "nationality": "Russian",
                "kd": "1.20",
                "impact": 9.0,
                "maps": 30,
                "team_id": team_id,
                "user_id": None,
            },
        )
        self.assertEqual(player_res.status_code, 201)
        player_id = player_res.json()["id"]
        self.assertIsNone(player_res.json()["user_email"])

        # 8. Admin claims registered user for player profile
        regular_user_id = me_res.json()["id"]
        claim_res = self.client.post(
            "/api/admin/players/claim",
            headers=admin_headers,
            json={"player_id": player_id, "user_id": regular_user_id},
        )
        self.assertEqual(claim_res.status_code, 200)
        self.assertEqual(claim_res.json()["user_email"], "newuser@test.local")

    def test_bracket_endpoint(self):
        tournaments = self.client.get("/api/tournaments").json()
        if tournaments:
            t_id = tournaments[0]["id"]
            res = self.client.get(f"/api/tournaments/{t_id}/bracket")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("upper_bracket", data)
            self.assertIn("lower_bracket", data)
            self.assertIn("grand_final", data)


if __name__ == "__main__":
    unittest.main()
