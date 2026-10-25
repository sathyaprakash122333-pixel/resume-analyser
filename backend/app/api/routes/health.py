from fastapi import APIRouter
from app.core.config import settings
from app.core.database import check_db_connection

router = APIRouter()


@router.get("/health", summary="Health check endpoint")
async def health_check():
    """
    Returns the current operational status of the ResumeIQ API and database connectivity.
    Safe and non-sensitive: does not expose credentials or connection strings.
    """
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "app": settings.app_name,
        "environment": settings.app_env,
        "version": "1.0.0",
        "database": "connected" if db_ok else "disconnected"
    }
