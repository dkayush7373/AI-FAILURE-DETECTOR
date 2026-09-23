# 🧪 AI FAILURE DETECTOR
> **"Test AI. Failures. Improve reliability."**  
> An enterprise-grade AI Quality Assurance, Reliability Testing, and Observability Laboratory designed for AI developers, researchers, and engineers.

---

## 1. Overview & Purpose

**AI FAILURE DETECTOR** is a dedicated Quality Assurance and Reliability Laboratory that rigorously evaluates AI agent behavior against standardized benchmark suites. Rather than acting as a chatbot, it operates as an observability test rig that:
- Executes multi-step AI agents against a suite of 25 canonical test cases.
- Monitors step-by-step reasoning traces, tool invocations, latencies, and token costs.
- Automatically detects and categorizes failure modes across a standardized 10-category taxonomy.
- Computes reliability benchmarks (Success Rate %, MTBF, Fragility Index, Latency SLA adherence).
- Generates actionable, prescriptive developer remediation recommendations and exportable audit reports.

---

## 2. Technical Architecture & Services

The application follows a clean, decoupled architecture:

```
c:\PROJECTS\BCD\
├── backend/
│   ├── app/
│   │   ├── config.py                 # Application settings & environment configuration
│   │   ├── database.py               # SQLite engine, sessionmaker, Base ORM
│   │   ├── models.py                 # 6 Relational SQLAlchemy models
│   │   ├── schemas.py                # Typed Pydantic request/response schemas
│   │   ├── seed_data.py              # 25 canonical test cases & initial evaluations
│   │   ├── services/
│   │   │   ├── agent_runner.py       # Live HTTP agent invocation & realistic mock simulation
│   │   │   ├── evaluation_service.py # Criteria evaluation, regex, JSON/YAML & SLA validators
│   │   │   ├── failure_detector.py   # 10-category failure taxonomy & remediation engine
│   │   │   ├── test_runner.py        # Orchestrates test batches with real-time progress state
│   │   │   ├── analytics_service.py  # Aggregates KPIs, distributions, and trend histories
│   │   │   └── report_service.py     # Markdown and JSON executive lab report generator
│   │   ├── routers/
│   │   │   ├── agents.py             # /api/agents CRUD
│   │   │   ├── test_cases.py         # /api/test-cases CRUD
│   │   │   ├── evaluations.py        # /api/evaluations (trigger run, progress, inspect)
│   │   │   ├── results.py            # /api/results
│   │   │   ├── failures.py           # /api/failures
│   │   │   ├── analytics.py          # /api/analytics
│   │   │   └── reports.py            # /api/reports/:id/markdown and /json
│   │   └── main.py                   # FastAPI lifespan, CORS, health check
│   ├── requirements.txt
│   ├── run.py                        # Uvicorn entrypoint
│   └── test_backend.py               # Automated verification test suite
├── frontend/
│   ├── src/
│   │   ├── api/client.ts             # Typed API client
│   │   ├── types/index.ts            # TypeScript data contracts
│   │   ├── components/
│   │   │   ├── layout/               # Sidebar, Header, DemoModeBanner
│   │   │   ├── dashboard/            # MetricCards, PassFailChart, FailureCategoryChart, Trend
│   │   │   ├── test-cases/           # TestCaseList, TestCaseDrawer, TestCaseModal
│   │   │   ├── runner/               # RunnerControls, ExecutionProgress, ActiveTraceViewer
│   │   │   ├── evaluations/          # RunHistoryTable, RunDetailModal
│   │   │   ├── failures/             # FailureMatrix with severity pills & prescriptive fixes
│   │   │   ├── reports/              # LabReportView (Markdown & JSON export)
│   │   │   └── settings/             # SettingsView (Agent profiles & simulation toggle)
│   │   ├── App.tsx                   # Central lab dashboard shell
│   │   └── index.css                 # Dark developer observability theme & glassmorphism
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── .env.example
└── README.md
```

---

## 3. Core Database Schema (SQLite)

The SQLite database (`ai_failure_detector.db`) is structured with 6 normalized tables:

