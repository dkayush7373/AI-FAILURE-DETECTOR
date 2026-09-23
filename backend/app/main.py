from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.models import Agent, TestCase, EvaluationRun
from app.seed_data import seed_database
from app.routers import agents, test_cases, evaluations, results, failures, analytics, reports

# Path to built frontend assets
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and auto-seed database
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Failure Detector - AI Quality Assurance and Reliability Testing Laboratory API",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
api_prefix = "/api"
app.include_router(agents.router, prefix=api_prefix)
app.include_router(test_cases.router, prefix=api_prefix)
app.include_router(evaluations.router, prefix=api_prefix)
app.include_router(results.router, prefix=api_prefix)
app.include_router(failures.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)

@app.get("/api")
def api_root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "api": "/api"
    }

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    agents_count = db.query(Agent).count()
    test_cases_count = db.query(TestCase).count()
    runs_count = db.query(EvaluationRun).count()

    return {
        "status": "healthy",
        "database": "connected",
        "demo_mode": settings.DEMO_MODE,
        "stats": {
            "agents": agents_count,
            "test_cases": test_cases_count,
            "evaluation_runs": runs_count
        }
    }

# Mount Vite static assets if dist exists
assets_dir = FRONTEND_DIST / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

@app.get("/")
async def root():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.is_file():
        return FileResponse(str(index_file))
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "api": "/api",
        "message": "Frontend build not found. Run 'npm run build' in /frontend directory."
    }

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Do not intercept API, docs, or OpenAPI schemas
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    file_path = FRONTEND_DIST / full_path
    if full_path and file_path.is_file():
        return FileResponse(str(file_path))
    
    index_file = FRONTEND_DIST / "index.html"
    if index_file.is_file():
        return FileResponse(str(index_file))
    
    raise HTTPException(status_code=404, detail="Page not found")

