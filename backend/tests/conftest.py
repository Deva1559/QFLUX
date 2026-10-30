import sys
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.main import app
from app.db.session import Base, engine, SessionLocal
from app.services.seed_service import seed_service

from sqlalchemy import text

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE document_chunks ADD COLUMN embedding_json TEXT"))
            conn.commit()
        except Exception:
            pass
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

@pytest.fixture
def db_session(db):
    return db

def get_auth_token(email: str = "researcher@qflux.org") -> str:
    from app.core.security import create_access_token
    return create_access_token({"sub": email})

def get_auth_headers(email: str = "researcher@qflux.org") -> dict:
    return {"Authorization": f"Bearer {get_auth_token(email)}"}

@pytest.fixture
def auth_headers():
    return get_auth_headers()
