import os
from pathlib import Path
from typing import List

class Settings:
    PROJECT_NAME: str = "Q-FLUX API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/q_flux.db")
    REPORTS_DIR: Path = BASE_DIR / "generated_reports"
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
