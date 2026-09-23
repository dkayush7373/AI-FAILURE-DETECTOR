from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- Agent Schemas ---
class AgentBase(BaseModel):
    name: str = Field(..., example="GPT-4o Reliability Lab Profile")
    description: Optional[str] = Field(None, example="General purpose LLM agent evaluation profile")
    endpoint: Optional[str] = Field(None, example="https://api.openai.com/v1/chat/completions")
    model: str = Field("gpt-4o", example="gpt-4o")
    max_steps: int = Field(10, example=10)
    max_response_time: float = Field(15.0, example=15.0)

class AgentCreate(AgentBase):
    id: Optional[str] = None

class AgentResponse(AgentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Test Case Schemas ---
class TestCaseBase(BaseModel):
    name: str
    category: str
    input_prompt: str
    expected_outcome: str
    success_criteria: str
    max_steps: int = 5
    max_time: float = 10.0
    priority: str = "MEDIUM"

class TestCaseCreate(TestCaseBase):
    id: str  # e.g., TC-001

class TestCaseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    input_prompt: Optional[str] = None
    expected_outcome: Optional[str] = None
    success_criteria: Optional[str] = None
    max_steps: Optional[int] = None
    max_time: Optional[float] = None
    priority: Optional[str] = None

class TestCaseResponse(TestCaseBase):
    id: str

    class Config:
        from_attributes = True


# --- Agent Step Schemas ---
class AgentStepResponse(BaseModel):
    id: str
    step_number: int
    action: str
    tool: Optional[str] = None
    status: str
    duration: float

    class Config:
        from_attributes = True


# --- Failure Schemas ---
class FailureResponse(BaseModel):
    id: str
    test_result_id: str
    category: str
    severity: str
    description: str
    evidence: Optional[str] = None
    suggested_fix: Optional[str] = None

    class Config:
        from_attributes = True


# --- Test Result Schemas ---
class TestResultResponse(BaseModel):
    id: str
    run_id: str
    test_case_id: str
    status: str
    response: Optional[str] = None
    steps_used: int
    response_time: float
    token_usage: int
    estimated_cost: float
    created_at: datetime
    test_case: Optional[TestCaseResponse] = None
    failures: List[FailureResponse] = []
    agent_steps: List[AgentStepResponse] = []

    class Config:
        from_attributes = True


# --- Evaluation Run Schemas ---
class EvaluationRunCreate(BaseModel):
    agent_id: str
    test_case_ids: Optional[List[str]] = None  # None or empty = all test cases
    simulate_failures: Optional[bool] = None   # None = auto-demo logic

class EvaluationRunResponse(BaseModel):
    id: str
    agent_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_tests: int
    passed: int
    failed: int
    success_rate: float
    total_cost: float
    agent: Optional[AgentResponse] = None
    test_results: Optional[List[TestResultResponse]] = None

    class Config:
        from_attributes = True


# --- Analytics Schemas ---
class CategoryStat(BaseModel):
    category: str
    total: int
    passed: int
    failed: int
    failure_rate: float

class FailureCategoryDistribution(BaseModel):
    category: str
    count: int
    percentage: float

class SeverityDistribution(BaseModel):
    severity: str
    count: int

class ReliabilityTrendPoint(BaseModel):
    run_id: str
    started_at: str
    success_rate: float
    total_tests: int
    passed: int
    failed: int
    agent_name: str
    total_cost: float

class AnalyticsSummary(BaseModel):
    total_runs: int
    total_tests_executed: int
    overall_passed: int
    overall_failed: int
    overall_success_rate: float
    avg_response_time: float
    avg_steps_used: float
    total_cost: float
    failure_categories: List[FailureCategoryDistribution]
    severity_breakdown: List[SeverityDistribution]
    category_stats: List[CategoryStat]
    reliability_trend: List[ReliabilityTrendPoint]
    flakiest_tests: List[Dict[str, Any]]
