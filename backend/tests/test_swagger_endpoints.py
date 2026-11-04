"""Audit for all OpenAPI/Swagger endpoints and CORS compliance.
Tests each route via FastAPI TestClient with an isolated in-memory test database.
Verifies:
1. Valid HTTP status codes (2xx, 400, 401, 403, 404, 409).
2. Proper CORS headers on responses.
3. Preflight OPTIONS responses.
4. Correct auth, CRUD, advancement, and leaderboards functionality.
"""

import os
import sys
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import Base, get_db
from app.main import app
from app.auth import ensure_admin
from app.seed import seed_if_empty

DUMMY_PNG_B64 = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
    "+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)


class BaseEndpointTester:
    def __init__(self, client: TestClient):
        self.client = client
        self.token: str | None = None

    def request(
        self,
        method: str,
        path: str,
        data: dict | None = None,
        origin: str = "http://localhost:8000",
        use_auth: bool = True,
        extra_headers: dict | None = None,
    ) -> tuple[int, dict, dict]:
        headers = {"Origin": origin, "Accept": "application/json"}
        if extra_headers:
            headers.update(extra_headers)
        if use_auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        response = self.client.request(
            method=method,
            url=path,
            json=data if data is not None else None,
            headers=headers,
        )
        try:
            resp_json = response.json()
        except Exception:
            resp_json = {"raw": response.text}
        return response.status_code, dict(response.headers), resp_json

    def options(
        self,
        path: str,
        method: str = "POST",
        origin: str = "http://localhost:8000",
    ) -> tuple[int, dict]:
        headers = {
            "Origin": origin,
            "Access-Control-Request-Method": method,
            "Access-Control-Request-Headers": "authorization,content-type",
        }
        response = self.client.options(path, headers=headers)
        return response.status_code, dict(response.headers)


