import React, { useState, useEffect, useRef } from 'react';
import { api } from './api/client';
import { 
  Agent, 
  TestCase, 
  EvaluationRun, 
  Failure, 
  AnalyticsSummary, 
  RunProgress 
} from './types';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DemoModeBanner } from './components/layout/DemoModeBanner';

// Common Interactive Components
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { CommandPalette } from './components/common/CommandPalette';

// Dashboard Components
import { MetricCards } from './components/dashboard/MetricCards';
import { PassFailChart } from './components/dashboard/PassFailChart';
import { FailureCategoryChart } from './components/dashboard/FailureCategoryChart';
import { ReliabilityTrendChart } from './components/dashboard/ReliabilityTrendChart';
import { CategoryBreakdownTable } from './components/dashboard/CategoryBreakdownTable';

// Test Cases Components
import { TestCaseList } from './components/test-cases/TestCaseList';
import { TestCaseDrawer } from './components/test-cases/TestCaseDrawer';
import { TestCaseModal } from './components/test-cases/TestCaseModal';

// Runner Components
import { RunnerControls } from './components/runner/RunnerControls';
import { ExecutionProgress } from './components/runner/ExecutionProgress';
import { ActiveTraceViewer } from './components/runner/ActiveTraceViewer';

// Evaluations Components
import { RunHistoryTable } from './components/evaluations/RunHistoryTable';
import { RunDetailModal } from './components/evaluations/RunDetailModal';

// Failures Components
import { FailureMatrix } from './components/failures/FailureMatrix';

// Reports Components
import { LabReportView } from './components/reports/LabReportView';

