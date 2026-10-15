from .database import SessionLocal
from .models import Match, Player, Team, Tournament


def seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(Team).count() > 0:
            print("[seed] DB already populated, skipping.")
            return

        # ... тут весь код наполнения teams, players, tournaments, matches ...
        # (тот же, что был в seed(), без create_all и без db.close())

        db.commit()
        print("[seed] Done.")
    finally:
        db.close()