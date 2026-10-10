import sys
from pathlib import Path

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.db.session import engine, Base
from app.models import (
    Project, EvidenceRecord, Pathway, PathwayStep, QuantumRun,
    FluorineBalanceScenario, ResearchInsight, Report, ApplicationSetting
)

def init_database():
    print(f"Creating all SQLite tables using engine: {engine.url}")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_database()
