from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine, Base, SessionLocal
from app.services.seed_service import seed_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed initial literature data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_service.seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Q-FLUX: Quantum-Guided PFAS Destruction and Fluorine Recovery.\n"
        "Research and evidence-analysis workbench integrating hybrid quantum eigensolver (VQE) "
        "benchmarks, fluorine mass-balance accounting, and peer-reviewed degradation evidence."
    ),
    lifespan=lifespan
)

# CORS configuration explicitly honoring configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True if settings.CORS_ORIGINS != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to Q-FLUX Research API",
        "docs_url": "/docs",
        "api_v1_prefix": settings.API_V1_STR,
        "governance": "Research prototype only. The quantum benchmark validates algorithm workflow on a toy model."
    }
