import os
from pathlib import Path
from typing import List, Set

DEFAULT_DEV_SECRET = "qflux_scientific_secret_key_change_in_production_2026"

class Settings:
    PROJECT_NAME: str = "Q-FLUX API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/q_flux.db")
    REPORTS_DIR: Path = BASE_DIR / "generated_reports"
    UPLOAD_DIR: Path = BASE_DIR / "uploads"

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
    IS_PRODUCTION: bool = ENVIRONMENT in ["production", "prod"]

    # Security & Auth
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Upload restrictions
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(25 * 1024 * 1024)))  # 25 MB
    ALLOWED_EXTENSIONS: Set[str] = {".pdf", ".txt", ".md", ".csv"}
    ALLOWED_MIME_TYPES: Set[str] = {
        "application/pdf",
        "text/plain",
        "text/markdown",
        "text/csv",
        "application/vnd.ms-excel",
        "application/octet-stream"
    }

    def __init__(self):
        self.ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
        self.IS_PRODUCTION = self.ENVIRONMENT in ["production", "prod"]

        # Validate JWT Secret Key
        env_secret = os.getenv("SECRET_KEY")
        if self.IS_PRODUCTION:
            if not env_secret or env_secret == DEFAULT_DEV_SECRET:
                raise ValueError(
                    "Insecure SECRET_KEY: Production mode requires a dedicated SECRET_KEY "
                    "set in the environment. Default development secret is prohibited."
                )
            if len(env_secret) < 32:
                raise ValueError(
                    "Insecure SECRET_KEY: Production SECRET_KEY must be at least 32 characters long."
                )
            self.SECRET_KEY = env_secret
        else:
            self.SECRET_KEY = env_secret or DEFAULT_DEV_SECRET

        # Configure CORS
        cors_env = os.getenv("CORS_ORIGINS")
        if self.IS_PRODUCTION:
            if cors_env:
                origins = [orig.strip() for orig in cors_env.split(",") if orig.strip()]
            else:
                origins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8081"]
            if "*" in origins:
                raise ValueError(
                    "Insecure CORS: Wildcard '*' origin is prohibited in production mode."
                )
            self.CORS_ORIGINS: List[str] = origins
        else:
            if cors_env:
                self.CORS_ORIGINS = [orig.strip() for orig in cors_env.split(",") if orig.strip()]
            else:
                self.CORS_ORIGINS = ["*"]

settings = Settings()
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
