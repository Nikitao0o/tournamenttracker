import pytest


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_auth_and_permissions(client):
    # 1. Register regular user
    reg_res = client.post(
        "/api/auth/register",
        json={"email": "newuser@test.local", "nickname": "new_player", "password": "password123"},
    )
    assert reg_res.status_code == 201

    # 2. Login as regular user
    login_res = client.post(
        "/api/auth/login",
        json={"email": "newuser@test.local", "password": "password123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {token}"}

    # 3. Regular user views profile and updates nickname
    me_res = client.get("/api/auth/me", headers=user_headers)
    assert me_res.status_code == 200
    assert me_res.json()["is_admin"] is False

    up_res = client.patch("/api/auth/me", headers=user_headers, json={"nickname": "updated_nick"})
    assert up_res.status_code == 200
    assert up_res.json()["nickname"] == "updated_nick"

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
    forbidden_res = client.post("/api/tournaments", headers=user_headers, json=tourney_payload)
    assert forbidden_res.status_code == 403

    # 5. Admin login (admin@tracker.local from admins.txt)
    client.post(
        "/api/auth/register",
        json={"email": "admin@tracker.local", "nickname": "admin", "password": "password123"},
    )
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@tracker.local", "password": "password123"},
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 6. Admin creates tournament successfully
    create_tourney = client.post("/api/tournaments", headers=admin_headers, json=tourney_payload)
    assert create_tourney.status_code == 201

    # 7. Admin creates team and player WITHOUT account
    team_res = client.post(
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
    assert team_res.status_code == 201
    team_id = team_res.json()["id"]

    player_res = client.post(
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
    assert player_res.status_code == 201
    player_id = player_res.json()["id"]
    assert player_res.json()["user_email"] is None

    # 8. Admin claims registered user for player profile
    regular_user_id = me_res.json()["id"]
    claim_res = client.post(
        "/api/admin/players/claim",
        headers=admin_headers,
        json={"player_id": player_id, "user_id": regular_user_id},
    )
    assert claim_res.status_code == 200
    assert claim_res.json()["user_email"] == "newuser@test.local"


def test_bracket_endpoint(client):
    tournaments = client.get("/api/tournaments").json()
    if tournaments:
        t_id = tournaments[0]["id"]
        res = client.get(f"/api/tournaments/{t_id}/bracket")
        assert res.status_code == 200
        data = res.json()
        assert "upper_bracket" in data
        assert "lower_bracket" in data
        assert "grand_final" in data
