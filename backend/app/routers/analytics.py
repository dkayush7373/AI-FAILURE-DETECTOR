from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AnalyticsSummary
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsSummary)
def get_analytics(
    run_id: Optional[str] = Query(None, description="Optional run ID to filter analytics"),
    db: Session = Depends(get_db)
):
    return analytics_service.get_summary_analytics(db=db, run_id=run_id)