// Settings Components
import { SettingsView } from './components/settings/SettingsView';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [health, setHealth] = useState<{ status: string; database: string; demo_mode: boolean; stats: any } | null>(null);

  // Entities
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRun[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Runner & Progress State
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeProgress, setActiveProgress] = useState<RunProgress | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals, Drawers & Interactive Overlays
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isCreateTestModalOpen, setIsCreateTestModalOpen] = useState<boolean>(false);
  const [selectedRunModal, setSelectedRunModal] = useState<EvaluationRun | null>(null);
  const [reportRunId, setReportRunId] = useState<string | undefined>(undefined);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Polling ref for run
  const pollIntervalRef = useRef<any>(null);

  // Toast dispatcher helper
  const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration: 4000 }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut listener for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial Data Fetch
  const loadAllData = async (notify: boolean = false) => {
    try {
      setIsRefreshing(true);
      const [healthData, agentsData, testsData, evalsData, failsData, analyticsData] = await Promise.all([
        api.getHealth(),
        api.getAgents(),
        api.getTestCases(),
        api.getEvaluations(),
        api.getFailures(),
        api.getAnalytics(),
      ]);

      setHealth(healthData);
      setAgents(agentsData);
      if (agentsData.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentsData[0].id);
      }
      setTestCases(testsData);
      if (selectedTestIds.length === 0) {
        setSelectedTestIds(testsData.map((tc) => tc.id));
      }
      setEvaluations(evalsData);
      setFailures(failsData);
      setAnalytics(analyticsData);

      if (notify) {
        showToast('success', 'Data Synchronized', 'All benchmark runs, tests, and analytics refreshed.');
      }
    } catch (err: any) {
      console.error('Failed to load lab data:', err);
      showToast('error', 'Synchronization Failed', err?.message || 'Could not connect to backend.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData(false);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Toggle demo mode with toast feedback
  const handleToggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    showToast(
      'info',
      nextVal ? 'Demo Mode Active' : 'Live API Mode Active',
      nextVal ? 'Running evaluations with realistic multi-step failure simulations.' : 'Evaluations will invoke external HTTP API endpoints.'
    );
  };

  // Launch Evaluation Execution
  const handleLaunchEvaluation = async (simulateFailures: boolean = true, specificTestIds?: string[]) => {
    if (!selectedAgentId) return;

    const testsToRun = specificTestIds || selectedTestIds;
    if (testsToRun.length === 0) {
      showToast('warning', 'No Tests Selected', 'Please select at least one test case to run.');
      return;
    }

    try {
      setIsRunning(true);
      setCurrentTab('runner');

      const targetAgent = agents.find((a) => a.id === selectedAgentId);
      showToast('info', 'Evaluation Run Started', `Executing ${testsToRun.length} benchmark test cases against ${targetAgent?.name || 'Agent'}...`);

      // 1. Initial simulated progress state
      const mockInitialProgress: RunProgress = {
        run_id: 'initializing...',
        agent_id: selectedAgentId,
        agent_name: targetAgent?.name || 'Agent',
        status: 'RUNNING',
        total_tests: testsToRun.length,
        completed_tests: 0,
        passed: 0,
        failed: 0,
        progress_percentage: 0,
        recent_results: []
      };
      setActiveProgress(mockInitialProgress);

      // 2. Trigger Evaluation on backend
      const evalRunPromise = api.triggerEvaluation({
        agent_id: selectedAgentId,
        test_case_ids: testsToRun,
        simulate_failures: simulateFailures
      });

      // 3. Rapid polling for live trace stream
      pollIntervalRef.current = setInterval(async () => {
        if (activeProgress?.run_id && activeProgress.run_id !== 'initializing...') {
          try {
            const prog = await api.getEvaluationProgress(activeProgress.run_id);
            if (prog && prog.status) {
              setActiveProgress(prog);
              if (prog.status === 'COMPLETED' || prog.status === 'FAILED') {
                clearInterval(pollIntervalRef.current);
              }
            }
          } catch (e) {
            // ignore poll error
          }
        }
      }, 350);

      const completedRun = await evalRunPromise;
      clearInterval(pollIntervalRef.current);

      // Fetch final detailed run
      const detailedRun = await api.getEvaluation(completedRun.id);
      
      // Update progress state with completed results
      setActiveProgress({
        run_id: completedRun.id,
        agent_id: selectedAgentId,
        agent_name: targetAgent?.name || 'Agent',
        status: 'COMPLETED',
        total_tests: completedRun.total_tests,
        completed_tests: completedRun.total_tests,
        passed: completedRun.passed,
        failed: completedRun.failed,
        progress_percentage: 100,
        success_rate: completedRun.success_rate,
        recent_results: (detailedRun.test_results || []).map((tr) => ({
          test_id: tr.test_case_id,
          test_name: tr.test_case?.name || tr.test_case_id,
          status: tr.status,
          latency: tr.response_time,
          failure: tr.failures?.[0] ? {
            category: tr.failures[0].category,
            severity: tr.failures[0].severity,
            description: tr.failures[0].description
          } : null
        }))
      });

      showToast(
        completedRun.failed === 0 ? 'success' : 'warning',
        'Evaluation Finished',
        `Run ${completedRun.id.slice(0, 8)} completed: ${completedRun.passed} Passed, ${completedRun.failed} Failed (${completedRun.success_rate}% success).`
      );

      // Reload global dashboard benchmarks
      await loadAllData(false);
    } catch (err: any) {
      console.error('Run failed:', err);
      showToast('error', 'Evaluation Error', err?.message || 'Failed to execute test suite.');
    } finally {
      setIsRunning(false);
    }
  };

  // Run single test shortcut
  const handleRunSingleTest = (tc: TestCase) => {
    setSelectedTestIds([tc.id]);
    handleLaunchEvaluation(isDemoMode, [tc.id]);
  };

  // Open run drilldown modal
  const handleOpenRunModal = async (run: EvaluationRun) => {
    try {
      const fullRun = await api.getEvaluation(run.id);
      setSelectedRunModal(fullRun);
    } catch (err) {
      setSelectedRunModal(run);
    }
  };

  // View report for run
  const handleGenerateReport = (runId: string) => {
    setReportRunId(runId);
    setCurrentTab('reports');
    showToast('info', 'Report Loaded', `Generated executive report view for evaluation run ${runId.slice(0, 8)}.`);
  };

  // Create new test case handler
  const handleSaveTestCase = async (tc: TestCase) => {
    try {
      await api.createTestCase(tc);
      const updated = await api.getTestCases();
      setTestCases(updated);
      setSelectedTestIds([...selectedTestIds, tc.id]);
      showToast('success', 'Test Case Created', `${tc.id} (${tc.name}) added to test suite.`);
    } catch (err: any) {
      showToast('error', 'Failed to Create Test', err?.message);
    }
  };

  // Create new agent handler
  const handleCreateAgent = async (agentData: Partial<Agent>) => {
    try {
      const newAgent = await api.createAgent(agentData);
      setAgents([newAgent, ...agents]);
      setSelectedAgentId(newAgent.id);
      showToast('success', 'Agent Profile Created', `${newAgent.name} is now available.`);
    } catch (err: any) {
      showToast('error', 'Failed to Create Agent', err?.message);
    }
  };

  // Delete agent handler
  const handleDeleteAgent = async (id: string) => {
    try {
      await api.deleteAgent(id);
      setAgents(agents.filter((a) => a.id !== id));
      if (selectedAgentId === id && agents.length > 1) {
        setSelectedAgentId(agents[0].id);
      }
      showToast('info', 'Agent Removed', 'Agent profile has been deleted.');
    } catch (err: any) {
      showToast('error', 'Failed to Delete Agent', err?.message);
    }
  };

  return (
    <div className="relative flex h-screen bg-obsidian-950 text-slate-100 overflow-hidden select-none bg-grid-pattern">
      {/* Ambient Aurora Glow Backdrop */}
      <div className="aurora-glow"></div>
      <div className="aurora-glow-secondary"></div>

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        health={health}
        onOpenNewRun={() => {
          setSelectedTestIds(testCases.map((tc) => tc.id));
          setCurrentTab('runner');
        }}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <Header
          currentTab={currentTab}
          agents={agents}
          selectedAgentId={selectedAgentId}
          setSelectedAgentId={setSelectedAgentId}
          isDemoMode={isDemoMode}
          setIsDemoMode={handleToggleDemoMode}
          onRunClick={() => handleLaunchEvaluation(isDemoMode)}
          onRefresh={() => loadAllData(true)}
          isRefreshing={isRefreshing}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Demo Mode Glowing Banner */}
        <DemoModeBanner
          isDemoMode={isDemoMode}
          onExploreSuite={() => setCurrentTab('test-cases')}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric KPI Cards */}
              <MetricCards analytics={analytics} />

              {/* Main Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut: Pass vs Fail */}
                <div className="lg:col-span-1">
                  <PassFailChart
                    passed={analytics?.overall_passed || 0}
                    failed={analytics?.overall_failed || 0}
                  />
                </div>

                {/* Bar Chart: 10 Failure Categories */}
                <div className="lg:col-span-2">
                  <FailureCategoryChart
                    categories={analytics?.failure_categories || []}
                  />
                </div>
              </div>

              {/* Reliability Progression & Categories Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ReliabilityTrendChart
                    trendData={analytics?.reliability_trend || []}
                  />
                </div>
                <div className="lg:col-span-1">
                  <CategoryBreakdownTable
                    categoryStats={analytics?.category_stats || []}
                    onSelectCategory={() => setCurrentTab('test-cases')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEST CASES SUITE */}
          {currentTab === 'test-cases' && (
            <TestCaseList
              testCases={testCases}
              onSelectTestCase={(tc) => setSelectedTestCase(tc)}
              onRunSingleTest={handleRunSingleTest}
              onOpenCreateModal={() => setIsCreateTestModalOpen(true)}
            />
          )}

          {/* TAB 3: INTERACTIVE TEST RUNNER */}
          {currentTab === 'runner' && (
            <div className="space-y-6 max-w-6xl">
              {/* Runner Controls */}
              <RunnerControls
                agents={agents}
                selectedAgentId={selectedAgentId}
                setSelectedAgentId={setSelectedAgentId}
                testCases={testCases}
                selectedTestIds={selectedTestIds}
                setSelectedTestIds={setSelectedTestIds}
                onLaunchRun={(sim) => handleLaunchEvaluation(sim)}
                isRunning={isRunning}
              />

              {/* Live Execution Progress */}
              {(isRunning || activeProgress) && (
                <ExecutionProgress
                  progress={activeProgress}
                  isRunning={isRunning}
                />
              )}

              {/* Active Step Traces */}
              <ActiveTraceViewer
                progress={activeProgress}
                onSelectResult={(testId) => {
                  const tc = testCases.find((t) => t.id === testId);
                  if (tc) setSelectedTestCase(tc);
                }}
              />
            </div>
          )}

          {/* TAB 4: EVALUATION RUNS */}
          {currentTab === 'evaluations' && (
            <RunHistoryTable
              runs={evaluations}
              onSelectRun={handleOpenRunModal}
              onGenerateReport={handleGenerateReport}
            />
          )}

          {/* TAB 5: FAILURE ANALYSIS */}
          {currentTab === 'failures' && (
            <FailureMatrix 
              failures={failures} 
              onShowToast={showToast}
            />
          )}

          {/* TAB 6: LAB REPORTS */}
          {currentTab === 'reports' && (
            <LabReportView
              runs={evaluations}
              initialRunId={reportRunId}
            />
          )}

          {/* TAB 7: SETTINGS & AGENTS */}
          {currentTab === 'settings' && (
            <SettingsView
              agents={agents}
              onCreateAgent={handleCreateAgent}
              onDeleteAgent={handleDeleteAgent}
              isDemoMode={isDemoMode}
              setIsDemoMode={setIsDemoMode}
            />
          )}
        </main>
      </div>

      {/* Global Interactive Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        testCases={testCases}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onSelectTestCase={(tc) => setSelectedTestCase(tc)}
        onRunTest={handleRunSingleTest}
        onQuickRun={() => handleLaunchEvaluation(isDemoMode)}
        onToggleDemoMode={handleToggleDemoMode}
        isDemoMode={isDemoMode}
        onRefresh={() => loadAllData(true)}
      />

      {/* Slide-over Test Case Details Drawer */}
      <TestCaseDrawer
        testCase={selectedTestCase}
        onClose={() => setSelectedTestCase(null)}
        onRunTest={handleRunSingleTest}
        onShowToast={showToast}
      />

      {/* Create / Edit Test Case Modal */}
      <TestCaseModal
        isOpen={isCreateTestModalOpen}
        onClose={() => setIsCreateTestModalOpen(false)}
        onSave={handleSaveTestCase}
      />

      {/* Evaluation Run Detailed Drilldown Modal */}
      <RunDetailModal
        run={selectedRunModal}
        onClose={() => setSelectedRunModal(null)}
        onGenerateReport={handleGenerateReport}
      />

      {/* Floating Modern Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
