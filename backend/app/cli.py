import argparse
import datetime
import sys
from .config import settings
from .database import SessionLocal
from .auth import hash_password
from .models import User, Player, RefreshToken


def create_admin(email: str, password: str, nickname: str = "admin"):
    """Creates or updates an administrator user."""
    db = SessionLocal()
    try:
        clean_email = email.strip().lower()
        user = db.query(User).filter(User.email == clean_email).first()
        pw_hash, salt = hash_password(password)
        if user:
            user.hashed_password = pw_hash
            user.salt = salt
            user.is_admin = True
            user.is_active = True
            db.commit()
            print(f"Updated existing user '{clean_email}' to administrator.")
        else:
            user = User(
                email=clean_email,
                nickname=nickname.strip() or "admin",
                hashed_password=pw_hash,
                salt=salt,
                is_active=True,
                is_admin=True,
                created_at=datetime.datetime.now(datetime.timezone.utc),
            )
            db.add(user)
            db.commit()
            print(f"Created new administrator: '{clean_email}'.")
    finally:
        db.close()


def purge_users():
    """Removes all users except the primary ADMIN_EMAIL.
    Sets players.user_id to NULL and cascades token deletions.
    """
    db = SessionLocal()
    try:
        keep_email = settings.ADMIN_EMAIL.strip().lower()
        users_to_purge = db.query(User).filter(User.email != keep_email).all()

        if not users_to_purge:
            print(f"No non-admin users found to purge. Retained primary admin '{keep_email}'.")
            return

        purged_count = len(users_to_purge)
        user_ids = [u.id for u in users_to_purge]

        # 1. Unlink player accounts
        db.query(Player).filter(Player.user_id.in_(user_ids)).update(
            {"user_id": None}, synchronize_session=False
        )

        # 2. Delete refresh tokens
        db.query(RefreshToken).filter(RefreshToken.user_id.in_(user_ids)).delete(
            synchronize_session=False
        )

        # 3. Delete users
        db.query(User).filter(User.id.in_(user_ids)).delete(
            synchronize_session=False
        )

        db.commit()
        print(f"Successfully purged {purged_count} non-admin user(s). Primary admin '{keep_email}' retained.")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Tournament Tracker management CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    create_admin_parser = subparsers.add_parser("create-admin", help="Create or promote an administrator account")
    create_admin_parser.add_argument("email", help="Administrator email address")
    create_admin_parser.add_argument("password", help="Administrator password")
    create_admin_parser.add_argument("--nickname", default="admin", help="Administrator nickname")

    subparsers.add_parser("purge-users", help="Purge all non-admin users, unlinking players and removing tokens")

    args = parser.parse_args()
    if args.command == "create-admin":
        create_admin(args.email, args.password, args.nickname)
    elif args.command == "purge-users":
        purge_users()


if __name__ == "__main__":
    main()
