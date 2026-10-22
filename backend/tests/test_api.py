import pytest


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_team_crud(client):
    # 1. Create Team
    payload = {
        "name": "Natus Vincere",
        "short_name": "NAVI",
        "region": "Europe",
        "coach": "B1ad3",
        "description": "Legendary esports organization",
        "ranking": 1,
    }
    res = client.post("/api/teams", json=payload)
    assert res.status_code == 201
    team_data = res.json()
    team_id = team_data["id"]
    assert team_data["name"] == "Natus Vincere"
    assert team_data["ranking"] == 1

    # 2. Duplicate Team Name -> 409 Conflict
    res_dup = client.post("/api/teams", json=payload)
    assert res_dup.status_code == 409

    # 3. Read Team
    res_get = client.get(f"/api/teams/{team_id}")
    assert res_get.status_code == 200
    assert res_get.json()["short_name"] == "NAVI"

    # 4. Update Team
    res_patch = client.patch(f"/api/teams/{team_id}", json={"ranking": 2})
    assert res_patch.status_code == 200
    assert res_patch.json()["ranking"] == 2

    # 5. List Teams
    res_list = client.get("/api/teams")
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1

    # 6. Delete Team
    res_del = client.delete(f"/api/teams/{team_id}")
    assert res_del.status_code == 204

    # 7. Check Not Found
    res_after = client.get(f"/api/teams/{team_id}")
    assert res_after.status_code == 404


def test_player_crud_and_validation(client):
    # Create Team first
    team_res = client.post(
        "/api/teams",
        json={
            "name": "FaZe Clan",
            "short_name": "FaZe",
            "region": "Europe",
            "coach": "NEO",
            "description": "Star-studded roster",
            "ranking": 2,
        },
    )
    team_id = team_res.json()["id"]

    # 1. Create Player with valid team
    player_payload = {
        "nickname": "broky",
        "name": "Helvijs Saukants",
        "age": 23,
        "role": "AWPer",
        "nationality": "Latvian",
        "kd": "1.18",
        "impact": 8.7,
        "maps": 45,
        "team_id": team_id,
    }
    res_p = client.post("/api/players", json=player_payload)
    assert res_p.status_code == 201
    player_data = res_p.json()
    player_id = player_data["id"]
    assert player_data["nickname"] == "broky"
    assert player_data["team_name"] == "FaZe Clan"

    # 2. Create Player with non-existing team -> 400
    bad_payload = dict(player_payload, team_id=99999)
    res_bad = client.post("/api/players", json=bad_payload)
    assert res_bad.status_code == 400

    # 3. Create Player with invalid age -> 422 Unprocessable Entity
    invalid_age_payload = dict(player_payload, age=5)
    res_invalid = client.post("/api/players", json=invalid_age_payload)
    assert res_invalid.status_code == 422

    # 4. Get Team Players
    res_team_players = client.get(f"/api/teams/{team_id}/players")
    assert res_team_players.status_code == 200
    assert len(res_team_players.json()) == 1
    assert res_team_players.json()[0]["id"] == player_id

    # 5. Update Player
    res_up = client.patch(f"/api/players/{player_id}", json={"age": 24})
    assert res_up.status_code == 200
    assert res_up.json()["age"] == 24

    # 6. Delete Player
    assert client.delete(f"/api/players/{player_id}").status_code == 204
    assert client.get(f"/api/players/{player_id}").status_code == 404


def test_tournament_and_matches(client):
    # Setup Teams
    t1 = client.post("/api/teams", json={
        "name": "Team A", "short_name": "TA", "region": "EU", "coach": "C1", "description": "D1", "ranking": 1
    }).json()["id"]
    t2 = client.post("/api/teams", json={
        "name": "Team B", "short_name": "TB", "region": "EU", "coach": "C2", "description": "D2", "ranking": 2
    }).json()["id"]

    # 1. Create Tournament
    tourney_payload = {
        "title": "Major Winter 2026",
        "prize_pool": "$1,000,000",
        "start_date": "2026-12-01",
        "end_date": "2026-12-15",
        "status": "Upcoming",
        "location": "Berlin, Germany",
    }
    res_t = client.post("/api/tournaments", json=tourney_payload)
    assert res_t.status_code == 201
    tourney_id = res_t.json()["id"]

    # 2. Match with same team -> 422 (Pydantic validator)
    res_self = client.post("/api/matches", json={
        "status": "UPCOMING",
        "date": "2026-12-02",
        "team_a_id": t1,
        "team_b_id": t1,
        "tournament_id": tourney_id,
    })
    assert res_self.status_code == 422

    # 3. Create valid Match
    match_payload = {
        "status": "LIVE",
        "score_a": 1,
        "score_b": 0,
        "date": "2026-12-02",
        "map_name": "Mirage",
        "team_a_id": t1,
        "team_b_id": t2,
        "tournament_id": tourney_id,
    }
    res_m = client.post("/api/matches", json=match_payload)
    assert res_m.status_code == 201
    match_id = res_m.json()["id"]
    assert res_m.json()["team_a_name"] == "Team A"
    assert res_m.json()["tournament_name"] == "Major Winter 2026"

    # 4. Tournament Matches endpoint
    res_tm = client.get(f"/api/tournaments/{tourney_id}/matches")
    assert res_tm.status_code == 200
    assert len(res_tm.json()) == 1

    # 5. Update Match
    res_mu = client.patch(f"/api/matches/{match_id}", json={"score_a": 2, "status": "FINISHED"})
    assert res_mu.status_code == 200
    assert res_mu.json()["score_a"] == 2
    assert res_mu.json()["status"] == "FINISHED"

    # 6. Delete Match
    assert client.delete(f"/api/matches/{match_id}").status_code == 204
    assert client.get(f"/api/matches/{match_id}").status_code == 404


def test_leaderboards(client):
    # Seed teams with different rankings
    client.post("/api/teams", json={
        "name": "Alpha", "short_name": "A", "region": "EU", "coach": "C", "description": "D", "ranking": 1
    })
    client.post("/api/teams", json={
        "name": "Beta", "short_name": "B", "region": "EU", "coach": "C", "description": "D", "ranking": 2
    })

    res_teams = client.get("/api/leaderboards/teams")
    assert res_teams.status_code == 200
    assert len(res_teams.json()) >= 2
    assert res_teams.json()[0]["name"] == "Alpha"

    res_players = client.get("/api/leaderboards/players")
    assert res_players.status_code == 200
