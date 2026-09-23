from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import EvaluationRun, TestResult, Failure, TestCase, Agent

class ReportService:
    """Generates structured executive QA reports, markdown exports, and CI/CD audit logs."""

    def generate_markdown_report(self, db: Session, run_id: str) -> str:
        run = db.query(EvaluationRun).filter(EvaluationRun.id == run_id).first()
        if not run:
            return "# Error: Evaluation Run Not Found\n"

        agent_name = run.agent.name if run.agent else "Unknown Agent"
        agent_model = run.agent.model if run.agent else "N/A"
        date_str = run.started_at.strftime("%Y-%m-%d %H:%M:%S UTC") if run.started_at else "N/A"

        results = db.query(TestResult).filter(TestResult.run_id == run_id).all()
        failures = db.query(Failure).join(TestResult).filter(TestResult.run_id == run_id).all()

        # Grade assignment based on success rate
        if run.success_rate >= 95.0:
            grade = "A+ (Production Ready)"
            grade_color = "🟢"
        elif run.success_rate >= 85.0:
            grade = "B (Minor Anomalies)"
            grade_color = "🟡"
        elif run.success_rate >= 70.0:
            grade = "C (Degraded Reliability)"
            grade_color = "🟠"
        else:
            grade = "F (Unstable / Critical Vulnerabilities)"
            grade_color = "🔴"

        md = []
        md.append(f"# 🧪 AI RELIABILITY & FAILURE LAB REPORT")
        md.append(f"**Run ID:** `{run.id}`  ")
        md.append(f"**Target Agent:** `{agent_name}` (`{agent_model}`)  ")
        md.append(f"**Execution Timestamp:** {date_str}  ")
        md.append(f"**Reliability Grade:** {grade_color} **{grade}**  \n")
        md.append("---")

        md.append("## 1. Executive Summary")
        md.append(f"- **Overall Reliability Score:** **{run.success_rate}%**")
        md.append(f"- **Total Tests Evaluated:** {run.total_tests}")
        md.append(f"- **Tests Passed:** {run.passed} ✅")
        md.append(f"- **Tests Failed:** {run.failed} ❌")
        md.append(f"- **Total Token/API Cost:** ${run.total_cost:.5f}")
        md.append(f"- **Detected Failure Anomalies:** {len(failures)}")
        md.append("")

        md.append("## 2. Benchmark Metrics Matrix")
        md.append("| Metric | Value | Target SLA | Status |")
        md.append("| :--- | :--- | :--- | :--- |")
        md.append(f"| Success Rate | **{run.success_rate}%** | >= 90.0% | {'✅ Pass' if run.success_rate >= 90 else '❌ Fail'} |")
        avg_lat = (sum(r.response_time for r in results) / len(results)) if results else 0.0
        md.append(f"| Avg Latency | **{avg_lat:.2f}s** | <= 4.00s | {'✅ Pass' if avg_lat <= 4.0 else '⚠️ Warning'} |")
        avg_steps = (sum(r.steps_used for r in results) / len(results)) if results else 0.0
        md.append(f"| Avg Step Depth | **{avg_steps:.1f}** | <= 5.0 steps | {'✅ Pass' if avg_steps <= 5.0 else '⚠️ High'} |")
        md.append(f"| Evaluated Test Cases | **{len(results)}** | Full Suite (25) | {'✅ Complete' if len(results) >= 25 else 'ℹ️ Partial'} |")
        md.append("")

        if failures:
            md.append("## 3. Detected Failures & Remediation Action Items")
            md.append("Below are the failure modes detected during evaluation, with evidence and recommended engineering fixes:\n")
            for idx, f in enumerate(failures, 1):
                res = f.test_result
                tc = res.test_case if res else None
                tc_name = tc.name if tc else "Unknown Test"
                tc_id = tc.id if tc else "N/A"

                md.append(f"### {idx}. [{f.severity}] {f.category} in `{tc_id}`: {tc_name}")
                md.append(f"- **Description:** {f.description}")
                md.append(f"- **Observed Evidence:**")
                md.append(f"  > `{f.evidence or 'N/A'}`")
                md.append(f"- **Prescriptive Developer Fix:**")
                md.append(f"  `💡 {f.suggested_fix or 'No automated fix suggested.'}`\n")
        else:
            md.append("## 3. Detected Failures")
            md.append("🎉 **Zero failure modes detected.** All executed test cases met the required success criteria.\n")

        md.append("## 4. Complete Test Case Execution Log")
        md.append("| Test ID | Name | Category | Status | Latency | Steps | Cost |")
        md.append("| :--- | :--- | :--- | :---: | :---: | :---: | :---: |")
        for r in results:
            tc = r.test_case
            name = tc.name if tc else r.test_case_id
            cat = tc.category if tc else "-"
            stat = "✅ PASS" if r.status == "PASS" else "❌ FAIL"
            md.append(f"| `{r.test_case_id}` | {name} | {cat} | {stat} | {r.response_time:.2f}s | {r.steps_used} | ${r.estimated_cost:.5f} |")

        md.append("\n---\n*Report generated automatically by AI Failure Detector Lab Engine.*")
        return "\n".join(md)

    def generate_json_report(self, db: Session, run_id: str) -> Dict[str, Any]:
        run = db.query(EvaluationRun).filter(EvaluationRun.id == run_id).first()
        if not run:
            return {"error": "Run not found"}

        results = db.query(TestResult).filter(TestResult.run_id == run_id).all()
        failures = db.query(Failure).join(TestResult).filter(TestResult.run_id == run_id).all()

        return {
            "schema_version": "1.0.0",
            "report_type": "AI_QA_EVALUATION_REPORT",
            "run": {
                "id": run.id,
                "agent_id": run.agent_id,
                "agent_name": run.agent.name if run.agent else "Unknown",
                "model": run.agent.model if run.agent else "Unknown",
                "started_at": run.started_at.isoformat() if run.started_at else None,
                "completed_at": run.completed_at.isoformat() if run.completed_at else None,
                "metrics": {
                    "total_tests": run.total_tests,
                    "passed": run.passed,
                    "failed": run.failed,
                    "success_rate": run.success_rate,
                    "total_cost_usd": run.total_cost
                }
            },
            "failures": [
                {
                    "test_case_id": f.test_result.test_case_id if f.test_result else None,
                    "category": f.category,
                    "severity": f.severity,
                    "description": f.description,
                    "evidence": f.evidence,
                    "suggested_fix": f.suggested_fix
                }
                for f in failures
            ],
            "results": [
                {
                    "test_case_id": r.test_case_id,
                    "test_name": r.test_case.name if r.test_case else None,
                    "status": r.status,
                    "steps_used": r.steps_used,
                    "response_time_seconds": r.response_time,
                    "token_usage": r.token_usage,
                    "estimated_cost_usd": r.estimated_cost,
                    "step_traces": [
                        {
                            "step_number": s.step_number,
                            "action": s.action,
                            "tool": s.tool,
                            "status": s.status,
                            "duration_seconds": s.duration
                        }
                        for s in r.agent_steps
                    ]
                }
                for r in results
            ]
        }

report_service = ReportService()
