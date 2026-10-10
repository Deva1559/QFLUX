import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.db.session import SessionLocal, Base, engine
from app.services.seed_service import seed_service

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding database with verified literature records and sample project...")
        seed_service.seed_database(db)
        print("Database seeded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