| Table | Description | Primary Key & Foreign Keys |
| :--- | :--- | :--- |
| **`agents`** | Evaluated AI agent profiles (models, limits, endpoints) | `id` (PK) |
| **`test_cases`** | Canonical benchmark tests (criteria, SLAs, priority) | `id` (PK, e.g. `TC-001`) |
| **`evaluation_runs`** | Test execution sessions with aggregate metrics | `id` (PK), `agent_id` (FK -> agents.id) |
| **`test_results`** | Individual test outcome (PASS/FAIL, latency, tokens, cost) | `id` (PK), `run_id` (FK), `test_case_id` (FK) |
| **`failures`** | Diagnosed failure records, evidence, and suggested fixes | `id` (PK), `test_result_id` (FK -> test_results.id) |
| **`agent_steps`** | Granular timeline steps (Action, Tool, Status, Duration) | `id` (PK), `test_result_id` (FK -> test_results.id) |

---

## 4. The 10 Failure Categories & Detection Taxonomy

Every failed test case is analyzed by `failure_detector.py` and classified into one of 10 standard categories:

1. **Incorrect Answer:** The output contradicts verifiable facts or mathematical calculations.
2. **Incomplete Response:** The agent halted early or omitted required sub-tasks or parameters.
3. **Tool Execution Failure:** The tool invocation threw an exception (HTTP 503, 403, network drop, unhandled error).
4. **Step Limit Exceeded:** The agent entered an infinite tool loop or cyclic reasoning path exceeding `max_steps`.
5. **Timeout:** The agent's response latency exceeded the test case's strict `max_time` SLA budget.
6. **Invalid Output Format:** Violated syntactic constraints (e.g. markdown code fence used when raw YAML was specified, or missing JSON keys).
7. **Hallucinated Claim:** Fabricated non-existent citations, ungrounded DOIs, or unverifiable claims.
8. **Error Handling Failure:** Crashed on malformed inputs (null bytes, binary blobs) or leaked instructions under injection pressure.
9. **Unclear Response:** Provided an evasive or speculative answer when clarification was required.
10. **Unknown Failure:** Unclassified runtime anomaly.

---

## 5. The 25 Canonical Predefined Test Cases Suite

The laboratory auto-seeds 25 test cases spanning 5 distinct domains:

### A. Basic Retrieval & Synthesis (TC-001 - TC-003)
- **TC-001:** *Basic Factual Retrieval* (Capital of France).
- **TC-002:** *Concise Technical Explanation* (Photosynthesis in exactly 2 sentences).
- **TC-003:** *Structured JSON Entity Output* (Software engineer profile with strict JSON schema).

### B. Complex Reasoning & Context (TC-004 - TC-006)
- **TC-004:** *Multi-Step Arithmetic & Coupon Logic* (Price, quantities, percentage discount deduction).
- **TC-005:** *Comparative Technical Architecture* (Rust vs Python memory management, borrow checker vs GC).
- **TC-006:** *Long-Context Meeting Action Item Extraction* (Transcript extraction with owners and deadlines).

### C. Edge Cases & Robustness (TC-007 - TC-012)
- **TC-007:** *Ambiguous Under-specified Prompt* ("How do I fix it?" - checks if agent asks for context).
- **TC-008:** *Missing Parameters Detection* (Mortgage calculation without interest rate or loan term).
- **TC-009:** *Negative Constraint Compliance* (Poem about rain with zero occurrences of the letter 'e').
- **TC-010:** *Empty Prompt Handling* (Zero-length prompt resilience).
- **TC-011:** *Prompt Injection & Null Byte Sanitization* (Translating payload containing injection directives).
- **TC-012:** *Buffer Pressure / High Token Density* (Querying dense policy text under token load).

### D. Tool Failures, Step Budgets & Latency (TC-013 - TC-020)
- **TC-013:** *External Tool HTTP 503 Fallback* (Weather API outage simulation).
- **TC-014:** *Empty Tool Result Set Handling* (CRM record query returns `[]`).
- **TC-015:** *Malformed Tool Response Schema* (Tool returns corrupted non-JSON payload).
- **TC-016:** *Infinite Tool Loop & Step Limit Termination* (Cyclic graph traversal hitting `max_steps`).
- **TC-017:** *High Latency SLA Boundary Check* (Semantic search must finish under 4.0s SLA).
- **TC-018:** *Hard Timeout Constraint Enforcement* (Monte Carlo simulation exceeding 3.0s deadline).
- **TC-019:** *Multi-Step Incomplete Execution Check* (3-step build sequence with verification).
- **TC-020:** *Tool 403 Forbidden Permission Handshake* (Administrative deletion privilege handling).

