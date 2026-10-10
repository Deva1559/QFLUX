import sys
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.main import app
from app.db.session import Base, engine, SessionLocal
from app.services.seed_service import seed_service

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_service.seed_database(db)
    finally:
        db.close()
    yield

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
