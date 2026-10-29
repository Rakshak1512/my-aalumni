import pytest
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app import create_app
from app.config import Config


class TestConfig(Config):
    APP_ENV = 'testing'
    DEBUG = False
    TESTING = True
    FIREBASE_PROJECT_ID = 'test-myalumni-mock'
    ALLOWED_ORIGINS = ['http://localhost:5173']
    DEMO_SEEDING_ENABLED = True


@pytest.fixture
def app():
    app = create_app(TestConfig)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers():
    def _headers(role="student", uid="test_user_uid"):
        # For testing, we mock token decode in tests
        return {
            "Authorization": f"Bearer mock_token_for_{role}_{uid}",
            "Content-Type": "application/json"
        }
    return _headers