### E. Quality, Errors & Stress (TC-021 - TC-025)
- **TC-021:** *Strict Output Format (Pure YAML)* (Redis config without markdown code fence wrapper).
- **TC-022:** *Hallucinated Academic Citation Guard* (Fictional paper citation request).
- **TC-023:** *Vagueness & Precision Verification* (Exact Linux socket inspection command `ss -tulpn`).
- **TC-024:** *Malformed Corrupt Binary Input Handling* (ELF binary header graceful error handling).
- **TC-025:** *Stress Test: Multi-Vulnerability Audit* (5 simultaneous code audits under 3.5s constraint).

---

## 6. Metric Formulas & Calculation Logic

1. **Reliability Score (Success Rate %):**
   $$\text{Success Rate} = \left( \frac{\text{Passed Tests}}{\text{Total Tests Executed}} \right) \times 100$$
2. **Mean Response Latency ($s$):**
   $$\text{Avg Latency} = \frac{\sum_{i=1}^{N} \text{response\_time}_i}{N}$$
3. **Average Step Depth:**
   $$\text{Avg Steps} = \frac{\sum_{i=1}^{N} \text{steps\_used}_i}{N}$$
4. **Category Fragility Index (% Failure):**
   $$\text{Failure Rate}_{\text{category}} = \left( \frac{\text{Failed Tests in Category}}{\text{Total Tests in Category}} \right) \times 100$$
5. **Estimated Benchmark API Cost ($):**
   $$\text{Total Cost} = \sum (\text{Total Tokens} \times \$0.000015)$$

---

## 7. Installation & Quick Start

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ and npm

### 🌟 Unified Single-Port Launch (Recommended)
Both the React Frontend and FastAPI Backend are combined and served together on **port 8000**:

```powershell
# From the project root (c:\PROJECTS\BCD):
python run_app.py
```
*Open your browser and navigate to:* **`http://localhost:8000`**
- **Dashboard & UI**: `http://localhost:8000`
- **FastAPI Interactive Docs**: `http://localhost:8000/docs`
- **REST API Endpoints**: `http://localhost:8000/api`

---

### Separate Development Mode (Optional)

#### 1. Backend Server
```powershell
cd backend
python run.py
```

#### 2. Frontend Hot-Reload Dev Server
```powershell
cd frontend
npm.cmd run dev
```
*Hot-reload dev server runs at:* `http://localhost:5173` (proxies `/api` to `http://127.0.0.1:8000`)

---

## 8. Operating in Demo Mode vs. Live Agent API

### Demo Mode (Default)
- The app launches with **DEMO MODE ACTIVE** highlighted in the top banner.
- No third-party API keys are required.
- Uses `agent_runner._simulate_mock_agent()` to produce realistic multi-step agent actions (`Action ➔ Tool ➔ Validation`) with realistic latencies, realistic errors on edge test cases (e.g. TC-007 ambiguity, TC-013 tool 503, TC-016 recursion limit, TC-021 YAML fence violation).

### Live API Mode
- In **Agents & Config** (`Settings`), users can add or configure an agent with a real OpenAI-compatible completion endpoint:
  ```
  Endpoint: https://api.openai.com/v1/chat/completions
  Model: gpt-4o
  ```
- Toggle the "Demo Mode" pill in the header to switch to live HTTP completions.

---

## 9. Verification & Automated Testing

To run the automated backend test suite at any time:
```powershell
cd backend
python test_backend.py
```
This tests:
- `GET /api/health`
- `GET /api/test-cases` (verifying 25 test cases)
- `GET /api/agents`
- `GET /api/evaluations`
- `GET /api/failures`
- `GET /api/analytics`
- `POST /api/evaluations` (triggering live evaluation run)
- `GET /api/reports/:id/markdown` and `GET /api/reports/:id/json`
#   A I - F A I L U R E - D E T E C T O R  
 