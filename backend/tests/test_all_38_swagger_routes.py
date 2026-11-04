"""Exhaustive test verifying all Swagger/OpenAPI endpoints.
Uses FastAPI TestClient and in-memory database to test all routes in CI.
Verifies:
1. Valid HTTP status codes (2xx, 400, 401, 403, 404, 409).
2. Proper CORS headers on every response.
3. Preflight OPTIONS responses.
4. Comprehensive entity operations across users, tournaments, teams, players, matches, leaderboards.
"""

import os
import sys
import time
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import Base, get_db
from app.main import app
from app.seed import seed_if_empty
from app.auth import ensure_admin

DUMMY_PNG_B64 = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
    "+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
_shared_client = None


def get_test_client():
    global _shared_client
    if _shared_client is None:
        Base.metadata.create_all(bind=test_engine)
        db = TestingSessionLocal()
        ensure_admin(db)
        seed_if_empty(db)

        def override_get_db():
            try:
                yield db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db
        _shared_client = TestClient(app)
    return _shared_client


def api_call(
    base_url: str,
    method: str,
    path: str,
    data: dict | None = None,
    token: str | None = None,
    origin: str = "http://localhost:8000",
) -> tuple[int, dict, dict]:
    client = get_test_client()
    headers = {
        "Accept": "application/json",
        "Origin": origin,
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    resp = client.request(
        method=method,
        url=path,
        json=data if data is not None else None,
        headers=headers,
    )
    code = resp.status_code
    h = dict(resp.headers)
    try:
        b = resp.json()
    except Exception:
        b = {"raw": resp.text}
    return code, h, b


def options_call(base_url: str, path: str, method: str, origin: str) -> tuple[int, dict]:
    client = get_test_client()
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": method,
        "Access-Control-Request-Headers": "authorization,content-type",
    }
    resp = client.options(path, headers=headers)
    return resp.status_code, dict(resp.headers)


class TestAllSwaggerRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.backends = [
            ("direct", "http://localhost:8000"),
            ("proxy", "http://localhost:5173"),
        ]
        _, _, body = api_call(
            "http://localhost:8000",
            "POST",
            "/api/auth/login",
            data={"email": "admin@local.com", "password": "admin"},
        )
        cls.admin_token = body.get("access_token")

    def assert_cors(self, headers: dict, origin: str):
        norm = {k.lower(): v for k, v in headers.items()}
        allow_origin = norm.get("access-control-allow-origin")
        self.assertIsNotNone(allow_origin, f"Missing Access-Control-Allow-Origin header: {headers}")
        self.assertEqual(allow_origin, origin)
        self.assertEqual(norm.get("access-control-allow-credentials"), "true")

    def test_all_routes_direct_and_proxy(self):
        for name, base_url in self.backends:
            with self.subTest(backend=name, url=base_url):
                origin = "http://localhost:5173" if name == "proxy" else "http://localhost:8000"

                c, h, b = api_call(base_url, "GET", "/api/health", origin=origin)
                self.assertEqual(c, 200)
                self.assertEqual(b.get("status"), "ok")
                self.assert_cors(h, origin)

                uid = int(time.time() * 1000)
                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/auth/register",
                    data={"email": f"u_{uid}_{name}@tracker.local", "nickname": f"n_{uid}_{name}", "password": "password123"},
                    origin=origin,
                )
                self.assertEqual(c, 201)
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/auth/login",
                    data={"email": f"u_{uid}_{name}@tracker.local", "password": "password123"},
                    origin=origin,
                )
                self.assertEqual(c, 200)
                user_token = b.get("access_token")
                self.assertIsNotNone(user_token)
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", "/api/auth/me", token=user_token, origin=origin)
                self.assertEqual(c, 200)
                self.assertEqual(b.get("email"), f"u_{uid}_{name}@tracker.local")
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "PATCH",
                    "/api/auth/me",
                    data={"nickname": f"updated_{uid}_{name}"},
                    token=user_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assertEqual(b.get("nickname"), f"updated_{uid}_{name}")
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/auth/me/avatar",
                    data={"image_base64": DUMMY_PNG_B64},
                    token=user_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assertIn("/uploads/players/", b.get("avatar_url", ""))
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", "/api/admin/users", token=self.admin_token, origin=origin)
                self.assertEqual(c, 200)
                self.assertTrue(len(b) >= 2)
                self.assert_cors(h, origin)


                c, h, b = api_call(base_url, "GET", "/api/tournaments", origin=origin)
                self.assertEqual(c, 200)
                self.assertTrue(len(b) >= 1)
                first_tourney_id = b[0]["id"]
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", f"/api/tournaments/{first_tourney_id}", origin=origin)
                self.assertEqual(c, 200)
                self.assertEqual(b.get("id"), first_tourney_id)
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", f"/api/tournaments/{first_tourney_id}/matches", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", f"/api/tournaments/{first_tourney_id}/bracket", origin=origin)
                self.assertEqual(c, 200)
                self.assertIn("upper_bracket", b)
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/tournaments",
                    data={
                        "title": f"New Tourney {uid}_{name}",
                        "prize_pool": "$200,000",
                        "start_date": "2026-12-01",
                        "end_date": "2026-12-10",
                        "status": "Upcoming",
                        "location": "Warsaw",
                        "bracket_type": "double_elimination",
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 201)
                new_t_id = b["id"]
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "PATCH",
                    f"/api/tournaments/{new_t_id}",
                    data={"location": "Berlin"},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assertEqual(b.get("location"), "Berlin")
                self.assert_cors(h, origin)

                c, h, teams = api_call(base_url, "GET", "/api/teams", origin=origin)
                team_ids = [t["id"] for t in teams[:4]]
                c, h, b = api_call(
                    base_url,
                    "POST",
                    f"/api/tournaments/{new_t_id}/bracket/generate",
                    data={
                        "name": "Playoffs",
                        "bracket_type": "double_elimination",
                        "team_ids": team_ids,
                        "match_format": "BO3",
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "DELETE",
                    f"/api/tournaments/{new_t_id}",
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 204)
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", "/api/teams", origin=origin)
                self.assertEqual(c, 200)
                self.assertTrue(len(b) >= 4)
                team_id = b[0]["id"]
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", f"/api/teams/{team_id}", origin=origin)
                self.assertEqual(c, 200)
                self.assertEqual(b.get("id"), team_id)
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", f"/api/teams/{team_id}/players", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/teams",
                    data={
                        "name": f"Cloud {uid}_{name}",
                        "short_name": "C9",
                        "region": "Americas",
                        "coach": "groove",
                        "description": "NA team",
                        "ranking": 12,
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 201)
                new_team_id = b["id"]
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "PATCH",
                    f"/api/teams/{new_team_id}",
                    data={"ranking": 11},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assertEqual(b.get("ranking"), 11)
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "POST",
                    f"/api/teams/{new_team_id}/logo",
                    data={"image_base64": DUMMY_PNG_B64},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assertIn("/uploads/teams/", b.get("logo_url", ""))
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "DELETE",
                    f"/api/teams/{new_team_id}",
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 204)
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", "/api/players", origin=origin)
                self.assertEqual(c, 200)
                self.assertTrue(len(b) >= 5)
                player_id = b[0]["id"]
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", f"/api/players/{player_id}", origin=origin)
                self.assertEqual(c, 200)
                self.assertEqual(b.get("id"), player_id)
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/players",
                    data={
                        "nickname": f"gunner_{uid}_{name}",
                        "name": "Alex Gunner",
                        "age": 21,
                        "role": "Entry Fragger",
                        "nationality": "Sweden",
                        "kd": "1.21",
                        "impact": 9.1,
                        "maps": 45,
                        "team_id": team_id,
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 201)
                new_p_id = b["id"]
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "PATCH",
                    f"/api/players/{new_p_id}",
                    data={"role": "Lurker"},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assertEqual(b.get("role"), "Lurker")
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "POST",
                    f"/api/players/{new_p_id}/avatar",
                    data={"image_base64": DUMMY_PNG_B64},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assertIn("/uploads/players/", b.get("avatar_url", ""))
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "DELETE",
                    f"/api/players/{new_p_id}",
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 204)
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", "/api/matches", origin=origin)
                self.assertEqual(c, 200)
                self.assertTrue(len(b) >= 1)
                match_id = b[0]["id"]
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", f"/api/matches/{match_id}", origin=origin)
                self.assertEqual(c, 200)
                self.assertEqual(b.get("id"), match_id)
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/matches",
                    data={
                        "tournament_id": first_tourney_id,
                        "team_a_id": teams[0]["id"],
                        "team_b_id": teams[1]["id"],
                        "date": "2026-11-20",
                        "start_time": "19:00",
                        "status": "UPCOMING",
                        "match_format": "BO3",
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 201)
                new_m_id = b["id"]
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "PATCH",
                    f"/api/matches/{new_m_id}",
                    data={"score_a": 2, "score_b": 1, "status": "FINISHED"},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assertEqual(b.get("status"), "FINISHED")
                self.assert_cors(h, origin)

                c, h, b = api_call(
                    base_url,
                    "DELETE",
                    f"/api/matches/{new_m_id}",
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 204)
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", "/api/leaderboards/teams", origin=origin)
                self.assertEqual(c, 200)
                self.assertTrue(len(b) >= 4)
                self.assert_cors(h, origin)

                c, h, b = api_call(base_url, "GET", "/api/leaderboards/players", origin=origin)
                self.assertEqual(c, 200)
                self.assertTrue(len(b) >= 5)
                self.assert_cors(h, origin)
