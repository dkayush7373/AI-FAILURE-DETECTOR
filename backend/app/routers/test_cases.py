from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TestCase
from app.schemas import TestCaseCreate, TestCaseUpdate, TestCaseResponse

router = APIRouter(prefix="/test-cases", tags=["Test Cases"])

@router.get("", response_model=List[TestCaseResponse])
def list_test_cases(
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search in name or prompt"),
    db: Session = Depends(get_db)
):
    query = db.query(TestCase)
    if category:
        query = query.filter(TestCase.category == category)
    if priority:
        query = query.filter(TestCase.priority == priority)
    if search:
        query = query.filter(
            (TestCase.name.ilike(f"%{search}%")) |
            (TestCase.input_prompt.ilike(f"%{search}%"))
        )
    return query.order_by(TestCase.id.asc()).all()

@router.post("", response_model=TestCaseResponse, status_code=201)
def create_test_case(tc_in: TestCaseCreate, db: Session = Depends(get_db)):
    existing = db.query(TestCase).filter(TestCase.id == tc_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Test case with ID '{tc_in.id}' already exists")

    new_tc = TestCase(**tc_in.dict())
    db.add(new_tc)
    db.commit()
    db.refresh(new_tc)
    return new_tc

@router.get("/{test_case_id}", response_model=TestCaseResponse)
def get_test_case(test_case_id: str, db: Session = Depends(get_db)):
    tc = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")
    return tc

@router.put("/{test_case_id}", response_model=TestCaseResponse)
def update_test_case(test_case_id: str, tc_update: TestCaseUpdate, db: Session = Depends(get_db)):
    tc = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    update_data = tc_update.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(tc, field, val)

    db.commit()
    db.refresh(tc)
    return tc

@router.delete("/{test_case_id}")
def delete_test_case(test_case_id: str, db: Session = Depends(get_db)):
    tc = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")
    db.delete(tc)
    db.commit()
    return {"status": "deleted", "id": test_case_id}
