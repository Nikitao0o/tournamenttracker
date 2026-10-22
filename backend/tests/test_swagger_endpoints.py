"""End-to-end audit for all OpenAPI/Swagger endpoints and CORS compliance.
Ensures every route responds with valid status codes and proper CORS headers
for both direct backend access (port 8000) and frontend reverse proxy (port 5173).
"""

import base64
import sys
import unittest
import urllib.error
import urllib.parse
import urllib.request
import json

# Tiny 1x1 transparent PNG for logo and avatar upload tests
DUMMY_PNG_B64 = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
    "+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)


class BaseEndpointTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
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
        url = f"{self.base_url}{path}"
        headers = {
            "Accept": "application/json",
            "Origin": origin,
        }
        if extra_headers:
            headers.update(extra_headers)

        body_bytes = None
        if data is not None:
            body_bytes = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"

        if use_auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        req = urllib.request.Request(url, data=body_bytes, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                status_code = resp.status
                resp_headers = dict(resp.headers)
                raw_body = resp.read().decode("utf-8")
                try:
                    resp_json = json.loads(raw_body) if raw_body else {}
                except Exception:
                    resp_json = {"raw": raw_body}
                return status_code, resp_headers, resp_json
        except urllib.error.HTTPError as e:
            status_code = e.code
            resp_headers = dict(e.headers)
            raw_body = e.read().decode("utf-8")
            try:
                resp_json = json.loads(raw_body) if raw_body else {}
            except Exception:
                resp_json = {"raw": raw_body}
            return status_code, resp_headers, resp_json

    def options(
        self,
        path: str,
        method: str = "POST",
        origin: str = "http://localhost:8000",
    ) -> tuple[int, dict]:
        url = f"{self.base_url}{path}"
        headers = {
            "Origin": origin,
            "Access-Control-Request-Method": method,
            "Access-Control-Request-Headers": "authorization,content-type",
        }
        req = urllib.request.Request(url, headers=headers, method="OPTIONS")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status, dict(resp.headers)
        except urllib.error.HTTPError as e:
            return e.code, dict(e.headers)


class TestSwaggerAndCORS(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.backend_url = "http://localhost:8000"
        cls.proxy_url = "http://localhost:5173"
        cls.tester = BaseEndpointTester(cls.backend_url)

    def assert_cors_headers(self, headers: dict, origin: str):
        # Case-insensitive header keys
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
        """Swagger UI (/docs) and OpenAPI JSON schema (/openapi.json) must load without errors."""
        for base in [self.backend_url, self.proxy_url]:
            t = BaseEndpointTester(base)
            code, h, b = t.request("GET", "/docs", origin=base, use_auth=False)
            self.assertEqual(code, 200, f"/docs failed on {base}")

            code, h, schema = t.request("GET", "/openapi.json", origin=base, use_auth=False)
            self.assertEqual(code, 200, f"/openapi.json failed on {base}")
            self.assertIn("paths", schema, "OpenAPI schema must contain 'paths'")

    def test_02_cors_preflight_on_all_methods(self):
        """OPTIONS preflight must return 200 OK with proper headers for Swagger requests."""
        endpoints_to_check = [
            ("POST", "/api/auth/login"),
            ("POST", "/api/auth/register"),
            ("GET", "/api/auth/me"),
            ("PATCH", "/api/auth/me"),
            ("POST", "/api/auth/me/avatar"),
            ("GET", "/api/admin/users"),
            ("POST", "/api/admin/players"),
            ("GET", "/api/tournaments"),
            ("POST", "/api/tournaments"),
            ("GET", "/api/matches"),
            ("POST", "/api/matches"),
            ("GET", "/api/teams"),
            ("POST", "/api/teams"),
            ("GET", "/api/players"),
            ("POST", "/api/players"),
            ("GET", "/api/leaderboards/teams"),
            ("GET", "/api/leaderboards/players"),
            ("GET", "/api/health"),
        ]
        for method, path in endpoints_to_check:
            for origin in ["http://localhost:8000", "http://localhost:5173"]:
                code, headers = self.tester.options(path, method=method, origin=origin)
                self.assertEqual(code, 200, f"OPTIONS preflight failed for {method} {path} from {origin}")
                self.assert_cors_headers(headers, origin)

    def test_03_health_check(self):
        """GET /api/health returns 200 and status ok."""
        code, h, body = self.tester.request("GET", "/api/health")
        self.assertEqual(code, 200)
        self.assertEqual(body.get("status"), "ok")
        self.assert_cors_headers(h, "http://localhost:8000")

    def test_04_auth_lifecycle(self):
        """Register, login, me, and avatar upload endpoints."""
        origin = "http://localhost:8000"
        import time
        suffix = int(time.time() * 1000)
        user_email = f"testuser_{suffix}@tracker.local"
        user_nick = f"test_{suffix}"

        # 1. Register
        code, h, body = self.tester.request(
            "POST",
            "/api/auth/register",
            data={"email": user_email, "nickname": user_nick, "password": "password123"},
            origin=origin,
            use_auth=False,
        )
        self.assertIn(code, [201, 409], f"Register failed: {body}")
        self.assert_cors_headers(h, origin)

        # 2. Login
        code, h, body = self.tester.request(
            "POST",
            "/api/auth/login",
            data={"email": user_email, "password": "password123"},
            origin=origin,
            use_auth=False,
        )
        self.assertEqual(code, 200, f"Login failed: {body}")
        self.assertIn("access_token", body)
        self.assert_cors_headers(h, origin)
        user_token = body["access_token"]

        # 3. /me with token
        user_tester = BaseEndpointTester(self.backend_url)
        user_tester.token = user_token
        code, h, body = user_tester.request("GET", "/api/auth/me", origin=origin)
        self.assertEqual(code, 200)
        self.assertEqual(body.get("email"), user_email)
        self.assert_cors_headers(h, origin)

        # 4. /me PATCH
        code, h, body = user_tester.request("PATCH", "/api/auth/me", data={"nickname": f"{user_nick}_upd"}, origin=origin)
        self.assertEqual(code, 200)
        self.assertEqual(body.get("nickname"), f"{user_nick}_upd")
        self.assert_cors_headers(h, origin)

        # 5. /me/avatar upload
        code, h, body = user_tester.request(
            "POST",
            "/api/auth/me/avatar",
            data={"image_base64": DUMMY_PNG_B64},
            origin=origin,
        )
        self.assertEqual(code, 200)
        self.assertTrue(body.get("avatar_url", "").startswith("/uploads/players/"))
        self.assert_cors_headers(h, origin)

    def test_05_admin_endpoints_with_admin_account(self):
        """Admin accounts from admins.txt must have access to /api/admin/*."""
        origin = "http://localhost:8000"
        # Login as pre-seeded admin
        code, h, body = self.tester.request(
            "POST",
            "/api/auth/login",
            data={"email": "admin@tracker.local", "password": "password123"},
            origin=origin,
            use_auth=False,
        )
        self.assertEqual(code, 200, f"Admin login failed: {body}")
        admin_token = body["access_token"]
        self.assertTrue(body["user"]["is_admin"], "admin@tracker.local must be admin")

        admin_tester = BaseEndpointTester(self.backend_url)
        admin_tester.token = admin_token

        # GET /api/admin/users
        code, h, users = admin_tester.request("GET", "/api/admin/users", origin=origin)
        self.assertEqual(code, 200)
        self.assertIsInstance(users, list)
        self.assert_cors_headers(h, origin)

        # GET /api/admin/admins-list
        code, h, admins = admin_tester.request("GET", "/api/admin/admins-list", origin=origin)
        self.assertEqual(code, 200)
        self.assertIn("admins", admins)
        self.assert_cors_headers(h, origin)

        # POST /api/admin/players (Admin creates player without account)
        import time
        p_nick = f"solo_{int(time.time() * 1000)}"
        code, h, player = admin_tester.request(
            "POST",
            "/api/admin/players",
            data={
                "nickname": p_nick,
                "name": "Solo Player",
                "age": 21,
                "role": "Rifler",
                "nationality": "Germany",
                "kd": "1.15",
                "impact": 1.2,
                "maps": 45,
                "team_id": 1,
                "user_id": None,
            },
            origin=origin,
        )
        self.assertEqual(code, 201)
        self.assert_cors_headers(h, origin)

    def test_06_tournaments_and_bracket_types(self):
        """CRUD for tournaments and generation of all 4 bracket types."""
        origin = "http://localhost:8000"
        # Login as admin
        code, _, login_body = self.tester.request(
            "POST",
            "/api/auth/login",
            data={"email": "admin@tracker.local", "password": "password123"},
            origin=origin,
            use_auth=False,
        )
        admin_tester = BaseEndpointTester(self.backend_url)
        admin_tester.token = login_body["access_token"]

        # GET /api/tournaments (public)
        code, h, tourneys = self.tester.request("GET", "/api/tournaments", origin=origin, use_auth=False)
        self.assertEqual(code, 200)
        self.assertIsInstance(tourneys, list)
        self.assert_cors_headers(h, origin)

        # POST /api/tournaments
        import time
        t_title = f"Championship_{int(time.time() * 1000)}"
        code, h, new_t = admin_tester.request(
            "POST",
            "/api/tournaments",
            data={
                "title": t_title,
                "prize_pool": "$500,000",
                "start_date": "2026-11-01",
                "end_date": "2026-11-10",
                "status": "Upcoming",
                "location": "Berlin, Germany",
                "bracket_type": "double_elimination",
            },
            origin=origin,
        )
        self.assertEqual(code, 201)
        t_id = new_t["id"]
        self.assert_cors_headers(h, origin)

        # GET /api/tournaments/{id}
        code, h, t_get = self.tester.request("GET", f"/api/tournaments/{t_id}", origin=origin, use_auth=False)
        self.assertEqual(code, 200)
        self.assertEqual(t_get["title"], t_title)

        # Test bracket generation for each of the 4 supported types
        bracket_types = ["single_elimination", "double_elimination", "round_robin", "swiss"]
        for b_type in bracket_types:
            code, h, b_view = admin_tester.request(
                "POST",
                f"/api/tournaments/{t_id}/bracket/generate",
                data={
                    "name": f"Stage {b_type}",
                    "bracket_type": b_type,
                    "team_ids": [1, 2, 3, 4],
                    "match_format": "BO3",
                },
                origin=origin,
            )
            self.assertEqual(code, 200, f"Bracket generation failed for {b_type}: {b_view}")
            self.assert_cors_headers(h, origin)

        # GET /api/tournaments/{id}/bracket
        code, h, b_view = self.tester.request("GET", f"/api/tournaments/{t_id}/bracket", origin=origin, use_auth=False)
        self.assertEqual(code, 200)
        self.assert_cors_headers(h, origin)

        # DELETE /api/tournaments/{id}
        code, h, _ = admin_tester.request("DELETE", f"/api/tournaments/{t_id}", origin=origin)
        self.assertEqual(code, 204)
        self.assert_cors_headers(h, origin)

    def test_07_matches_crud_and_advancement(self):
        """Matches listing, creation, score updating, and deletion."""
        origin = "http://localhost:8000"
        code, _, login_body = self.tester.request(
            "POST",
            "/api/auth/login",
            data={"email": "admin@tracker.local", "password": "password123"},
            origin=origin,
            use_auth=False,
        )
        admin_tester = BaseEndpointTester(self.backend_url)
        admin_tester.token = login_body["access_token"]

        # GET /api/matches (public)
        code, h, matches = self.tester.request("GET", "/api/matches", origin=origin, use_auth=False)
        self.assertEqual(code, 200)
        self.assertIsInstance(matches, list)
        self.assert_cors_headers(h, origin)

        # POST /api/matches
        code, h, m = admin_tester.request(
            "POST",
            "/api/matches",
            data={
                "tournament_id": 1,
                "team_a_id": 1,
                "team_b_id": 2,
                "status": "UPCOMING",
                "date": "2026-11-05",
                "match_format": "BO3",
            },
            origin=origin,
        )
        self.assertEqual(code, 201)
        m_id = m["id"]
        self.assert_cors_headers(h, origin)

        # PATCH /api/matches/{id}
        code, h, m_upd = admin_tester.request(
            "PATCH",
            f"/api/matches/{m_id}",
            data={"status": "FINISHED", "score_a": 2, "score_b": 0},
            origin=origin,
        )
        self.assertEqual(code, 200)
        self.assertEqual(m_upd["status"], "FINISHED")
        self.assertEqual(m_upd["winner_id"], 1)
        self.assert_cors_headers(h, origin)

        # DELETE /api/matches/{id}
        code, h, _ = admin_tester.request("DELETE", f"/api/matches/{m_id}", origin=origin)
        self.assertEqual(code, 204)
        self.assert_cors_headers(h, origin)

    def test_08_teams_and_logo_upload(self):
        """Teams listing, creation, logo upload, and deletion."""
        origin = "http://localhost:8000"
        code, _, login_body = self.tester.request(
            "POST",
            "/api/auth/login",
            data={"email": "admin@tracker.local", "password": "password123"},
            origin=origin,
            use_auth=False,
        )
        admin_tester = BaseEndpointTester(self.backend_url)
        admin_tester.token = login_body["access_token"]

        # GET /api/teams
        code, h, teams = self.tester.request("GET", "/api/teams", origin=origin, use_auth=False)
        self.assertEqual(code, 200)
        self.assertIsInstance(teams, list)
        self.assert_cors_headers(h, origin)

        # POST /api/teams
        import time
        team_name = f"TestTeam_{int(time.time() * 1000)}"
        code, h, team = admin_tester.request(
            "POST",
            "/api/teams",
            data={
                "name": team_name,
                "short_name": "TT",
                "region": "Europe",
                "coach": "Test Coach",
                "description": "A test squad",
                "ranking": 99,
            },
            origin=origin,
        )
        self.assertEqual(code, 201)
        team_id = team["id"]
        self.assert_cors_headers(h, origin)

        # POST /api/teams/{id}/logo
        code, h, logo_res = admin_tester.request(
            "POST",
            f"/api/teams/{team_id}/logo",
            data={"image_base64": DUMMY_PNG_B64},
            origin=origin,
        )
        self.assertEqual(code, 200)
        self.assertTrue(logo_res.get("logo_url", "").startswith("/uploads/teams/"))
        self.assert_cors_headers(h, origin)

        # DELETE /api/teams/{id}
        code, h, _ = admin_tester.request("DELETE", f"/api/teams/{team_id}", origin=origin)
        self.assertEqual(code, 204)
        self.assert_cors_headers(h, origin)

    def test_09_players_and_avatar_upload(self):
        """Players listing, avatar upload, and updates."""
        origin = "http://localhost:8000"
        code, _, login_body = self.tester.request(
            "POST",
            "/api/auth/login",
            data={"email": "admin@tracker.local", "password": "password123"},
            origin=origin,
            use_auth=False,
        )
        admin_tester = BaseEndpointTester(self.backend_url)
        admin_tester.token = login_body["access_token"]

        # GET /api/players
        code, h, players = self.tester.request("GET", "/api/players", origin=origin, use_auth=False)
        self.assertEqual(code, 200)
        self.assertIsInstance(players, list)
        self.assert_cors_headers(h, origin)

        # POST /api/players/{id}/avatar
        code, h, p_res = admin_tester.request(
            "POST",
            "/api/players/1/avatar",
            data={"image_base64": DUMMY_PNG_B64},
            origin=origin,
        )
        self.assertEqual(code, 200)
        self.assertTrue(p_res.get("avatar_url", "").startswith("/uploads/players/"))
        self.assert_cors_headers(h, origin)

    def test_10_leaderboards(self):
        """GET /api/leaderboards/teams and /api/leaderboards/players."""
        origin = "http://localhost:8000"
        code, h, teams_lb = self.tester.request("GET", "/api/leaderboards/teams", origin=origin, use_auth=False)
        self.assertEqual(code, 200)
        self.assertIsInstance(teams_lb, list)
        self.assert_cors_headers(h, origin)

        code, h, players_lb = self.tester.request("GET", "/api/leaderboards/players", origin=origin, use_auth=False)
        self.assertEqual(code, 200)
        self.assertIsInstance(players_lb, list)
        self.assert_cors_headers(h, origin)


if __name__ == "__main__":
    unittest.main()
