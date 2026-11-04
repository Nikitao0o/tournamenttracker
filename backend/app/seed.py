import datetime
from .auth import hash_password
from .config import settings
from .database import SessionLocal
from .models import Bracket, MapResult, Match, Player, PlayerMatchStat, Team, Tournament, User


def seed_if_empty(db_session=None):
    """Fills the database with initial demonstration data if it is empty."""
    db = db_session or SessionLocal()
    try:
        if db.query(Team).count() > 0:
            print("[seed] Database already populated, skipping seed.")
            return

        print("[seed] Populating database with demo data...")

        pw_hash, salt = hash_password(settings.ADMIN_PASSWORD)

        admin_user = User(
            email=settings.ADMIN_EMAIL,
            nickname="admin",
            hashed_password=pw_hash,
            salt=salt,
            is_active=True,
            is_admin=True,
            created_at=datetime.datetime.utcnow(),
        )
        regular_user = User(
            email="user@tracker.local",
            nickname="player_donk",
            hashed_password=pw_hash,
            salt=salt,
            is_active=True,
            is_admin=False,
            created_at=datetime.datetime.utcnow(),
        )
        db.add_all([admin_user, regular_user])
        db.commit()

        teams = [
            Team(
                name="Team Spirit",
                short_name="Spirit",
                region="Europe",
                coach='Yuri "Yurii" Dvoryanov',
                description="A disciplined counter-strike roster with elite map control and mid-round composure.",
                ranking=1,
                logo_url="https://cdn.pandascore.co/images/team/image/125863/team_spirit.png",
            ),
            Team(
                name="Team Vitality",
                short_name="Vitality",
                region="Europe",
                coach="Dennis Mølleby",
                description="Known for explosive opening duels and aggressive territorial pressure.",
                ranking=2,
                logo_url="https://cdn.pandascore.co/images/team/image/3216/vitality.png",
            ),
            Team(
                name="G2 Esports",
                short_name="G2",
                region="Europe",
                coach="Wiktor 'TaZ' Wojtas",
                description="High firepower roster capable of turning any round with individual brilliance.",
                ranking=3,
                logo_url="https://cdn.pandascore.co/images/team/image/125863/g2.png",
            ),
            Team(
                name="FURIA Esports",
                short_name="FURIA",
                region="Americas",
                coach='Anderson "Ande" Brum',
                description="Aggressive Brazilian playstyle with fast pace and fearless trades.",
                ranking=4,
                logo_url="https://cdn.pandascore.co/images/team/image/124530/8297.png",
            ),
            Team(
                name="MOUZ",
                short_name="MOUZ",
                region="Europe",
                coach="Dennis 'sycrone' Nielsen",
                description="A structured, young, and efficient European squad with high utility impact.",
                ranking=5,
                logo_url="https://cdn.pandascore.co/images/team/image/3250/mouz.png",
            ),
        ]
        db.add_all(teams)
        db.commit()

        players = [
            # Team Spirit
            Player(nickname="donk", name="Danil Kryshkovets", age=19, role="Entry Fragger",
                   nationality="Russian", kd="1.34", impact=9.6, maps=64, team_id=teams[0].id,
                   user_id=regular_user.id, avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=donk"),
            Player(nickname="chopper", name="Aleksandr Gorbunov", age=23, role="IGL",
                   nationality="Russian", kd="1.15", impact=8.8, maps=61, team_id=teams[0].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=chopper"),
            Player(nickname="sh1ro", name="Dmitry Sokolov", age=22, role="AWPer",
                   nationality="Russian", kd="1.26", impact=9.2, maps=62, team_id=teams[0].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=sh1ro"),
            Player(nickname="zont1x", name="Myroslav Plakhotia", age=19, role="Rifler",
                   nationality="Ukrainian", kd="1.11", impact=8.4, maps=60, team_id=teams[0].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=zont1x"),
            Player(nickname="magixx", name="Boris Vorobiev", age=21, role="Support",
                   nationality="Russian", kd="1.06", impact=8.1, maps=59, team_id=teams[0].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=magixx"),

            # Team Vitality
            Player(nickname="ZywOo", name="Mathieu Herbaut", age=24, role="AWPer",
                   nationality="French", kd="1.42", impact=9.8, maps=88, team_id=teams[1].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=zywoo"),
            Player(nickname="apEX", name="Dan Madesclaire", age=31, role="IGL",
                   nationality="French", kd="1.08", impact=8.6, maps=77, team_id=teams[1].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=apex"),
            Player(nickname="ropz", name="Robin Kool", age=25, role="Lurker",
                   nationality="Estonian", kd="1.19", impact=8.9, maps=73, team_id=teams[1].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=ropz"),
            Player(nickname="flameZ", name="Shahar Shushan", age=21, role="Entry Fragger",
                   nationality="Israeli", kd="1.14", impact=8.7, maps=75, team_id=teams[1].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=flamez"),
            Player(nickname="mezii", name="William Merriman", age=26, role="Support",
                   nationality="British", kd="1.09", impact=8.3, maps=70, team_id=teams[1].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=mezii"),

            # G2 Esports (addresses m0NESY, NiKo missing in DB)
            Player(nickname="m0NESY", name="Ilya Osipov", age=19, role="AWPer",
                   nationality="Russian", kd="1.38", impact=9.7, maps=82, team_id=teams[2].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=m0nesy"),
            Player(nickname="NiKo", name="Nikola Kovač", age=27, role="Rifler",
                   nationality="Bosnian", kd="1.25", impact=9.3, maps=85, team_id=teams[2].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=niko"),
            Player(nickname="huNter-", name="Nemanja Kovač", age=28, role="Rifler",
                   nationality="Bosnian", kd="1.12", impact=8.5, maps=80, team_id=teams[2].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=hunter"),
            Player(nickname="malbsMd", name="Mario Samayoa", age=22, role="Entry Fragger",
                   nationality="Guatemalan", kd="1.17", impact=8.8, maps=78, team_id=teams[2].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=malbsmd"),
            Player(nickname="Snax", name="Janusz Pogorzelski", age=31, role="IGL",
                   nationality="Polish", kd="1.04", impact=8.0, maps=75, team_id=teams[2].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=snax"),

            # FURIA
            Player(nickname="KSCERATO", name="Kaiky Santos", age=24, role="Rifler",
                   nationality="Brazilian", kd="1.20", impact=8.9, maps=72, team_id=teams[3].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=kscerato"),
            Player(nickname="FalleN", name="Gabriel Toledo", age=33, role="IGL",
                   nationality="Brazilian", kd="1.11", impact=8.5, maps=79, team_id=teams[3].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=fallen"),
            Player(nickname="yuurih", name="Yuri Santos", age=24, role="Rifler",
                   nationality="Brazilian", kd="1.15", impact=8.6, maps=70, team_id=teams[3].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=yuurih"),
            Player(nickname="chelo", name="Marcelo Cespedes", age=26, role="Entry Fragger",
                   nationality="Brazilian", kd="1.08", impact=8.2, maps=68, team_id=teams[3].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=chelo"),
            Player(nickname="skullz", name="Felipe Medeiros", age=22, role="Support",
                   nationality="Brazilian", kd="1.10", impact=8.3, maps=65, team_id=teams[3].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=skullz"),

            # MOUZ
            Player(nickname="torzsi", name="Ádám Kovács", age=23, role="AWPer",
                   nationality="Hungarian", kd="1.18", impact=8.7, maps=63, team_id=teams[4].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=torzsi"),
            Player(nickname="Brollan", name="Ludvig Brolin", age=22, role="Entry Fragger",
                   nationality="Swedish", kd="1.14", impact=8.6, maps=60, team_id=teams[4].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=brollan"),
            Player(nickname="Jimpphat", name="Jimi Salo", age=18, role="Lurker",
                   nationality="Finnish", kd="1.16", impact=8.7, maps=65, team_id=teams[4].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=jimpphat"),
            Player(nickname="xertioN", name="Dorian Berman", age=20, role="Entry Fragger",
                   nationality="Israeli", kd="1.12", impact=8.5, maps=62, team_id=teams[4].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=xertion"),
            Player(nickname="siuhy", name="Kamil Szkaradek", age=22, role="IGL",
                   nationality="Polish", kd="1.07", impact=8.2, maps=64, team_id=teams[4].id,
                   avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=siuhy"),
        ]
        db.add_all(players)
        db.commit()

        tournaments = [
            Tournament(
                title="IEM Katowice 2026",
                prize_pool="$1,000,000",
                start_date="2026-09-20",
                end_date="2026-10-04",
                status="Ongoing",
                location="Katowice, Poland",
                bracket_type="double_elimination",
            ),
            Tournament(
                title="PGL Major Copenhagen 2026",
                prize_pool="$1,250,000",
                start_date="2026-03-17",
                end_date="2026-03-31",
                status="Completed",
                location="Copenhagen, Denmark",
                bracket_type="single_elimination",
            ),
            Tournament(
                title="ESL Pro League Season 24",
                prize_pool="$850,000",
                start_date="2026-10-12",
                end_date="2026-11-02",
                status="Upcoming",
                location="Malta",
                bracket_type="round_robin",
            ),
            Tournament(
                title="BLAST Premier Fall Final",
                prize_pool="$425,000",
                start_date="2026-09-18",
                end_date="2026-09-28",
                status="Ongoing",
                location="Copenhagen, Denmark",
                bracket_type="swiss",
            ),
        ]
        db.add_all(tournaments)
        db.commit()

        bracket_katowice = Bracket(
            tournament_id=tournaments[0].id,
            name="Main Playoff Bracket",
            bracket_type="double_elimination",
            status="ACTIVE",
        )
        db.add(bracket_katowice)
        db.commit()
        db.refresh(bracket_katowice)

        grand_final = Match(
            tournament_id=tournaments[0].id,
            bracket_id=bracket_katowice.id,
            bracket_type="grand_final",
            round_name="Grand final",
            round_order=4,
            status="UPCOMING",
            match_format="BO3",
            date="2026-10-04",
            start_time="01:00 Monday",
        )
        db.add(grand_final)
        db.commit()
        db.refresh(grand_final)

        upper_final = Match(
            tournament_id=tournaments[0].id,
            bracket_id=bracket_katowice.id,
            bracket_type="upper",
            round_name="Upper final",
            round_order=2,
            status="UPCOMING",
            match_format="BO3",
            date="2026-10-03",
            start_time="00:00 Sunday",
            next_match_id=grand_final.id,
        )
        db.add(upper_final)
        db.commit()
        db.refresh(upper_final)

        consolidation_final = Match(
            tournament_id=tournaments[0].id,
            bracket_id=bracket_katowice.id,
            bracket_type="lower",
            round_name="Consolidation final",
            round_order=3,
            status="UPCOMING",
            match_format="BO3",
            date="2026-10-03",
            start_time="22:00 Sunday",
            next_match_id=grand_final.id,
        )
        db.add(consolidation_final)
        db.commit()
        db.refresh(consolidation_final)

        upper_final.next_loser_match_id = consolidation_final.id

        lower_final = Match(
            tournament_id=tournaments[0].id,
            bracket_id=bracket_katowice.id,
            bracket_type="lower",
            round_name="Lower final",
            round_order=2,
            status="UPCOMING",
            match_format="BO3",
            date="2026-10-02",
            start_time="21:00 Saturday",
            next_match_id=consolidation_final.id,
        )
        db.add(lower_final)
        db.commit()
        db.refresh(lower_final)

        m1 = Match(
            tournament_id=tournaments[0].id,
            bracket_id=bracket_katowice.id,
            bracket_type="upper",
            round_name="Opening round",
            round_order=1,
            status="FINISHED",
            score_a=2,
            score_b=1,
            match_format="BO3",
            date="2026-10-02",
            start_time="21:00 Friday",
            team_a_id=teams[0].id,  # Spirit
            team_b_id=teams[4].id,  # MOUZ
            winner_id=teams[0].id,
            loser_id=teams[4].id,
            next_match_id=upper_final.id,
            next_loser_match_id=lower_final.id,
        )
        m2 = Match(
            tournament_id=tournaments[0].id,
            bracket_id=bracket_katowice.id,
            bracket_type="upper",
            round_name="Opening round",
            round_order=1,
            status="FINISHED",
            score_a=2,
            score_b=0,
            match_format="BO3",
            date="2026-10-02",
            start_time="00:00 Saturday",
            team_a_id=teams[1].id,  # Vitality
            team_b_id=teams[2].id,  # G2
            winner_id=teams[1].id,
            loser_id=teams[2].id,
            next_match_id=upper_final.id,
            next_loser_match_id=lower_final.id,
        )
        db.add_all([m1, m2])
        db.commit()
        db.refresh(m1)
        db.refresh(m2)

        # Seed Maps for m1 (Spirit vs MOUZ: 2 - 1)
        map1 = MapResult(match_id=m1.id, map_number=1, map_name="Mirage", score_a=13, score_b=9, winner_id=teams[0].id)
        map2 = MapResult(match_id=m1.id, map_number=2, map_name="Inferno", score_a=11, score_b=13, winner_id=teams[4].id)
        map3 = MapResult(match_id=m1.id, map_number=3, map_name="Nuke", score_a=13, score_b=7, winner_id=teams[0].id)
        db.add_all([map1, map2, map3])

        # Seed Maps for m2 (Vitality vs G2: 2 - 0)
        map4 = MapResult(match_id=m2.id, map_number=1, map_name="Dust2", score_a=13, score_b=8, winner_id=teams[1].id)
        map5 = MapResult(match_id=m2.id, map_number=2, map_name="Anubis", score_a=16, score_b=14, winner_id=teams[1].id)
        db.add_all([map4, map5])
        db.commit()

        # Seed Player Match Stats for m1 (Spirit vs MOUZ)
        donk = players[0]
        sh1ro = players[2]
        torzsi = players[20]
        brollan = players[21]

        p_stats = [
            PlayerMatchStat(
                match_id=m1.id, player_id=donk.id, team_id=teams[0].id,
                kills=62, deaths=39, assists=14, headshots=41, adr=94.5, kast=78.2, rating=1.45, is_mvp=True,
            ),
            PlayerMatchStat(
                match_id=m1.id, player_id=sh1ro.id, team_id=teams[0].id,
                kills=54, deaths=36, assists=12, headshots=18, adr=82.1, kast=75.0, rating=1.28, is_mvp=False,
            ),
            PlayerMatchStat(
                match_id=m1.id, player_id=torzsi.id, team_id=teams[4].id,
                kills=48, deaths=44, assists=9, headshots=19, adr=76.3, kast=71.4, rating=1.12, is_mvp=False,
            ),
            PlayerMatchStat(
                match_id=m1.id, player_id=brollan.id, team_id=teams[4].id,
                kills=41, deaths=47, assists=15, headshots=24, adr=69.8, kast=68.0, rating=0.98, is_mvp=False,
            ),
            # Vitality vs G2 (m2)
            PlayerMatchStat(
                match_id=m2.id, player_id=players[5].id, team_id=teams[1].id,  # ZywOo
                kills=51, deaths=24, assists=11, headshots=22, adr=98.2, kast=82.5, rating=1.52, is_mvp=True,
            ),
            PlayerMatchStat(
                match_id=m2.id, player_id=players[10].id, team_id=teams[2].id, # m0NESY
                kills=42, deaths=32, assists=8, headshots=16, adr=84.0, kast=74.2, rating=1.24, is_mvp=False,
            ),
            PlayerMatchStat(
                match_id=m2.id, player_id=players[11].id, team_id=teams[2].id, # NiKo
                kills=38, deaths=35, assists=10, headshots=26, adr=79.5, kast=70.0, rating=1.10, is_mvp=False,
            ),
        ]
        db.add_all(p_stats)

        # Advance Upper final and Lower final with winners/losers
        upper_final.team_a_id = teams[0].id  # Spirit
        upper_final.team_b_id = teams[1].id  # Vitality
        lower_final.team_a_id = teams[4].id  # MOUZ
        lower_final.team_b_id = teams[2].id  # G2

        db.commit()

        print("[seed] Demo data (users, teams, players, tournaments, brackets, maps, player stats) successfully loaded.")
    finally:
        if db_session is None:
            db.close()


if __name__ == "__main__":
    seed_if_empty()
