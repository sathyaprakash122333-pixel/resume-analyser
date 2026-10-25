from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, profile, career_targets, analyses, dashboard

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="ResumeIQ Backend Service — AI-powered resume analysis and career tracking.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for configured origins and local development hosts
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api/v1 prefix
app.include_router(health.router, prefix=settings.api_v1_prefix, tags=["Health"])
app.include_router(profile.router, prefix=settings.api_v1_prefix, tags=["Profile"])
app.include_router(career_targets.router, prefix=settings.api_v1_prefix, tags=["Career Targets"])
app.include_router(analyses.router, prefix=settings.api_v1_prefix, tags=["Resume Analysis"])
app.include_router(dashboard.router, prefix=settings.api_v1_prefix, tags=["Dashboard"])


@app.get("/", summary="API Root")
async def root():
    """
    Root endpoint providing basic API metadata and service pointers.
    """
    return {
        "name": settings.app_name,
        "environment": settings.app_env,
        "version": "1.0.0",
        "docs": "/docs",
        "health": f"{settings.api_v1_prefix}/health"
    }