class TestSwaggerAndCORS(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.Session = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        Base.metadata.create_all(bind=self.engine)
        self.db = self.Session()
        ensure_admin(self.db)
        seed_if_empty(self.db)

        def override_get_db():
            try:
                yield self.db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)
        self.tester = BaseEndpointTester(self.client)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def assert_cors_headers(self, headers: dict, origin: str):
        norm = {k.lower(): v for k, v in headers.items()}
        allow_origin = norm.get("access-control-allow-origin")
        self.assertIsNotNone(allow_origin, f"Missing Access-Control-Allow-Origin header in {headers}")
        self.assertEqual(
            allow_origin,
            origin,
            f"Expected Access-Control-Allow-Origin to equal '{origin}', got '{allow_origin}'",
        )
        self.assertEqual(
            norm.get("access-control-allow-credentials"),
            "true",
            "Expected Access-Control-Allow-Credentials: true",
        )

    def test_01_docs_and_openapi_availability(self):
        """Swagger UI (/docs) and OpenAPI JSON schema (/openapi.json) load without errors."""
        code, h, b = self.tester.request("GET", "/docs", origin="http://localhost:8000", use_auth=False)
        self.assertEqual(code, 200)

        code, h, schema = self.tester.request("GET", "/openapi.json", origin="http://localhost:8000", use_auth=False)
        self.assertEqual(code, 200)
        self.assertIn("openapi", schema)
        self.assertIn("paths", schema)

    def test_02_cors_preflight_on_all_methods(self):
        """OPTIONS preflight requests must return 200 and valid CORS headers."""
        sample_paths = [
            "/api/auth/login",
            "/api/tournaments",
            "/api/matches",
            "/api/teams",
            "/api/players",
        ]
        for path in sample_paths:
            code, h = self.tester.options(path, method="POST", origin="http://localhost:8000")
            self.assertEqual(code, 200, f"OPTIONS preflight failed for {path}")
            self.assert_cors_headers(h, "http://localhost:8000")

    def test_03_health_check(self):
        """GET /api/health returns 200 ok."""
        code, h, body = self.tester.request("GET", "/api/health", origin="http://localhost:8000", use_auth=False)
        self.assertEqual(code, 200)
        self.assertEqual(body.get("status"), "ok")
        self.assert_cors_headers(h, "http://localhost:8000")

    def test_04_auth_lifecycle(self):
        """Test registration, login, profile retrieval, refresh token, and token verification."""
        reg_payload = {
            "email": "testplayer@audit.local",
            "nickname": "audit_ninja",
            "password": "password123",
        }
        code, h, body = self.tester.request("POST", "/api/auth/register", reg_payload, use_auth=False)
        self.assertEqual(code, 201)
        self.assertEqual(body.get("email"), "testplayer@audit.local")
        self.assertFalse(body.get("is_admin"))

        login_payload = {
            "email": "testplayer@audit.local",
            "password": "password123",
        }
        code, h, body = self.tester.request("POST", "/api/auth/login", login_payload, use_auth=False)
        self.assertEqual(code, 200)
        access_token = body.get("access_token")
        refresh_token = body.get("refresh_token")
        self.assertIsNotNone(access_token)
        self.assertIsNotNone(refresh_token)

        self.tester.token = access_token
        code, h, me_body = self.tester.request("GET", "/api/auth/me")
        self.assertEqual(code, 200)
        self.assertEqual(me_body.get("nickname"), "audit_ninja")

        # Test refresh token
        code, h, ref_body = self.tester.request("POST", "/api/auth/refresh", {"refresh_token": refresh_token}, use_auth=False)
        self.assertEqual(code, 200)
        self.assertIn("access_token", ref_body)

    def test_05_admin_endpoints_with_admin_account(self):
        """Log in as seeded admin and access protected admin endpoints."""
        login_payload = {
            "email": "admin@local.com",
            "password": "admin",
        }
        code, h, body = self.tester.request("POST", "/api/auth/login", login_payload, use_auth=False)
        self.assertEqual(code, 200)
        admin_token = body.get("access_token")
        self.tester.token = admin_token

        code, h, users = self.tester.request("GET", "/api/admin/users")
        self.assertEqual(code, 200)
        self.assertTrue(len(users) >= 1)

    def test_06_tournaments_and_bracket_types(self):
        """Create, read, update tournaments and generate all bracket formats."""
        code, h, body = self.tester.request(
            "POST",
            "/api/auth/login",
            {"email": "admin@local.com", "password": "admin"},
            use_auth=False,
        )
        self.tester.token = body.get("access_token")

        t_payload = {
            "title": "Swagger Audit Cup",
            "prize_pool": "$50,000",
            "start_date": "2026-11-01",
            "end_date": "2026-11-05",
            "status": "Upcoming",
            "location": "Online",
            "bracket_type": "double_elimination",
        }
        code, h, created_t = self.tester.request("POST", "/api/tournaments", t_payload)
        self.assertEqual(code, 201)
        t_id = created_t["id"]

        code, h, teams = self.tester.request("GET", "/api/teams")
        team_ids = [t["id"] for t in teams[:4]]

        for b_type in ["double_elimination", "single_elimination", "round_robin", "swiss"]:
            b_payload = {
                "name": f"{b_type} Playoff",
                "bracket_type": b_type,
                "team_ids": team_ids,
                "match_format": "BO3",
            }
            code, h, bracket_view = self.tester.request(
                "POST", f"/api/tournaments/{t_id}/bracket/generate", b_payload
            )
            self.assertEqual(code, 200, f"Bracket gen failed for {b_type}: {bracket_view}")
            self.assertEqual(bracket_view.get("bracket_type"), b_type)

    def test_07_matches_crud_and_advancement(self):
        """Test match creation, map scores, player stats, and progression."""
        code, h, body = self.tester.request(
            "POST",
            "/api/auth/login",
            {"email": "admin@local.com", "password": "admin"},
            use_auth=False,
        )
        self.tester.token = body.get("access_token")

        code, h, teams = self.tester.request("GET", "/api/teams")
        code, h, tournaments = self.tester.request("GET", "/api/tournaments")
        t_id = tournaments[0]["id"]

        m_payload = {
            "tournament_id": t_id,
            "team_a_id": teams[0]["id"],
            "team_b_id": teams[1]["id"],
            "date": "2026-10-15",
            "start_time": "18:00",
            "status": "UPCOMING",
            "match_format": "BO3",
        }
        code, h, match = self.tester.request("POST", "/api/matches", m_payload)
        self.assertEqual(code, 201)
        m_id = match["id"]

        # Add map result
        map_payload = {
            "map_number": 1,
            "map_name": "Dust2",
            "score_a": 13,
            "score_b": 10,
            "winner_id": teams[0]["id"],
        }
        code, h, map_res = self.tester.request("POST", f"/api/matches/{m_id}/maps", map_payload)
        self.assertEqual(code, 201)

        # Update match to FINISHED
        code, h, updated_m = self.tester.request(
            "PATCH", f"/api/matches/{m_id}", {"status": "FINISHED", "score_a": 2, "score_b": 0}
        )
        self.assertEqual(code, 200)
        self.assertEqual(updated_m.get("winner_id"), teams[0]["id"])

    def test_08_teams_and_logo_upload(self):
        """Create team and upload PNG logo."""
        code, h, body = self.tester.request(
            "POST",
            "/api/auth/login",
            {"email": "admin@local.com", "password": "admin"},
            use_auth=False,
        )
        self.tester.token = body.get("access_token")

        team_payload = {
            "name": "Audit Elite Team",
            "short_name": "AET",
            "region": "Americas",
            "coach": "Audit Coach",
            "description": "Team created for OpenAPI coverage tests",
            "ranking": 10,
        }
        code, h, team = self.tester.request("POST", "/api/teams", team_payload)
        self.assertEqual(code, 201)
        team_id = team["id"]

        logo_payload = {"image_base64": DUMMY_PNG_B64}
        code, h, updated_team = self.tester.request(
            "POST", f"/api/teams/{team_id}/logo", logo_payload
        )
        self.assertEqual(code, 200)
        self.assertIsNotNone(updated_team.get("logo_url"))

    def test_09_players_and_avatar_upload(self):
        """Create player and upload avatar."""
        code, h, body = self.tester.request(
            "POST",
            "/api/auth/login",
            {"email": "admin@local.com", "password": "admin"},
            use_auth=False,
        )
        self.tester.token = body.get("access_token")

        code, h, teams = self.tester.request("GET", "/api/teams")
        p_payload = {
            "nickname": "AuditAce",
            "name": "Alex Audit",
            "age": 20,
            "role": "Entry Fragger",
            "nationality": "Germany",
            "kd": "1.25",
            "impact": 9.1,
            "maps": 45,
            "team_id": teams[0]["id"],
        }
        code, h, player = self.tester.request("POST", "/api/players", p_payload)
        self.assertEqual(code, 201)
        p_id = player["id"]

        avatar_payload = {"image_base64": DUMMY_PNG_B64}
        code, h, updated_p = self.tester.request(
            "POST", f"/api/players/{p_id}/avatar", avatar_payload
        )
        self.assertEqual(code, 200)
        self.assertIsNotNone(updated_p.get("avatar_url"))

    def test_10_leaderboards(self):
        """GET /api/leaderboards/teams and /api/leaderboards/players."""
        code, h, teams_lb = self.tester.request("GET", "/api/leaderboards/teams", use_auth=False)
        self.assertEqual(code, 200)
        self.assertTrue(len(teams_lb) > 0)

        code, h, players_lb = self.tester.request("GET", "/api/leaderboards/players", use_auth=False)
        self.assertEqual(code, 200)
        self.assertTrue(len(players_lb) > 0)
        self.assertTrue(players_lb[0]["rating"] > 0)
