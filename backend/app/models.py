import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    endpoint = Column(String(512), nullable=True)
    model = Column(String(128), nullable=False, default="gpt-4o")
    max_steps = Column(Integer, default=10)
    max_response_time = Column(Float, default=15.0)  # seconds
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    evaluation_runs = relationship("EvaluationRun", back_populates="agent", cascade="all, delete-orphan")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(String(64), primary_key=True, index=True)  # e.g., TC-001
    name = Column(String(255), nullable=False)
    category = Column(String(128), nullable=False, index=True)
    input_prompt = Column(Text, nullable=False)
    expected_outcome = Column(Text, nullable=False)
    success_criteria = Column(Text, nullable=False)  # JSON or descriptive criteria
    max_steps = Column(Integer, default=5)
    max_time = Column(Float, default=10.0)  # in seconds
    priority = Column(String(32), default="MEDIUM", index=True)  # CRITICAL, HIGH, MEDIUM, LOW

    # Relationships
    test_results = relationship("TestResult", back_populates="test_case", cascade="all, delete-orphan")


class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String(64), primary_key=True, index=True)
    agent_id = Column(String(64), ForeignKey("agents.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_tests = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)  # Percentage (0-100)
    total_cost = Column(Float, default=0.0)    # in USD

    # Relationships
    agent = relationship("Agent", back_populates="evaluation_runs")
    test_results = relationship("TestResult", back_populates="evaluation_run", cascade="all, delete-orphan")


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(String(64), primary_key=True, index=True)
    run_id = Column(String(64), ForeignKey("evaluation_runs.id"), nullable=False, index=True)
    test_case_id = Column(String(64), ForeignKey("test_cases.id"), nullable=False, index=True)
    status = Column(String(16), nullable=False, index=True)  # PASS, FAIL
    response = Column(Text, nullable=True)
    steps_used = Column(Integer, default=1)
    response_time = Column(Float, default=0.0)  # seconds
    token_usage = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0) # in USD
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    evaluation_run = relationship("EvaluationRun", back_populates="test_results")
    test_case = relationship("TestCase", back_populates="test_results")
    failures = relationship("Failure", back_populates="test_result", cascade="all, delete-orphan")
    agent_steps = relationship("AgentStep", back_populates="test_result", cascade="all, delete-orphan", order_by="AgentStep.step_number")


class Failure(Base):
    __tablename__ = "failures"

    id = Column(String(64), primary_key=True, index=True)
    test_result_id = Column(String(64), ForeignKey("test_results.id"), nullable=False, index=True)
    category = Column(String(128), nullable=False, index=True)  # 1 of the 10 failure categories
    severity = Column(String(32), default="HIGH", index=True)   # CRITICAL, HIGH, MEDIUM, LOW
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    suggested_fix = Column(Text, nullable=True)

    # Relationships
    test_result = relationship("TestResult", back_populates="failures")


class AgentStep(Base):
    __tablename__ = "agent_steps"

    id = Column(String(64), primary_key=True, index=True)
    test_result_id = Column(String(64), ForeignKey("test_results.id"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    action = Column(String(255), nullable=False)
    tool = Column(String(128), nullable=True)
    status = Column(String(32), default="SUCCESS")  # SUCCESS, FAILED, TIMEOUT, SKIPPED
    duration = Column(Float, default=0.0)           # in seconds

    # Relationships
    test_result = relationship("TestResult", back_populates="agent_steps")
