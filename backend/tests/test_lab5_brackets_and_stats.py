import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.config import settings
from app import crud, models, schemas
from app.main import app


def test_single_elimination_generation_and_byes(db_session):
    """Requirement 4.1: Single elimination for N teams (2..32) with standard seeding and auto byes."""
    # Create 16 teams
    teams = []
    for i in range(1, 17):
        t = crud.create_team(
            db_session,
            schemas.TeamCreate(
                name=f"Seed Team {i:02d}",
                short_name=f"T{i:02d}",
                region="Europe",
                coach="Coach",
                description="Test team",
                ranking=i,
            ),
        )
        teams.append(t)

    # Test counts: N = 3, 5, 6, 7, 8, 12, 16
    for n in [3, 5, 6, 7, 8, 12, 16]:
        tourney = crud.create_tournament(
            db_session,
            schemas.TournamentCreate(
                title=f"Single Elim {n} Tournament",
                prize_pool="$50,000",
                start_date="2026-11-01",
                end_date="2026-11-05",
                status="Upcoming",
                location="Berlin",
                bracket_type="single_elimination",
            ),
        )
        sub_teams = [t.id for t in teams[:n]]
        bracket_view = crud.generate_tournament_bracket(
            db_session,
            tourney.id,
            schemas.BracketCreate(
                name=f"Playoffs {n}",
                bracket_type="single_elimination",
                team_ids=sub_teams,
                match_format="BO3",
            ),
        )

        assert bracket_view.grand_final is not None
        matches = (
            db_session.query(models.Match)
            .filter(models.Match.tournament_id == tourney.id)
            .all()
        )

        if n == 3:
            # 4 slots, 2 rounds: round 1 has 2 matches (1 bye + 1 real match), round 2 is final
            r1_matches = [m for m in matches if m.round_order == 1]
            assert len(r1_matches) == 2
            bye_matches = [m for m in r1_matches if m.status == "FINISHED"]
            assert len(bye_matches) == 1
            assert bye_matches[0].winner_id == sub_teams[0]  # Seed 1 got the bye
            # And Final has team_a_id set to Seed 1
            final_m = [m for m in matches if m.round_order == 2][0]
            assert final_m.team_a_id == sub_teams[0]

        elif n == 5:
            # 8 slots, 3 rounds: 4 QF matches (3 byes + 1 real match)
            r1_matches = [m for m in matches if m.round_order == 1]
            assert len(r1_matches) == 4
            bye_matches = [m for m in r1_matches if m.status == "FINISHED"]
            assert len(bye_matches) == 3

        elif n == 8:
            # 8 slots, exactly 4 QF matches, 0 byes
            r1_matches = [m for m in matches if m.round_order == 1]
            assert len(r1_matches) == 4
            assert all(m.status == "UPCOMING" for m in r1_matches)
            assert all(m.team_a_id is not None and m.team_b_id is not None for m in r1_matches)

        elif n == 16:
            # 16 slots, exactly 8 Round of 16 matches, 0 byes
            r1_matches = [m for m in matches if m.round_order == 1]
            assert len(r1_matches) == 8
            assert all(m.status == "UPCOMING" for m in r1_matches)


def test_double_elimination_supports_4_and_8_and_rejects_others(db_session):
    """Requirement 4.2: Double elimination strictly supports 4 or 8 teams, 400 for others."""
    teams = [
        crud.create_team(
            db_session,
            schemas.TeamCreate(
                name=f"DE Team {i}",
                short_name=f"DET{i}",
                region="Europe",
                coach="Coach",
                description="Test",
                ranking=i,
            ),
        )
        for i in range(1, 10)
    ]

    tourney = crud.create_tournament(
        db_session,
        schemas.TournamentCreate(
            title="DE Test Tourney",
            prize_pool="$100,000",
            start_date="2026-11-10",
            end_date="2026-11-15",
            status="Upcoming",
            location="Stockholm",
            bracket_type="double_elimination",
        ),
    )

    # 4 teams -> SUCCESS
    b_4 = crud.generate_tournament_bracket(
        db_session,
        tourney.id,
        schemas.BracketCreate(
            name="DE 4",
            bracket_type="double_elimination",
            team_ids=[t.id for t in teams[:4]],
            match_format="BO3",
        ),
    )
    assert b_4.grand_final is not None
    m_count_4 = db_session.query(models.Match).filter(models.Match.tournament_id == tourney.id).count()
    assert m_count_4 == 6  # 2 Upper SF + 1 UF + 1 LSF + 1 LF + 1 GF

    # 8 teams -> SUCCESS
    b_8 = crud.generate_tournament_bracket(
        db_session,
        tourney.id,
        schemas.BracketCreate(
            name="DE 8",
            bracket_type="double_elimination",
            team_ids=[t.id for t in teams[:8]],
            match_format="BO3",
        ),
    )
    assert b_8.grand_final is not None
    m_count_8 = db_session.query(models.Match).filter(models.Match.tournament_id == tourney.id).count()
    assert m_count_8 == 14  # 4 UQF + 2 USF + 1 UF + 2 LR1 + 2 LR2 + 1 LSF + 1 LF + 1 GF

    # 5 teams -> 400
    with pytest.raises(HTTPException) as exc:
        crud.generate_tournament_bracket(
            db_session,
            tourney.id,
            schemas.BracketCreate(
                name="DE 5",
                bracket_type="double_elimination",
                team_ids=[t.id for t in teams[:5]],
                match_format="BO3",
            ),
        )
    assert exc.value.status_code == 400
    assert "supports 4 or 8 teams" in exc.value.detail


