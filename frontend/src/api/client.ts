import { Agent, TestCase, EvaluationRun, TestResult, Failure, AnalyticsSummary, RunProgress } from '../types';

const BASE_URL = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || JSON.stringify(err);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => fetchJSON<{ status: string; database: string; demo_mode: boolean; stats: any }>(`${BASE_URL}/health`),

  // Agents
  getAgents: () => fetchJSON<Agent[]>(`${BASE_URL}/agents`),
  createAgent: (data: Partial<Agent>) => fetchJSON<Agent>(`${BASE_URL}/agents`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteAgent: (id: string) => fetchJSON<{ status: string; id: string }>(`${BASE_URL}/agents/${id}`, {
    method: 'DELETE',
  }),

  // Test Cases
  getTestCases: (params?: { category?: string; priority?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.search) searchParams.append('search', params.search);
    const query = searchParams.toString();
    return fetchJSON<TestCase[]>(`${BASE_URL}/test-cases${query ? `?${query}` : ''}`);
  },
  createTestCase: (data: TestCase) => fetchJSON<TestCase>(`${BASE_URL}/test-cases`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTestCase: (id: string, data: Partial<TestCase>) => fetchJSON<TestCase>(`${BASE_URL}/test-cases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteTestCase: (id: string) => fetchJSON<{ status: string; id: string }>(`${BASE_URL}/test-cases/${id}`, {
    method: 'DELETE',
  }),

  // Evaluations
  triggerEvaluation: (data: { agent_id: string; test_case_ids?: string[]; simulate_failures?: boolean }) =>
    fetchJSON<EvaluationRun>(`${BASE_URL}/evaluations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getEvaluations: () => fetchJSON<EvaluationRun[]>(`${BASE_URL}/evaluations`),
  getEvaluation: (id: string) => fetchJSON<EvaluationRun>(`${BASE_URL}/evaluations/${id}`),
  getEvaluationProgress: (id: string) => fetchJSON<RunProgress>(`${BASE_URL}/evaluations/${id}/progress`),

  // Test Results
  getResults: (params?: { run_id?: string; status?: string; test_case_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.run_id) searchParams.append('run_id', params.run_id);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.test_case_id) searchParams.append('test_case_id', params.test_case_id);
    const query = searchParams.toString();
    return fetchJSON<TestResult[]>(`${BASE_URL}/results${query ? `?${query}` : ''}`);
  },

  // Failures
  getFailures: (params?: { category?: string; severity?: string; run_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.run_id) searchParams.append('run_id', params.run_id);
    const query = searchParams.toString();
    return fetchJSON<Failure[]>(`${BASE_URL}/failures${query ? `?${query}` : ''}`);
  },

  // Analytics
  getAnalytics: (runId?: string) => {
    const query = runId ? `?run_id=${encodeURIComponent(runId)}` : '';
    return fetchJSON<AnalyticsSummary>(`${BASE_URL}/analytics${query}`);
  },

  // Reports
  getMarkdownReport: async (runId: string): Promise<string> => {
    const resp = await fetch(`${BASE_URL}/reports/${runId}/markdown`);
    if (!resp.ok) throw new Error('Failed to generate markdown report');
    return resp.text();
  },
  getJSONReport: (runId: string) => fetchJSON<any>(`${BASE_URL}/reports/${runId}/json`),
};
