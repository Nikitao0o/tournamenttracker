import base64
import time
import requests

BASE_URL = "http://localhost:5173/api"

def test_full_lifecycle():
    print("[1] Logging in as admin@local.com / admin...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@local.com", "password": "admin"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    tokens = login_res.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]
    admin_headers = {"Authorization": f"Bearer {access_token}"}
    print(" -> Admin login successful! Access token received.")

    ts = int(time.time())
    print("[2] Creating a new team with logo...")
    t_res = requests.post(
        f"{BASE_URL}/teams",
        headers=admin_headers,
        json={
            "name": f"Cloud9 {ts}",
            "short_name": "C9",
            "region": "Americas",
            "coach": "groove",
            "description": "NA powerhouse",
            "ranking": 12,
        },
    )
    assert t_res.status_code == 201, f"Team creation failed: {t_res.text}"
    team = t_res.json()
    team_id = team["id"]
    print(f" -> Team created: {team['name']} (id={team_id})")

    import io
    from PIL import Image
    img = Image.new("RGBA", (64, 64), color=(0, 120, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    logo_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    logo_res = requests.post(
        f"{BASE_URL}/teams/{team_id}/logo",
        headers=admin_headers,
        json={"image_base64": logo_b64},
    )
    assert logo_res.status_code == 200, f"Logo upload failed: {logo_res.text}"
    print(f" -> Logo successfully uploaded: {logo_res.json().get('logo_url')}")

    print("[3] Creating player for the team...")
    p_res = requests.post(
        f"{BASE_URL}/players",
        headers=admin_headers,
        json={
            "nickname": "electronic",
            "name": "Denis Sharipov",
            "age": 26,
            "role": "Rifler",
            "nationality": "Russian",
            "kd": "1.15",
            "impact": 7.5,
            "maps": 40,
            "team_id": team_id,
        },
    )
    assert p_res.status_code == 201, f"Player creation failed: {p_res.text}"
    player = p_res.json()
    player_id = player["id"]
    print(f" -> Player created: {player['nickname']} (id={player_id})")

    print("[4] Creating tournament...")
    tour_res = requests.post(
        f"{BASE_URL}/tournaments",
        headers=admin_headers,
        json={
            "title": "BLAST World Final 2026",
            "prize_pool": "$1,000,000",
            "start_date": "2026-12-10",
            "end_date": "2026-12-15",
            "status": "Upcoming",
            "location": "Singapore",
            "bracket_type": "double_elimination",
        },
    )
    assert tour_res.status_code == 201, f"Tournament creation failed: {tour_res.text}"
    tourney = tour_res.json()
    tourney_id = tourney["id"]
    print(f" -> Tournament created: {tourney['title']} (id={tourney_id})")

    print("[5] Generating tournament bracket...")
    # Get 3 other teams for a 4-team DE bracket
    all_teams = requests.get(f"{BASE_URL}/teams").json()
    four_team_ids = [team_id] + [t["id"] for t in all_teams if t["id"] != team_id][:3]
    bracket_res = requests.post(
        f"{BASE_URL}/tournaments/{tourney_id}/bracket/generate",
        headers=admin_headers,
        json={
            "name": "Main DE Stage",
            "bracket_type": "double_elimination",
            "team_ids": four_team_ids,
            "match_format": "BO3",
        },
    )
    assert bracket_res.status_code == 200, f"Bracket generation failed: {bracket_res.text}"
    print(" -> Bracket successfully generated (Double Elimination 4 teams)!")

    print("[6] Creating a match...")
    m_res = requests.post(
        f"{BASE_URL}/matches",
        headers=admin_headers,
        json={
            "tournament_id": tourney_id,
            "team_a_id": four_team_ids[0],
            "team_b_id": four_team_ids[1],
            "date": "2026-12-11",
            "start_time": "18:00 Friday",
            "status": "UPCOMING",
            "match_format": "BO3",
        },
    )
    assert m_res.status_code == 201, f"Match creation failed: {m_res.text}"
    match = m_res.json()
    match_id = match["id"]
    print(f" -> Match created: id={match_id}")

    print("[7] Adding map result to match...")
    map_res = requests.post(
        f"{BASE_URL}/matches/{match_id}/maps",
        headers=admin_headers,
        json={
            "map_number": 1,
            "map_name": "Mirage",
            "score_a": 13,
            "score_b": 9,
            "winner_id": four_team_ids[0],
        },
    )
    assert map_res.status_code == 201, f"Map score creation failed: {map_res.text}"
    map_data = map_res.json()
    map_id = map_data["id"]
    print(f" -> Map result added: id={map_id}, map=Mirage, score=13:9")

    print("[8] Adding player match statistics...")
    stat_res = requests.post(
        f"{BASE_URL}/matches/{match_id}/player-stats",
        headers=admin_headers,
        json={
            "player_id": player_id,
            "team_id": team_id,
            "map_id": map_id,
            "kills": 24,
            "deaths": 12,
            "assists": 6,
            "headshots": 14,
            "adr": 96.5,
            "kast": 83.3,
            "rating": None,  # Auto-calculate
            "is_mvp": True,
        },
    )
    assert stat_res.status_code == 201, f"Player stat creation failed: {stat_res.text}"
    stat_data = stat_res.json()
    print(f" -> Stat added: rating={stat_data['rating']} (auto-calculated), is_mvp={stat_data['is_mvp']}")

    print("[9] Updating match to FINISHED...")
    fin_res = requests.patch(
        f"{BASE_URL}/matches/{match_id}",
        headers=admin_headers,
        json={"status": "FINISHED", "score_a": 2, "score_b": 0},
    )
    assert fin_res.status_code == 200, f"Match finish failed: {fin_res.text}"
    print(f" -> Match finished! Winner={fin_res.json().get('winner_name')}")

    print("[10] Verifying public pages/APIs...")
    pub_m = requests.get(f"{BASE_URL}/matches/{match_id}").json()
    assert pub_m["status"] == "FINISHED"
    assert len(pub_m["map_results"]) >= 1
    assert len(pub_m["player_stats"]) >= 1

    team_lb = requests.get(f"{BASE_URL}/leaderboards/teams").json()
    assert any(t["team_id"] == team_id for t in team_lb)

    player_lb = requests.get(f"{BASE_URL}/leaderboards/players").json()
    assert any(p["player_id"] == player_id for p in player_lb)
    print(" -> All public listings and leaderboards show updated entities!")

    print("[11] Testing logout...")
    lo_res = requests.post(f"{BASE_URL}/auth/logout", json={"refresh_token": refresh_token})
    assert lo_res.status_code == 200, f"Logout failed: {lo_res.text}"
    print(" -> Logout successful!")

    print("[12] Testing re-login...")
    relogin_res = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@local.com", "password": "admin"})
    assert relogin_res.status_code == 200
    new_tokens = relogin_res.json()
    new_refresh = new_tokens["refresh_token"]
    print(" -> Re-login successful!")

    print("[13] Testing refresh token rotation...")
    rot_res = requests.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": new_refresh})
    assert rot_res.status_code == 200
    rotated_access = rot_res.json()["access_token"]
    rotated_refresh = rot_res.json()["refresh_token"]
    assert rotated_refresh != new_refresh
    print(" -> Silent token refresh succeeded and rotated refresh token!")

    print("\nALL LIFECYCLE CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_full_lifecycle()
