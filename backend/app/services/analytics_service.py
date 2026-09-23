from typing import Dict, Any, List
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import EvaluationRun, TestResult, Failure, TestCase, Agent
from app.services.failure_detector import FAILURE_CATEGORIES

class AnalyticsService:
    """Computes high-level KPIs, distributions, trends, and reliability diagnostics."""

    def get_summary_analytics(self, db: Session, run_id: str = None) -> Dict[str, Any]:
        runs_query = db.query(EvaluationRun)
        results_query = db.query(TestResult)
        failures_query = db.query(Failure)

        if run_id:
            runs_query = runs_query.filter(EvaluationRun.id == run_id)
            results_query = results_query.filter(TestResult.run_id == run_id)
            failures_query = failures_query.join(TestResult).filter(TestResult.run_id == run_id)

        runs = runs_query.order_by(EvaluationRun.started_at.asc()).all()
        results = results_query.all()
        failures = failures_query.all()

        total_runs = len(runs)
        total_tests_executed = len(results)
        overall_passed = sum(1 for r in results if r.status == "PASS")
        overall_failed = sum(1 for r in results if r.status == "FAIL")
        overall_success_rate = round((overall_passed / total_tests_executed * 100), 1) if total_tests_executed > 0 else 0.0

        avg_response_time = round(sum(r.response_time for r in results) / total_tests_executed, 2) if total_tests_executed > 0 else 0.0
        avg_steps_used = round(sum(r.steps_used for r in results) / total_tests_executed, 1) if total_tests_executed > 0 else 0.0
        total_cost = round(sum(r.estimated_cost for r in results), 4)

        # 1. Failure Categories Distribution
        cat_counts = defaultdict(int)
        for f in failures:
            cat_counts[f.category] += 1

        total_failures = len(failures)
        failure_categories = []
        for cat in FAILURE_CATEGORIES:
            cnt = cat_counts.get(cat, 0)
            pct = round((cnt / total_failures * 100), 1) if total_failures > 0 else 0.0
            failure_categories.append({
                "category": cat,
                "count": cnt,
                "percentage": pct
            })
        # Sort descending by count
        failure_categories.sort(key=lambda x: x["count"], reverse=True)

        # 2. Severity Breakdown
        sev_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for f in failures:
            sev = (f.severity or "MEDIUM").upper()
            if sev in sev_counts:
                sev_counts[sev] += 1
            else:
                sev_counts["MEDIUM"] += 1

        severity_breakdown = [
            {"severity": k, "count": v} for k, v in sev_counts.items()
        ]

        # 3. Category Stats (by Test Case Category)
        # Query results joined with TestCase
        cat_stats_map = defaultdict(lambda: {"total": 0, "passed": 0, "failed": 0})
        for r in results:
            cat_name = r.test_case.category if r.test_case else "General"
            cat_stats_map[cat_name]["total"] += 1
            if r.status == "PASS":
                cat_stats_map[cat_name]["passed"] += 1
            else:
                cat_stats_map[cat_name]["failed"] += 1

        category_stats = []
        for cat_name, stats in cat_stats_map.items():
            fail_rate = round((stats["failed"] / stats["total"] * 100), 1) if stats["total"] > 0 else 0.0
            category_stats.append({
                "category": cat_name,
                "total": stats["total"],
                "passed": stats["passed"],
                "failed": stats["failed"],
                "failure_rate": fail_rate
            })

        # 4. Reliability Trend (Over runs)
        reliability_trend = []
        for r in runs:
            agent_name = r.agent.name if r.agent else "Unknown Agent"
            reliability_trend.append({
                "run_id": r.id,
                "started_at": r.started_at.strftime("%b %d, %H:%M") if r.started_at else "",
                "success_rate": r.success_rate,
                "total_tests": r.total_tests,
                "passed": r.passed,
                "failed": r.failed,
                "agent_name": agent_name,
                "total_cost": r.total_cost
            })

        # 5. Flakiest / Most Vulnerable Test Cases
        tc_failure_map = defaultdict(lambda: {"id": "", "name": "", "category": "", "priority": "", "fails": 0, "total": 0})
        for r in results:
            tc_id = r.test_case_id
            tc_failure_map[tc_id]["id"] = tc_id
            tc_failure_map[tc_id]["name"] = r.test_case.name if r.test_case else tc_id
            tc_failure_map[tc_id]["category"] = r.test_case.category if r.test_case else "General"
            tc_failure_map[tc_id]["priority"] = r.test_case.priority if r.test_case else "MEDIUM"
            tc_failure_map[tc_id]["total"] += 1
            if r.status == "FAIL":
                tc_failure_map[tc_id]["fails"] += 1

        flakiest_tests = []
        for tc_id, d in tc_failure_map.items():
            if d["total"] > 0:
                f_rate = round((d["fails"] / d["total"]) * 100, 1)
                flakiest_tests.append({
                    "id": d["id"],
                    "name": d["name"],
                    "category": d["category"],
                    "priority": d["priority"],
                    "failure_count": d["fails"],
                    "total_runs": d["total"],
                    "failure_rate": f_rate
                })
        flakiest_tests.sort(key=lambda x: (x["failure_rate"], x["failure_count"]), reverse=True)

        return {
            "total_runs": total_runs,
            "total_tests_executed": total_tests_executed,
            "overall_passed": overall_passed,
            "overall_failed": overall_failed,
            "overall_success_rate": overall_success_rate,
            "avg_response_time": avg_response_time,
            "avg_steps_used": avg_steps_used,
            "total_cost": total_cost,
            "failure_categories": failure_categories,
            "severity_breakdown": severity_breakdown,
            "category_stats": category_stats,
            "reliability_trend": reliability_trend,
            "flakiest_tests": flakiest_tests[:8]
        }

analytics_service = AnalyticsService()
