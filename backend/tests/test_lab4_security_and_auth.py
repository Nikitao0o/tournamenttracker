"""Unit tests specifically covering Lab 4 requirements and security fixes:
1. Strict JWT signature verification and rejection of forged/tampered tokens.
2. Two-token flow: Access Token (JWT) + Refresh Token.
3. Refresh token verification, refresh rotation/exchange, and rejection of invalid/revoked tokens.
4. User logout and session revocation.
5. Admin authorization strictly bound to verified email, never nickname.
6. Safe file uploads: SVG rejection and Pillow magic bytes verification.
"""

import base64
import os
import sys
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    ensure_admin,
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
        """Logout endpoint revokes refresh token so subsequent refresh attempts fail."""
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "admin@local.com", "password": "admin"},
        )
        token_data = login_res.json()
        access_token = token_data["access_token"]
        refresh_token = token_data["refresh_token"]

        # Logout
        logout_res = self.client.post(
            "/api/auth/logout",
            json={"refresh_token": refresh_token},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(logout_res.status_code, 200)

        # Attempt to use revoked refresh token
        ref_fail = self.client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        self.assertEqual(ref_fail.status_code, 401)
        self.assertIn("Invalid, expired, or revoked", ref_fail.json()["detail"])

    def test_04_admin_check_strictly_email_never_nickname(self):
        """Admin status is strictly determined by User.is_admin from DB. Registration never grants admin, and admin duplicate returns 409."""
        # 1. Attempting to register admin@local.com must return 409 Conflict
        conflict_res = self.client.post(
            "/api/auth/register",
            json={"email": "admin@local.com", "nickname": "fake_admin", "password": "password123"},
        )
        self.assertEqual(conflict_res.status_code, 409)

        # 2. Registering with admin-like emails/nicknames must always result in is_admin=False
        for test_email in ["admin@tracker.local", "superadmin@domain.com", "root@admin.com"]:
            reg_res = self.client.post(
                "/api/auth/register",
                json={"email": test_email, "nickname": f"nick_{test_email}", "password": "password123"},
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
