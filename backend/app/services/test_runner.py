import datetime
import uuid
import asyncio
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import Agent, TestCase, EvaluationRun, TestResult, Failure, AgentStep
from app.services.agent_runner import agent_runner
from app.services.evaluation_service import evaluation_service
from app.services.failure_detector import failure_detector

# Global in-memory progress registry for active runs
RUN_PROGRESS: Dict[str, Dict[str, Any]] = {}

class TestRunner:
    """Orchestrates test case executions, evaluation checks, and progress tracking."""

    def get_progress(self, run_id: str) -> Optional[Dict[str, Any]]:
        return RUN_PROGRESS.get(run_id)

    async def run_evaluation(
        self,
        db: Session,
        agent_id: str,
        test_case_ids: Optional[List[str]] = None,
        simulate_failures: Optional[bool] = None
    ) -> EvaluationRun:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise ValueError(f"Agent with ID '{agent_id}' not found")

        # Select test cases
        query = db.query(TestCase)
        if test_case_ids and len(test_case_ids) > 0:
            query = query.filter(TestCase.id.in_(test_case_ids))
        test_cases = query.all()

        if not test_cases:
            raise ValueError("No test cases selected or found to run")

        run_id = f"run-{uuid.uuid4().hex[:8]}"
        started_at = datetime.datetime.utcnow()

        eval_run = EvaluationRun(
            id=run_id,
            agent_id=agent.id,
            started_at=started_at,
            completed_at=None,
            total_tests=len(test_cases),
            passed=0,
            failed=0,
            success_rate=0.0,
            total_cost=0.0
        )
        db.add(eval_run)
        db.commit()

        # Initialize progress tracker
        RUN_PROGRESS[run_id] = {
            "run_id": run_id,
            "agent_id": agent.id,
            "agent_name": agent.name,
            "status": "RUNNING",
            "total_tests": len(test_cases),
            "completed_tests": 0,
            "passed": 0,
            "failed": 0,
            "current_test_id": test_cases[0].id,
            "current_test_name": test_cases[0].name,
            "progress_percentage": 0.0,
            "recent_results": []
        }

        # Convert agent and test cases to dicts for thread safety
        agent_dict = {
            "id": agent.id,
            "name": agent.name,
            "endpoint": agent.endpoint,
            "model": agent.model,
            "max_steps": agent.max_steps,
            "max_response_time": agent.max_response_time
        }

        total_cost = 0.0
        passed_count = 0
        failed_count = 0

        for index, tc in enumerate(test_cases):
            tc_dict = {
                "id": tc.id,
                "name": tc.name,
                "category": tc.category,
                "input_prompt": tc.input_prompt,
                "expected_outcome": tc.expected_outcome,
                "success_criteria": tc.success_criteria,
                "max_steps": tc.max_steps,
                "max_time": tc.max_time,
                "priority": tc.priority
            }

            # Update live tracker
            RUN_PROGRESS[run_id]["current_test_id"] = tc.id
            RUN_PROGRESS[run_id]["current_test_name"] = tc.name

            # Execute agent
            exec_result = await agent_runner.execute(
                agent_dict=agent_dict,
                test_case_dict=tc_dict,
                force_failure=simulate_failures
            )

            # Evaluate verdict
            verdict = evaluation_service.evaluate(tc_dict, exec_result)

            status = "PASS" if verdict.is_passed else "FAIL"
            if verdict.is_passed:
                passed_count += 1
            else:
                failed_count += 1

            total_cost += exec_result.estimated_cost

            # Record TestResult
            res_id = f"res-{run_id}-{tc.id}"
            test_result = TestResult(
                id=res_id,
                run_id=run_id,
                test_case_id=tc.id,
                status=status,
                response=exec_result.response,
                steps_used=exec_result.steps_used,
                response_time=exec_result.response_time,
                token_usage=exec_result.token_usage,
                estimated_cost=exec_result.estimated_cost,
                created_at=datetime.datetime.utcnow()
            )
            db.add(test_result)
            db.flush()

            # Record Agent Steps
            for step in exec_result.steps:
                db.add(AgentStep(
                    id=f"step-{res_id}-{step.step_number}",
                    test_result_id=res_id,
                    step_number=step.step_number,
                    action=step.action,
                    tool=step.tool,
                    status=step.status,
                    duration=step.duration
                ))

            # Record Failure if failed
            failure_info = None
            if not verdict.is_passed:
                diagnosis = failure_detector.diagnose(
                    test_case_dict=tc_dict,
                    exec_response=exec_result.response,
                    failure_reasons=verdict.failure_reasons,
                    priority=tc.priority
                )
                db.add(Failure(
                    id=f"fail-{res_id}",
                    test_result_id=res_id,
                    category=diagnosis.category,
                    severity=diagnosis.severity,
                    description=diagnosis.description,
                    evidence=diagnosis.evidence,
                    suggested_fix=diagnosis.suggested_fix
                ))
                failure_info = {
                    "category": diagnosis.category,
                    "severity": diagnosis.severity,
                    "description": diagnosis.description
                }

            db.commit()

            # Update progress tracker
            completed = index + 1
            pct = round((completed / len(test_cases)) * 100, 1)
            RUN_PROGRESS[run_id]["completed_tests"] = completed
            RUN_PROGRESS[run_id]["passed"] = passed_count
            RUN_PROGRESS[run_id]["failed"] = failed_count
            RUN_PROGRESS[run_id]["progress_percentage"] = pct
            RUN_PROGRESS[run_id]["recent_results"].insert(0, {
                "test_id": tc.id,
                "test_name": tc.name,
                "status": status,
                "latency": exec_result.response_time,
                "failure": failure_info
            })
            # keep recent results bounded
            RUN_PROGRESS[run_id]["recent_results"] = RUN_PROGRESS[run_id]["recent_results"][:10]

            # Brief non-blocking yield so other async handlers / endpoints stay responsive
            await asyncio.sleep(0.05)

        # Finalize run
        completed_at = datetime.datetime.utcnow()
        success_rate = round((passed_count / len(test_cases)) * 100, 1) if test_cases else 0.0

        eval_run.completed_at = completed_at
        eval_run.passed = passed_count
        eval_run.failed = failed_count
        eval_run.success_rate = success_rate
        eval_run.total_cost = round(total_cost, 5)
        db.commit()

        RUN_PROGRESS[run_id]["status"] = "COMPLETED"
        RUN_PROGRESS[run_id]["success_rate"] = success_rate

        return eval_run

test_runner = TestRunner()
