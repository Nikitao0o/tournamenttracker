from .auth import hash_password
from .database import SessionLocal
from .models import Bracket, Match, Player, Team, Tournament, User


def seed_if_empty(db_session=None):
    """Заполняет базу данных демонстрационными данными, если она пуста."""
    db = db_session or SessionLocal()
    try:
        if db.query(Team).count() > 0:
            print("[seed] База данных уже содержит данные, пропускаем сидирование.")
            return

        print("[seed] Заполнение базы демонстрационными данными...")

        # 0. Создание пользователей
        # Пароль для обоих: password123
        pw_hash, salt = hash_password("password123")

        # Аккаунт администратора (указан в admins.txt)
        admin_user = User(
            email="admin@tracker.local",
            nickname="admin",
            hashed_password=pw_hash,
            salt=salt,
            is_active=True,
            created_at="2026-01-01 00:00:00",
        )
        # Обычный пользователь (не в admins.txt)
        regular_user = User(
            email="user@tracker.local",
            nickname="player_alex",
            hashed_password=pw_hash,
            salt=salt,
            is_active=True,
            created_at="2026-01-02 00:00:00",
        )
        db.add_all([admin_user, regular_user])
        db.commit()

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

        # 2. Создание игроков (один привязан к regular_user, остальные - без аккаунта)
        players = [
            Player(nickname="donk", name="Danil Kryshkovets", age=19, role="Entry Fragger",
                   nationality="Russian", kd="1.28", impact=9.4, maps=59, team_id=teams[0].id,
                   user_id=regular_user.id),  # привязан к зарегистрированному аккаунту
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

        # 3. Создание турниров с разными типами сеток
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

        # 4. Создание турнирной сетки Double Elimination для IEM Katowice 2026 (точь-в-точь как на скриншоте!)
        bracket_katowice = Bracket(
            tournament_id=tournaments[0].id,
            name="Main Playoff Bracket",
            bracket_type="double_elimination",
            status="ACTIVE",
        )
        db.add(bracket_katowice)
        db.commit()
        db.refresh(bracket_katowice)

        # 4.1 Grand final
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

        # 4.2 Upper final
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

        # 4.3 Consolidation final
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

        # 4.4 Lower final
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

        # 4.5 Opening round matches (Spirit vs MOUZ, Vitality vs FURIA)
        m1 = Match(
            tournament_id=tournaments[0].id,
            bracket_id=bracket_katowice.id,
            bracket_type="upper",
            round_name="Opening round",
            round_order=1,
            status="UPCOMING",
            match_format="BO3",
            date="2026-10-02",
            start_time="21:00 Friday",
            team_a_id=teams[0].id,
            team_b_id=teams[3].id,
            next_match_id=upper_final.id,
            next_loser_match_id=lower_final.id,
        )
        m2 = Match(
            tournament_id=tournaments[0].id,
            bracket_id=bracket_katowice.id,
            bracket_type="upper",
            round_name="Opening round",
            round_order=1,
            status="UPCOMING",
            match_format="BO3",
            date="2026-10-02",
            start_time="00:00 Saturday",
            team_a_id=teams[1].id,
            team_b_id=teams[2].id,
            next_match_id=upper_final.id,
            next_loser_match_id=lower_final.id,
        )
        db.add_all([m1, m2])
        db.commit()

        print("[seed] Демо-данные (пользователи, команды, игроки, турниры, сетки) успешно добавлены.")
    finally:
        if db_session is None:
            db.close()


if __name__ == "__main__":
    seed_if_empty()
