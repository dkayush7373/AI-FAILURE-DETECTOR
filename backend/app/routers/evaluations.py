from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EvaluationRun, Agent
from app.schemas import EvaluationRunCreate, EvaluationRunResponse
from app.services.test_runner import test_runner

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])

@router.get("", response_model=List[EvaluationRunResponse])
def list_evaluations(db: Session = Depends(get_db)):
    return db.query(EvaluationRun).order_by(EvaluationRun.started_at.desc()).all()

@router.post("", response_model=EvaluationRunResponse, status_code=201)
async def trigger_evaluation(
    eval_in: EvaluationRunCreate,
    db: Session = Depends(get_db)
):
    try:
        eval_run = await test_runner.run_evaluation(
            db=db,
            agent_id=eval_in.agent_id,
            test_case_ids=eval_in.test_case_ids,
            simulate_failures=eval_in.simulate_failures
        )
        # Reload with relationships
        db.refresh(eval_run)
        return eval_run
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.get("/{run_id}", response_model=EvaluationRunResponse)
def get_evaluation(run_id: str, db: Session = Depends(get_db)):
    eval_run = db.query(EvaluationRun).filter(EvaluationRun.id == run_id).first()
    if not eval_run:
        raise HTTPException(status_code=404, detail="Evaluation run not found")
    return eval_run

@router.get("/{run_id}/progress")
def get_evaluation_progress(run_id: str):
    progress = test_runner.get_progress(run_id)
    if not progress:
        return {"run_id": run_id, "status": "UNKNOWN_OR_COMPLETED"}
    return progress