def test_swiss_next_round_generation(client: TestClient, admin_token_headers: dict, db_session):
    """Requirement 4.3: Swiss next-round generation by match results without duplicate pairings."""
    teams = [
        crud.create_team(
            db_session,
            schemas.TeamCreate(
                name=f"Swiss Team {i}",
                short_name=f"SW{i}",
                region="Europe",
                coach="Coach",
                description="Test",
                ranking=i,
            ),
        )
        for i in range(1, 5)
    ]

    tourney = crud.create_tournament(
        db_session,
        schemas.TournamentCreate(
            title="Swiss Test Tourney",
            prize_pool="$10,000",
            start_date="2026-11-20",
            end_date="2026-11-25",
            status="Upcoming",
            location="London",
            bracket_type="swiss",
        ),
    )

    # Initial bracket generation (Round 1)
    crud.generate_tournament_bracket(
        db_session,
        tourney.id,
        schemas.BracketCreate(
            name="Swiss Stage",
            bracket_type="swiss",
            team_ids=[t.id for t in teams],
            match_format="BO3",
        ),
    )

    # Trying to generate next round while Round 1 is incomplete fails with 400
    resp = client.post(f"/api/tournaments/{tourney.id}/bracket/next-round", headers=admin_token_headers)
    assert resp.status_code == 400
    assert "must be finished" in resp.json()["detail"]

    # Finish Round 1 matches
    r1_matches = (
        db_session.query(models.Match)
        .filter(models.Match.tournament_id == tourney.id, models.Match.round_order == 1)
        .all()
    )
    assert len(r1_matches) == 2

    # Match 0: Team 1 beats Team 3
    crud.update_match(
        db_session,
        r1_matches[0].id,
        schemas.MatchUpdate(status="FINISHED", score_a=2, score_b=0),
    )
    # Match 1: Team 2 beats Team 4
    crud.update_match(
        db_session,
        r1_matches[1].id,
        schemas.MatchUpdate(status="FINISHED", score_a=2, score_b=1),
    )

    # Now generate Round 2
    resp = client.post(f"/api/tournaments/{tourney.id}/bracket/next-round", headers=admin_token_headers)
    assert resp.status_code == 200

    r2_matches = (
        db_session.query(models.Match)
        .filter(models.Match.tournament_id == tourney.id, models.Match.round_order == 2)
        .all()
    )
    assert len(r2_matches) == 2

    # The 1-0 teams (Team 1 and Team 2) should play each other!
    # The 0-1 teams (Team 3 and Team 4) should play each other!
    t1_id, t2_id = teams[0].id, teams[1].id
    t3_id, t4_id = teams[2].id, teams[3].id

    match_pairs = [
        {m.team_a_id, m.team_b_id} for m in r2_matches
    ]
    assert {t1_id, t2_id} in match_pairs
    assert {t3_id, t4_id} in match_pairs


def test_schema_validations(client: TestClient, admin_token_headers: dict):
    """Requirement 4.4: Literal status/bracket_type, date validations, image URL checks."""
    # 1. Invalid tournament dates (end < start)
    resp = client.post(
        "/api/tournaments",
        headers=admin_token_headers,
        json={
            "title": "Invalid Date Tournament",
            "prize_pool": "$1,000",
            "start_date": "2026-12-10",
            "end_date": "2026-12-01",  # end before start
            "status": "Upcoming",
            "location": "Paris",
            "bracket_type": "single_elimination",
        },
    )
    assert resp.status_code == 422

    # 2. Invalid image URL scheme (XSS or ftp)
    resp = client.post(
        "/api/teams",
        headers=admin_token_headers,
        json={
            "name": "Bad URL Team",
            "short_name": "BUT",
            "region": "Europe",
            "coach": "Coach",
            "description": "Desc",
            "ranking": 99,
            "logo_url": "javascript:alert('xss')",
        },
    )
    assert resp.status_code == 422


