import asyncio
import os
import sys

# Ensure UTF-8 output encoding on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("[*] Starting AI Failure Detector Backend Verification Suite...")
    with TestClient(app) as client:
        # 1. Test Root & Health
        r = client.get("/")
        assert r.status_code == 200, f"Root failed: {r.text}"
        print("[+] GET / returns 200 OK")

        r = client.get("/api/health")
        assert r.status_code == 200
        health = r.json()
        assert health["status"] == "healthy"
        assert health["database"] == "connected"
        print(f"[+] GET /api/health: {health['stats']}")

        # 2. Test Cases count
        r = client.get("/api/test-cases")
        assert r.status_code == 200
        test_cases = r.json()
        assert len(test_cases) >= 25, f"Expected at least 25 test cases, got {len(test_cases)}"
        print(f"[+] GET /api/test-cases: Successfully loaded {len(test_cases)} test cases (TC-001 to TC-025)")

        # 3. Agents
        r = client.get("/api/agents")
        assert r.status_code == 200
        agents = r.json()
        assert len(agents) >= 4, f"Expected at least 4 agents, got {len(agents)}"
        print(f"[+] GET /api/agents: Found {len(agents)} agents: {[a['name'] for a in agents]}")

        # 4. Evaluations list
        r = client.get("/api/evaluations")
        assert r.status_code == 200
        runs = r.json()
        assert len(runs) >= 3, f"Expected at least 3 historical evaluation runs, got {len(runs)}"
        print(f"[+] GET /api/evaluations: Found {len(runs)} evaluation runs")

        # 5. Failures list
        r = client.get("/api/failures")
        assert r.status_code == 200
        failures = r.json()
        assert len(failures) > 0, "Expected failure records from seed data"
        print(f"[+] GET /api/failures: Retrieved {len(failures)} diagnosed failure records with evidence & fixes")

        # 6. Analytics
        r = client.get("/api/analytics")
        assert r.status_code == 200
        analytics = r.json()
        assert "overall_success_rate" in analytics
        assert len(analytics["failure_categories"]) > 0
        assert len(analytics["category_stats"]) > 0
        print(f"[+] GET /api/analytics: Success Rate {analytics['overall_success_rate']}%, Avg Latency {analytics['avg_response_time']}s")

        # 7. Trigger a new evaluation run (single test case TC-001)
        print("[*] Triggering new evaluation run for TC-001 and TC-009...")
        payload = {
            "agent_id": agents[0]["id"],
            "test_case_ids": ["TC-001", "TC-009"]
        }
        r = client.post("/api/evaluations", json=payload)
        assert r.status_code == 201, f"Trigger run failed: {r.text}"
        new_run = r.json()
        assert new_run["total_tests"] == 2
        assert "id" in new_run
        print(f"[+] POST /api/evaluations: Successfully executed run '{new_run['id']}'. Passed: {new_run['passed']}, Failed: {new_run['failed']}")

        # 8. Report Generation
        r = client.get(f"/api/reports/{new_run['id']}/markdown")
        assert r.status_code == 200
        assert "AI RELIABILITY & FAILURE LAB REPORT" in r.text
        print("[+] GET /api/reports/:id/markdown: Markdown report generated successfully")

        r = client.get(f"/api/reports/{new_run['id']}/json")
        assert r.status_code == 200
        json_report = r.json()
        assert json_report["report_type"] == "AI_QA_EVALUATION_REPORT"
        print("[+] GET /api/reports/:id/json: Machine-readable JSON report generated successfully")

        print("\n[SUCCESS] ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
