"""Unit tests specifically covering Lab 4 requirements and security fixes:
1. Strict JWT signature verification and rejection of forged/tampered tokens.
2. Two-token flow: Access Token (JWT) + Refresh Token.
3. Refresh token verification, refresh rotation/exchange, and rejection of invalid/revoked tokens.
4. User logout and session revocation.
5. Admin authorization strictly bound to verified email, never nickname.
6. Safe file uploads: SVG rejection and Pillow magic bytes verification.
"""

import base64
import datetime
import os
import sys
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import models
from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    ensure_admin,
    hash_refresh_token,
    is_user_admin,
    verify_refresh_token,
    revoke_refresh_token,
)
from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.seed import seed_if_empty


class TestLab4SecurityAndAuth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.Session = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        Base.metadata.create_all(bind=self.engine)
        self.db = self.Session()
        ensure_admin(self.db)
        seed_if_empty(self.db)

        def override_get_db():
            try:
                yield self.db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_01_signature_verification_and_tampering_rejection(self):
        """Tokens with modified payload, forged sub, or wrong secret must be rejected."""
        valid_token = create_access_token(user_id=1, email="admin@local.com", nickname="admin", is_admin=True)
        payload = decode_access_token(valid_token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload.get("sub"), "1")

        # Tampering with payload segment
        parts = valid_token.split(".")
        self.assertEqual(len(parts), 3)

        fake_payload_b64 = base64.urlsafe_b64encode(
            b'{"sub":"999","email":"admin@local.com","nickname":"admin","is_admin":true,"type":"access","exp":9999999999}'
        ).decode().rstrip("=")

        tampered_token = f"{parts[0]}.{fake_payload_b64}.{parts[2]}"
        self.assertIsNone(decode_access_token(tampered_token))

        # Two-segment token or garbage token must be rejected
        self.assertIsNone(decode_access_token(f"{fake_payload_b64}.fake_sig"))
        self.assertIsNone(decode_access_token("completely.invalid.token"))

    def test_02_refresh_token_issuance_and_exchange(self):
        """Login issues access_token and refresh_token; refresh endpoint exchanges valid refresh token."""
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "admin@local.com", "password": "admin"},
        )
        self.assertEqual(login_res.status_code, 200)
        body = login_res.json()
        access_token = body.get("access_token")
        refresh_token = body.get("refresh_token")
        self.assertIsNotNone(access_token)
        self.assertIsNotNone(refresh_token)

        # Exchange refresh token
        ref_res = self.client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        self.assertEqual(ref_res.status_code, 200)
        new_body = ref_res.json()
        new_access = new_body.get("access_token")
        self.assertIsNotNone(new_access)

        # Verify access token works on protected route
        me_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_access}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "admin@local.com")

    def test_03_logout_revokes_refresh_token(self):
        """Logout endpoint is public (no Bearer token required), idempotent, and revokes refresh token."""
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "admin@local.com", "password": "admin"},
        )
        token_data = login_res.json()
        refresh_token = token_data["refresh_token"]

        # Logout WITHOUT Bearer token
        logout_res = self.client.post(
            "/api/auth/logout",
            json={"refresh_token": refresh_token},
        )
        self.assertEqual(logout_res.status_code, 200)
        self.assertEqual(logout_res.json().get("detail"), "Logged out successfully")

        # Second logout call with same token must also return 200 (idempotent)
        logout_repeat = self.client.post(
            "/api/auth/logout",
            json={"refresh_token": refresh_token},
        )
        self.assertEqual(logout_repeat.status_code, 200)

        # Attempt to use revoked refresh token must fail with 401
        ref_fail = self.client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        self.assertEqual(ref_fail.status_code, 401)
        self.assertIn("Invalid, expired, or revoked", ref_fail.json()["detail"])

    def test_04_admin_check_strictly_email_never_nickname(self):
        """Admin status is strictly determined by User.is_admin from DB. Registration never grants admin, and admin duplicate returns 409."""
        # 1. Attempting to register admin@local.com must return 409 Conflict
        conflict_res = self.client.post(
            "/api/auth/register",
            json={"email": "admin@local.com", "nickname": "fake_admin", "password": "securePass123"},
        )
        self.assertEqual(conflict_res.status_code, 409)

        # 2. Registering with admin-like emails/nicknames must always result in is_admin=False
        for test_email in ["admin@example.org", "superadmin@domain.com", "root@admin.com"]:
            reg_res = self.client.post(
                "/api/auth/register",
                json={"email": test_email, "nickname": f"nick_{test_email}", "password": "securePass123"},
            )
            self.assertEqual(reg_res.status_code, 201)
            user_data = reg_res.json()
            self.assertFalse(user_data["is_admin"])

        # 3. is_user_admin function checks user.is_admin field
        class DummyUser:
            def __init__(self, is_admin):
                self.is_admin = is_admin

        self.assertFalse(is_user_admin(DummyUser(False)))
        self.assertTrue(is_user_admin(DummyUser(True)))
        self.assertFalse(is_user_admin(None))

    def test_05_file_upload_svg_rejection_and_magic_bytes(self):
        """Uploading SVG images or fake non-image files must be rejected with 400 Bad Request."""
        # 1. SVG upload rejection
        svg_b64 = "data:image/svg+xml;base64," + base64.b64encode(b"<svg><script>alert(1)</script></svg>").decode()
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "admin@local.com", "password": "admin"},
        )
        admin_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        res = self.client.post(
            "/api/teams/1/logo",
            json={"image_base64": svg_b64},
            headers=admin_headers,
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("SVG format is disallowed", res.json()["detail"])

        # 2. Fake image bytes rejection
        fake_b64 = "data:image/png;base64," + base64.b64encode(b"this is plain text not an image").decode()
        res_fake = self.client.post(
            "/api/teams/1/logo",
            json={"image_base64": fake_b64},
            headers=admin_headers,
        )
        self.assertEqual(res_fake.status_code, 400)
        self.assertIn("not a valid raster image", res_fake.json()["detail"])

    def test_06_expired_and_fake_refresh_tokens(self):
        """Expired or fake refresh tokens must be rejected with 401 Unauthorized."""
        # 1. Non-existent / fake token
        res_fake = self.client.post("/api/auth/refresh", json={"refresh_token": "non_existent_fake_refresh_token"})
        self.assertEqual(res_fake.status_code, 401)

        # 2. Expired token
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "admin@local.com", "password": "admin"},
        )
        refresh_token = login_res.json()["refresh_token"]

        # Manually expire the token in database
        h = hash_refresh_token(refresh_token)
        token_record = self.db.query(models.RefreshToken).filter(models.RefreshToken.token_hash == h).first()
        self.assertIsNotNone(token_record)
        token_record.expires_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) - datetime.timedelta(days=1)
        self.db.commit()

        res_expired = self.client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        self.assertEqual(res_expired.status_code, 401)

    def test_07_token_rotation_and_revoked_token_reuse_detection(self):
        """Token rotation issues new refresh token; replaying revoked token returns 401 and revokes family."""
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "admin@local.com", "password": "admin"},
        )
        refresh_1 = login_res.json()["refresh_token"]

        # First refresh: succeeds and rotates
        ref1_res = self.client.post("/api/auth/refresh", json={"refresh_token": refresh_1})
        self.assertEqual(ref1_res.status_code, 200)
        refresh_2 = ref1_res.json()["refresh_token"]
        self.assertNotEqual(refresh_1, refresh_2)

        # Attempt to reuse refresh_1 (already revoked by rotation)
        replay_res = self.client.post("/api/auth/refresh", json={"refresh_token": refresh_1})
        self.assertEqual(replay_res.status_code, 401)

        # Token reuse detection should have invalidated all user tokens, so refresh_2 also fails
        ref2_res = self.client.post("/api/auth/refresh", json={"refresh_token": refresh_2})
        self.assertEqual(ref2_res.status_code, 401)

    def test_08_inactive_user_cannot_login_or_refresh(self):
        """Deactivated user account (is_active=False) cannot log in or exchange refresh tokens."""
        # Register user and get initial tokens
        reg_res = self.client.post(
            "/api/auth/register",
            json={"email": "inactive_test@local.com", "nickname": "inact_test", "password": "securePass123"},
        )
        self.assertEqual(reg_res.status_code, 201)

        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "inactive_test@local.com", "password": "securePass123"},
        )
        self.assertEqual(login_res.status_code, 200)
        refresh_token = login_res.json()["refresh_token"]

        # Deactivate user
        user = self.db.query(models.User).filter(models.User.email == "inactive_test@local.com").first()
        self.assertIsNotNone(user)
        user.is_active = False
        self.db.commit()

        # Cannot login
        login_blocked = self.client.post(
            "/api/auth/login",
            json={"email": "inactive_test@local.com", "password": "securePass123"},
        )
        self.assertEqual(login_blocked.status_code, 401)

        # Cannot refresh
        ref_blocked = self.client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        self.assertEqual(ref_blocked.status_code, 401)

    def test_09_non_admin_cannot_create_tournament(self):
        """Regular user (is_admin=False) gets 403 Forbidden when trying to create tournaments."""
        reg_res = self.client.post(
            "/api/auth/register",
            json={"email": "regular_player@local.com", "nickname": "regular_guy", "password": "securePass123"},
        )
        self.assertEqual(reg_res.status_code, 201)

        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "regular_player@local.com", "password": "securePass123"},
        )
        regular_token = login_res.json()["access_token"]

        tourney_payload = {
            "title": "Unauthorized Cup",
            "prize_pool": "$10,000",
            "start_date": "2026-06-01",
            "end_date": "2026-06-05",
            "status": "Upcoming",
            "location": "Online",
            "bracket_type": "single_elimination",
        }

        # Regular user attempt -> 403
        post_res = self.client.post(
            "/api/tournaments",
            json=tourney_payload,
            headers={"Authorization": f"Bearer {regular_token}"},
        )
        self.assertEqual(post_res.status_code, 403)

        # Admin attempt -> 201
        admin_login = self.client.post(
            "/api/auth/login",
            json={"email": "admin@local.com", "password": "admin"},
        )
        admin_token = admin_login.json()["access_token"]
        admin_post = self.client.post(
            "/api/tournaments",
            json=tourney_payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(admin_post.status_code, 201)
