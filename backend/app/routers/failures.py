from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Failure, TestResult, TestCase
from app.schemas import FailureResponse

router = APIRouter(prefix="/failures", tags=["Failures"])

@router.get("")
def list_failures(
    category: Optional[str] = Query(None, description="Filter by failure category"),
    severity: Optional[str] = Query(None, description="Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)"),
    run_id: Optional[str] = Query(None, description="Filter by evaluation run ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Failure).join(TestResult)
    if category:
        query = query.filter(Failure.category == category)
    if severity:
        query = query.filter(Failure.severity == severity.upper())
    if run_id:
        query = query.filter(TestResult.run_id == run_id)

    failures = query.offset(offset).limit(limit).all()

    # Build rich response enriched with test case and result info
    results = []
    for f in failures:
        tr = f.test_result
        tc = tr.test_case if tr else None
        results.append({
            "id": f.id,
            "test_result_id": f.test_result_id,
            "category": f.category,
            "severity": f.severity,
            "description": f.description,
            "evidence": f.evidence,
            "suggested_fix": f.suggested_fix,
            "run_id": tr.run_id if tr else None,
            "test_case_id": tr.test_case_id if tr else None,
            "test_case_name": tc.name if tc else "Unknown",
            "test_case_category": tc.category if tc else "Unknown",
            "input_prompt": tc.input_prompt if tc else "",
            "response": tr.response if tr else "",
            "response_time": tr.response_time if tr else 0.0,
            "steps_used": tr.steps_used if tr else 0
        })

    return results
