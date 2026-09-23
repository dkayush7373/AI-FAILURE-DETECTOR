from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TestResult
from app.schemas import TestResultResponse

router = APIRouter(prefix="/results", tags=["Test Results"])

@router.get("", response_model=List[TestResultResponse])
def list_results(
    run_id: Optional[str] = Query(None, description="Filter by evaluation run ID"),
    status: Optional[str] = Query(None, description="Filter by PASS or FAIL"),
    test_case_id: Optional[str] = Query(None, description="Filter by test case ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(TestResult)
    if run_id:
        query = query.filter(TestResult.run_id == run_id)
    if status:
        query = query.filter(TestResult.status == status.upper())
    if test_case_id:
        query = query.filter(TestResult.test_case_id == test_case_id)

    return query.order_by(TestResult.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/{result_id}", response_model=TestResultResponse)
def get_result(result_id: str, db: Session = Depends(get_db)):
    res = db.query(TestResult).filter(TestResult.id == result_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Test result not found")
    return res
