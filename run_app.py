"""
AI Failure Detector - Unified Application Launcher
Serves both the Frontend React UI and Backend FastAPI API on http://localhost:8000
"""
import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
FRONTEND_DIST = FRONTEND_DIR / "dist"
BACKEND_DIR = ROOT_DIR / "backend"

def ensure_frontend_built():
    index_file = FRONTEND_DIST / "index.html"
    if not index_file.exists():
        print("[*] Building frontend assets...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_cmd, "run", "build"], cwd=str(FRONTEND_DIR), check=True)
        print("[+] Frontend build completed successfully.")

def main():
    ensure_frontend_built()
    
    # Add backend directory to sys.path
    sys.path.insert(0, str(BACKEND_DIR))
    
    import uvicorn
    print("\n=======================================================")
    print("  AI FAILURE DETECTOR - UNIFIED APPLICATION SERVER")
    print("=======================================================")
    print("  Website & Dashboard : http://localhost:8000")
    print("  Swagger API Docs    : http://localhost:8000/docs")
    print("  REST API Endpoints  : http://localhost:8000/api")
    print("=======================================================\n")
    
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, app_dir=str(BACKEND_DIR))

if __name__ == "__main__":
    main()
