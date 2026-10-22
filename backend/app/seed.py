from .database import SessionLocal
from .models import Match, Player, Team, Tournament


def seed_if_empty(db_session=None):
    """Заполняет базу данных демонстрационными данными, если она пуста."""
    db = db_session or SessionLocal()
    try:
        if db.query(Team).count() > 0:
            print("[seed] База данных уже содержит данные, пропускаем сидирование.")
            return

        print("[seed] Заполнение базы демонстрационными данными...")

        # 1. Создание команд
        teams = [
            Team(
                name="Team Spirit",
                short_name="Spirit",
                region="Europe",
                coach='Yuri "Yurii" Dvoryanov',
                description="Дисциплинированный состав по CS с элитным контролем карты.",
                ranking=1,
            ),
            Team(
                name="Team Vitality",
                short_name="Vitality",
                region="Europe",
                coach="Dennis Mølleby",
                description="Известны взрывными первыми дуэлями и активным прессингом.",
                ranking=2,
            ),
            Team(
                name="FURIA Esports",
                short_name="FURIA",
                region="Americas",
                coach='Anderson "Ande" Brum',
                description="Агрессивный бразильский стиль игры и высокий темп.",
                ranking=3,
            ),
            Team(
                name="MOUZ",
                short_name="MOUZ",
                region="Europe",
                coach="Alfie",
                description="Структурированный и эффективный европейский коллектив.",
                ranking=4,
            ),
        ]
        db.add_all(teams)
        db.commit()

        # 2. Создание игроков для команд
        players = [
            Player(nickname="donk", name="Danil Kryshkovets", age=19, role="Entry Fragger",
                   nationality="Russian", kd="1.28", impact=9.4, maps=59, team_id=teams[0].id),
            Player(nickname="chopper", name="Aleksandr Gorbunov", age=23, role="IGL",
                   nationality="Russian", kd="1.15", impact=8.8, maps=61, team_id=teams[0].id),
            Player(nickname="sh1ro", name="Bogdan Naumov", age=22, role="AWPer",
                   nationality="Russian", kd="1.23", impact=9.0, maps=62, team_id=teams[0].id),
            Player(nickname="ZywOo", name="Mathieu Herbaut", age=24, role="AWPer",
                   nationality="French", kd="1.47", impact=9.8, maps=88, team_id=teams[1].id),
            Player(nickname="apEX", name="Dan Madesclaire", age=31, role="IGL",
                   nationality="French", kd="1.10", impact=8.6, maps=77, team_id=teams[1].id),
            Player(nickname="ropz", name="Robin Kool", age=25, role="Support",
                   nationality="Estonian", kd="1.17", impact=8.9, maps=73, team_id=teams[1].id),
            Player(nickname="KSCERATO", name="Kaiky Santos", age=20, role="Entry Fragger",
                   nationality="Brazilian", kd="1.18", impact=8.6, maps=72, team_id=teams[2].id),
            Player(nickname="FalleN", name="Gabriel Toledo", age=33, role="Support",
                   nationality="Brazilian", kd="1.11", impact=8.5, maps=79, team_id=teams[2].id),
            Player(nickname="saffee", name="Rafael Costa", age=24, role="AWPer",
                   nationality="Brazilian", kd="1.22", impact=8.9, maps=68, team_id=teams[2].id),
            Player(nickname="torzsi", name="Ádám Kovács", age=23, role="AWPer",
                   nationality="Hungarian", kd="1.18", impact=8.7, maps=63, team_id=teams[3].id),
            Player(nickname="Brollan", name="Ludvig Brolin", age=22, role="Entry Fragger",
                   nationality="Swedish", kd="1.12", impact=8.5, maps=60, team_id=teams[3].id),
        ]
        db.add_all(players)
        db.commit()

        # 3. Создание турниров
        tournaments = [
            Tournament(
                title="PGL Major Copenhagen 2026",
                prize_pool="$1,250,000",
                start_date="2026-03-17",
                end_date="2026-03-31",
                status="Completed",
                location="Copenhagen, Denmark",
            ),
            Tournament(
                title="IEM Katowice 2026",
                prize_pool="$1,000,000",
                start_date="2026-09-20",
                end_date="2026-10-04",
                status="Ongoing",
                location="Katowice, Poland",
            ),
            Tournament(
                title="ESL Pro League Season 24",
                prize_pool="$850,000",
                start_date="2026-10-12",
                end_date="2026-11-02",
                status="Upcoming",
                location="Malta",
            ),
            Tournament(
                title="BLAST Premier Fall Final",
                prize_pool="$425,000",
                start_date="2026-09-18",
                end_date="2026-09-28",
                status="Ongoing",
                location="Copenhagen, Denmark",
            ),
        ]
        db.add_all(tournaments)
        db.commit()

        # 4. Создание матчей
        matches = [
            Match(
                status="LIVE",
                score_a=1,
                score_b=0,
                date="2026-10-02",
                map_name="Mirage",
                team_a_id=teams[1].id,
                team_b_id=teams[3].id,
                tournament_id=tournaments[1].id,
            ),
            Match(
                status="UPCOMING",
                score_a=None,
                score_b=None,
                date="2026-10-14",
                map_name="Inferno",
                team_a_id=teams[0].id,
                team_b_id=teams[3].id,
                tournament_id=tournaments[2].id,
            ),
            Match(
                status="FINISHED",
                score_a=1,
                score_b=2,
                date="2026-09-27",
                map_name="Dust2",
                team_a_id=teams[0].id,
                team_b_id=teams[1].id,
                tournament_id=tournaments[3].id,
            ),
        ]
        db.add_all(matches)
        db.commit()

        print("[seed] Демо-данные успешно добавлены.")
    finally:
        if db_session is None:
            db.close()


if __name__ == "__main__":
    seed_if_empty()
