from fastapi import APIRouter
from app.api.v1.endpoints import (
    health, projects, catalysts, chemistry, evidence, pathways,
    quantum, fluorine, prioritization, insights, reports, settings
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(catalysts.router, prefix="/catalysts", tags=["Catalysts"])
api_router.include_router(chemistry.router, prefix="/chemistry", tags=["Classical Chemistry"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["Evidence"])
api_router.include_router(pathways.router, prefix="/pathways", tags=["Pathways"])
api_router.include_router(quantum.router, prefix="/quantum", tags=["Quantum Benchmark"])
api_router.include_router(prioritization.router, prefix="/prioritization", tags=["Catalyst Prioritization"])
api_router.include_router(fluorine.router, prefix="/fluorine-balance", tags=["Fluorine Balance"])
api_router.include_router(insights.router, prefix="/insights", tags=["Research Insights"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
