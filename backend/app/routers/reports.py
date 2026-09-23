from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{run_id}/markdown")
def get_markdown_report(run_id: str, db: Session = Depends(get_db)):
    md_content = report_service.generate_markdown_report(db=db, run_id=run_id)
    if "Error: Evaluation Run Not Found" in md_content:
        raise HTTPException(status_code=404, detail="Run not found")
    return Response(content=md_content, media_type="text/markdown")

@router.get("/{run_id}/json")
def get_json_report(run_id: str, db: Session = Depends(get_db)):
    json_data = report_service.generate_json_report(db=db, run_id=run_id)
    if "error" in json_data:
        raise HTTPException(status_code=404, detail=json_data["error"])
    return json_data