def test_player_match_stat_validations_and_patch_delete(
    client: TestClient, admin_token_headers: dict, db_session
):
    """Requirement 4.5: Player stat validations, rating calculation, PATCH/DELETE for maps and stats."""
    # Setup team, players, match
    t1 = crud.create_team(
        db_session,
        schemas.TeamCreate(
            name="Valid Team A",
            short_name="VTA",
            region="Europe",
            coach="C1",
            description="D1",
            ranking=1,
        ),
    )
    t2 = crud.create_team(
        db_session,
        schemas.TeamCreate(
            name="Valid Team B",
            short_name="VTB",
            region="Europe",
            coach="C2",
            description="D2",
            ranking=2,
        ),
    )
    t3 = crud.create_team(
        db_session,
        schemas.TeamCreate(
            name="Foreign Team C",
            short_name="FTC",
            region="Europe",
            coach="C3",
            description="D3",
            ranking=3,
        ),
    )
    p1 = crud.create_player(
        db_session,
        schemas.PlayerCreate(
            nickname="Shooter",
            name="John Doe",
            age=22,
            role="Rifler",
            nationality="Sweden",
            kd="1.20",
            impact=1.30,
            maps=10,
            team_id=t1.id,
        ),
    )
    p_foreign = crud.create_player(
        db_session,
        schemas.PlayerCreate(
            nickname="Foreigner",
            name="Foreign Player",
            age=20,
            role="Sniper",
            nationality="France",
            kd="1.10",
            impact=1.10,
            maps=5,
            team_id=t3.id,
        ),
    )
    tourney = crud.create_tournament(
        db_session,
        schemas.TournamentCreate(
            title="Stat Test Tourney",
            prize_pool="$1,000",
            start_date="2026-11-01",
            end_date="2026-11-02",
            status="Upcoming",
            location="Stockholm",
            bracket_type="single_elimination",
        ),
    )
    m = crud.create_match(
        db_session,
        schemas.MatchCreate(
            status="UPCOMING",
            date="2026-11-01",
            tournament_id=tourney.id,
            team_a_id=t1.id,
            team_b_id=t2.id,
            match_format="BO3",
        ),
    )

    # 1. Foreign team player rejected
    resp = client.post(
        f"/api/matches/{m.id}/player-stats",
        headers=admin_token_headers,
        json={
            "player_id": p_foreign.id,
            "team_id": t3.id,
            "kills": 20,
            "deaths": 10,
        },
    )
    assert resp.status_code == 400
    assert "does not participate" in resp.json()["detail"]

    # 2. Valid player stat with None rating calculates rating automatically
    resp = client.post(
        f"/api/matches/{m.id}/player-stats",
        headers=admin_token_headers,
        json={
            "player_id": p1.id,
            "team_id": t1.id,
            "kills": 25,
            "deaths": 12,
            "assists": 5,
            "headshots": 14,
            "adr": 92.5,
            "kast": 79.0,
            "rating": None,
        },
    )
    assert resp.status_code == 201
    stat_data = resp.json()
    stat_id = stat_data["id"]
    assert stat_data["rating"] > 1.2  # calculated rating

    # 3. PATCH player stat
    resp = client.patch(
        f"/api/matches/{m.id}/player-stats/{stat_id}",
        headers=admin_token_headers,
        json={"kills": 28, "rating": 1.48},
    )
    assert resp.status_code == 200
    assert resp.json()["kills"] == 28
    assert resp.json()["rating"] == 1.48

    # 4. Map result PATCH and DELETE
    resp = client.post(
        f"/api/matches/{m.id}/maps",
        headers=admin_token_headers,
        json={"map_number": 1, "map_name": "Mirage", "score_a": 13, "score_b": 11},
    )
    assert resp.status_code == 201
    map_id = resp.json()["id"]

    resp = client.patch(
        f"/api/matches/{m.id}/maps/{map_id}",
        headers=admin_token_headers,
        json={"score_a": 16, "score_b": 14},
    )
    assert resp.status_code == 200
    assert resp.json()["score_a"] == 16

    resp = client.delete(f"/api/matches/{m.id}/maps/{map_id}", headers=admin_token_headers)
    assert resp.status_code == 204

    # 5. DELETE player stat
    resp = client.delete(f"/api/matches/{m.id}/player-stats/{stat_id}", headers=admin_token_headers)
    assert resp.status_code == 204


def test_lightweight_matches_and_500_masking(client: TestClient):
    """Requirement 4.6 & 4.8: Lightweight matches list & 500 error message masking."""
    # GET /api/matches returns lightweight matches without map_results and player_stats
    resp = client.get("/api/matches")
    assert resp.status_code == 200
    matches = resp.json()
    if matches:
        first = matches[0]
        # In lightweight schema, player_stats and map_results are omitted
        assert "player_stats" not in first
        assert "map_results" not in first

    # GET /api/matches/{id} includes player_stats and map_results
    if matches:
        m_id = matches[0]["id"]
        detail_resp = client.get(f"/api/matches/{m_id}")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert "player_stats" in detail
        assert "map_results" in detail

    # Check 500 error detail when DEBUG=False
    orig_debug = settings.DEBUG
    try:
        settings.DEBUG = False
        # Trigger an unhandled exception by hitting a test scenario or mocking
        # Let's verify unhandled_exception_handler directly with a fake request
        from fastapi import Request
        from app.main import unhandled_exception_handler

        req = Request(scope={"type": "http", "method": "GET", "path": "/api/test", "headers": []})
        import asyncio
        response = asyncio.run(unhandled_exception_handler(req, RuntimeError("secret database error details")))
        import json
        body = json.loads(response.body.decode())
        assert body["detail"] == "Internal server error"
        assert "secret" not in body["detail"]
    finally:
        settings.DEBUG = orig_debug
