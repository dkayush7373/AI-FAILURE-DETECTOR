export interface Agent {
  id: string;
  name: string;
  description?: string;
  endpoint?: string;
  model: string;
  max_steps: number;
  max_response_time: number;
  created_at: string;
}

export interface TestCase {
  id: string;
  name: string;
  category: string;
  input_prompt: string;
  expected_outcome: string;
  success_criteria: string;
  max_steps: number;
  max_time: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AgentStep {
  id: string;
  step_number: number;
  action: string;
  tool?: string | null;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'SKIPPED';
  duration: number;
}

export interface Failure {
  id: string;
  test_result_id: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  evidence?: string;
  suggested_fix?: string;
  run_id?: string;
  test_case_id?: string;
  test_case_name?: string;
  test_case_category?: string;
  input_prompt?: string;
  response?: string;
  response_time?: number;
  steps_used?: number;
}

export interface TestResult {
  id: string;
  run_id: string;
  test_case_id: string;
  status: 'PASS' | 'FAIL';
  response?: string;
  steps_used: number;
  response_time: number;
  token_usage: number;
  estimated_cost: number;
  created_at: string;
  test_case?: TestCase;
  failures: Failure[];
  agent_steps: AgentStep[];
}

export interface EvaluationRun {
  id: string;
  agent_id: string;
  started_at: string;
  completed_at?: string | null;
  total_tests: number;
  passed: number;
  failed: number;
  success_rate: number;
  total_cost: number;
  agent?: Agent;
  test_results?: TestResult[];
}

export interface CategoryStat {
  category: string;
  total: number;
  passed: number;
  failed: number;
  failure_rate: number;
}

export interface FailureCategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface SeverityDistribution {
  severity: string;
  count: number;
}

export interface ReliabilityTrendPoint {
  run_id: string;
  started_at: string;
  success_rate: number;
  total_tests: number;
  passed: number;
  failed: number;
  agent_name: string;
  total_cost: number;
}

export interface FlakyTest {
  id: string;
  name: string;
  category: string;
  priority: string;
  failure_count: number;
  total_runs: number;
  failure_rate: number;
}

export interface AnalyticsSummary {
  total_runs: number;
  total_tests_executed: number;
  overall_passed: number;
  overall_failed: number;
  overall_success_rate: number;
  avg_response_time: number;
  avg_steps_used: number;
  total_cost: number;
  failure_categories: FailureCategoryDistribution[];
  severity_breakdown: SeverityDistribution[];
  category_stats: CategoryStat[];
  reliability_trend: ReliabilityTrendPoint[];
  flakiest_tests: FlakyTest[];
}

export interface RunProgress {
  run_id: string;
  agent_id: string;
  agent_name: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  total_tests: number;
  completed_tests: number;
  passed: number;
  failed: number;
  current_test_id?: string;
  current_test_name?: string;
  progress_percentage: number;
  success_rate?: number;
  recent_results: Array<{
    test_id: string;
    test_name: string;
    status: 'PASS' | 'FAIL';
    latency: number;
    failure?: {
      category: string;
      severity: string;
      description: string;
    } | null;
  }>;
}
