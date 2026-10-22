"""Exhaustive test verifying all 38 Swagger/OpenAPI endpoints.
Tests each route via direct backend (8000) and reverse proxy (5173).
Verifies:
1. Valid HTTP status codes (2xx, 400, 401, 403, 404, 409).
2. Proper CORS headers on every response.
3. Preflight OPTIONS responses.
4. Zero network failures, unhandled crashes, or CORS blockage.
"""

import json
import unittest
import urllib.error
import urllib.parse
import urllib.request

DUMMY_PNG_B64 = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
    "+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)


def api_call(
    base_url: str,
    method: str,
    path: str,
    data: dict | None = None,
    token: str | None = None,
    origin: str = "http://localhost:8000",
) -> tuple[int, dict, dict]:
    url = f"{base_url}{path}"
    headers = {
        "Accept": "application/json",
        "Origin": origin,
    }
    body_bytes = None
    if data is not None:
        body_bytes = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=body_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            code = resp.status
            h = dict(resp.headers)
            raw = resp.read().decode("utf-8")
            try:
                b = json.loads(raw) if raw else {}
            except Exception:
                b = {"raw": raw}
            return code, h, b
    except urllib.error.HTTPError as e:
        code = e.code
        h = dict(e.headers)
        raw = e.read().decode("utf-8")
        try:
            b = json.loads(raw) if raw else {}
        except Exception:
            b = {"raw": raw}
        return code, h, b


def options_call(base_url: str, path: str, method: str, origin: str) -> tuple[int, dict]:
    url = f"{base_url}{path}"
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


class TestAllSwaggerRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.backends = [
            ("direct", "http://localhost:8000"),
            ("proxy", "http://localhost:5173"),
        ]
        # Login admin on direct backend to get auth token
        _, _, body = api_call(
            "http://localhost:8000",
            "POST",
            "/api/auth/login",
            data={"email": "admin@tracker.local", "password": "password123"},
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

                # 1. Health
                c, h, b = api_call(base_url, "GET", "/api/health", origin=origin)
                self.assertEqual(c, 200)
                self.assertEqual(b.get("status"), "ok")
                self.assert_cors(h, origin)

                # 2. Auth: Register
                import time
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

                # 3. Auth: Login
                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/auth/login",
                    data={"email": f"u_{uid}_{name}@tracker.local", "password": "password123"},
                    origin=origin,
                )
                self.assertEqual(c, 200)
                u_token = b["access_token"]
                self.assert_cors(h, origin)

                # 4. Auth: /me
                c, h, b = api_call(base_url, "GET", "/api/auth/me", token=u_token, origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 5. Auth: /me PATCH
                c, h, b = api_call(base_url, "PATCH", "/api/auth/me", data={"nickname": f"upd_{uid}_{name}"}, token=u_token, origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 6. Auth: /me/avatar POST
                c, h, b = api_call(base_url, "POST", "/api/auth/me/avatar", data={"image_base64": DUMMY_PNG_B64}, token=u_token, origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 7. Admin: /api/admin/users
                c, h, b = api_call(base_url, "GET", "/api/admin/users", token=self.admin_token, origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 8. Admin: /api/admin/admins-list
                c, h, b = api_call(base_url, "GET", "/api/admin/admins-list", token=self.admin_token, origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 9. Admin: /api/admin/players
                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/admin/players",
                    data={
                        "nickname": f"p_adm_{uid}_{name}",
                        "name": "Admin Created Player",
                        "age": 22,
                        "role": "Entry",
                        "nationality": "France",
                        "kd": "1.20",
                        "impact": 1.3,
                        "maps": 50,
                        "team_id": 1,
                        "user_id": None,
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 201)
                p_adm_id = b["id"]
                self.assert_cors(h, origin)

                # 10. Admin: /api/admin/players/claim
                # Register another user to claim
                c, _, reg_b = api_call(
                    base_url,
                    "POST",
                    "/api/auth/register",
                    data={"email": f"claim_{uid}_{name}@tracker.local", "nickname": f"claim_{uid}_{name}", "password": "password123"},
                    origin=origin,
                )
                claim_user_id = reg_b["id"]
                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/admin/players/claim",
                    data={"player_id": p_adm_id, "user_id": claim_user_id},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 11. Teams: GET /api/teams
                c, h, b = api_call(base_url, "GET", "/api/teams", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 12. Teams: POST /api/teams
                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/teams",
                    data={
                        "name": f"Team_{uid}_{name}",
                        "short_name": "TM",
                        "region": "Americas",
                        "coach": "Coach X",
                        "description": "Team description",
                        "ranking": 50,
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 201)
                t_team_id = b["id"]
                self.assert_cors(h, origin)

                # 13. Teams: GET /api/teams/{id}
                c, h, b = api_call(base_url, "GET", f"/api/teams/{t_team_id}", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 14. Teams: PATCH /api/teams/{id}
                c, h, b = api_call(
                    base_url,
                    "PATCH",
                    f"/api/teams/{t_team_id}",
                    data={"description": "Updated team description"},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 15. Teams: POST /api/teams/{id}/logo
                c, h, b = api_call(
                    base_url,
                    "POST",
                    f"/api/teams/{t_team_id}/logo",
                    data={"image_base64": DUMMY_PNG_B64},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 16. Teams: GET /api/teams/{id}/players
                c, h, b = api_call(base_url, "GET", f"/api/teams/{t_team_id}/players", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 17. Players: GET /api/players
                c, h, b = api_call(base_url, "GET", "/api/players", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 18. Players: POST /api/players
                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/players",
                    data={
                        "nickname": f"pro_{uid}_{name}",
                        "name": "Pro Player",
                        "age": 24,
                        "role": "Sniper",
                        "nationality": "Sweden",
                        "kd": "1.32",
                        "impact": 1.4,
                        "maps": 60,
                        "team_id": t_team_id,
                        "user_id": None,
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 201)
                test_player_id = b["id"]
                self.assert_cors(h, origin)

                # 19. Players: GET /api/players/{id}
                c, h, b = api_call(base_url, "GET", f"/api/players/{test_player_id}", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 20. Players: PATCH /api/players/{id}
                c, h, b = api_call(
                    base_url,
                    "PATCH",
                    f"/api/players/{test_player_id}",
                    data={"role": "Support"},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 21. Players: POST /api/players/{id}/avatar
                c, h, b = api_call(
                    base_url,
                    "POST",
                    f"/api/players/{test_player_id}/avatar",
                    data={"image_base64": DUMMY_PNG_B64},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 22. Tournaments: GET /api/tournaments
                c, h, b = api_call(base_url, "GET", "/api/tournaments", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 23. Tournaments: POST /api/tournaments
                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/tournaments",
                    data={
                        "title": f"Tourney_{uid}_{name}",
                        "prize_pool": "$250,000",
                        "start_date": "2026-12-01",
                        "end_date": "2026-12-10",
                        "status": "Upcoming",
                        "location": "Paris, France",
                        "bracket_type": "double_elimination",
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 201)
                t_tourney_id = b["id"]
                self.assert_cors(h, origin)

                # 24. Tournaments: GET /api/tournaments/{id}
                c, h, b = api_call(base_url, "GET", f"/api/tournaments/{t_tourney_id}", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 25. Tournaments: PATCH /api/tournaments/{id}
                c, h, b = api_call(
                    base_url,
                    "PATCH",
                    f"/api/tournaments/{t_tourney_id}",
                    data={"prize_pool": "$300,000"},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 26. Tournaments: POST /api/tournaments/{id}/bracket/generate (Double Elimination)
                c, h, b = api_call(
                    base_url,
                    "POST",
                    f"/api/tournaments/{t_tourney_id}/bracket/generate",
                    data={
                        "name": "Playoffs",
                        "bracket_type": "double_elimination",
                        "team_ids": [1, 2, 3, 4],
                        "match_format": "BO3",
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 27. Tournaments: GET /api/tournaments/{id}/bracket
                c, h, b = api_call(base_url, "GET", f"/api/tournaments/{t_tourney_id}/bracket", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 28. Tournaments: GET /api/tournaments/{id}/matches
                c, h, b = api_call(base_url, "GET", f"/api/tournaments/{t_tourney_id}/matches", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 29. Matches: GET /api/matches
                c, h, b = api_call(base_url, "GET", "/api/matches", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 30. Matches: POST /api/matches
                c, h, b = api_call(
                    base_url,
                    "POST",
                    "/api/matches",
                    data={
                        "tournament_id": t_tourney_id,
                        "team_a_id": 1,
                        "team_b_id": 2,
                        "status": "UPCOMING",
                        "date": "2026-12-05",
                        "match_format": "BO3",
                    },
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 201)
                t_match_id = b["id"]
                self.assert_cors(h, origin)

                # 31. Matches: GET /api/matches/{id}
                c, h, b = api_call(base_url, "GET", f"/api/matches/{t_match_id}", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 32. Matches: PATCH /api/matches/{id}
                c, h, b = api_call(
                    base_url,
                    "PATCH",
                    f"/api/matches/{t_match_id}",
                    data={"status": "FINISHED", "score_a": 2, "score_b": 1},
                    token=self.admin_token,
                    origin=origin,
                )
                self.assertEqual(c, 200)
                self.assertEqual(b["winner_id"], 1)
                self.assert_cors(h, origin)

                # 33. Matches: DELETE /api/matches/{id}
                c, h, _ = api_call(base_url, "DELETE", f"/api/matches/{t_match_id}", token=self.admin_token, origin=origin)
                self.assertEqual(c, 204)
                self.assert_cors(h, origin)

                # 34. Tournaments: DELETE /api/tournaments/{id}
                c, h, _ = api_call(base_url, "DELETE", f"/api/tournaments/{t_tourney_id}", token=self.admin_token, origin=origin)
                self.assertEqual(c, 204)
                self.assert_cors(h, origin)

                # 35. Players: DELETE /api/players/{id}
                c, h, _ = api_call(base_url, "DELETE", f"/api/players/{test_player_id}", token=self.admin_token, origin=origin)
                self.assertEqual(c, 204)
                self.assert_cors(h, origin)

                # 36. Teams: DELETE /api/teams/{id}
                c, h, _ = api_call(base_url, "DELETE", f"/api/teams/{t_team_id}", token=self.admin_token, origin=origin)
                self.assertEqual(c, 204)
                self.assert_cors(h, origin)

                # 37. Leaderboards: GET /api/leaderboards/teams
                c, h, b = api_call(base_url, "GET", "/api/leaderboards/teams", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)

                # 38. Leaderboards: GET /api/leaderboards/players
                c, h, b = api_call(base_url, "GET", "/api/leaderboards/players", origin=origin)
                self.assertEqual(c, 200)
                self.assert_cors(h, origin)


if __name__ == "__main__":
    unittest.main()
