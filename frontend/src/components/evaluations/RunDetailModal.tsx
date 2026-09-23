import React, { useState } from 'react';
import { EvaluationRun, TestResult } from '../../types';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Footprints, 
  AlertTriangle, 
  Lightbulb, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Cpu 
} from 'lucide-react';

interface RunDetailModalProps {
  run: EvaluationRun | null;
  onClose: () => void;
  onGenerateReport: (runId: string) => void;
}

export const RunDetailModal: React.FC<RunDetailModalProps> = ({
  run,
  onClose,
  onGenerateReport,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);

  if (!run) return null;

  const results = run.test_results || [];
  const filteredResults = results.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const toggleExpand = (id: string) => {
    setExpandedResultId(expandedResultId === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-obsidian-900 border border-obsidian-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-obsidian-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-mono text-xs">
              <span className="font-bold text-purple-400 bg-purple-500/20 px-2.5 py-0.5 rounded border border-purple-500/30">
                {run.id}
              </span>
              <span className="text-slate-400">
                {run.started_at ? new Date(run.started_at).toLocaleString() : ''}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Evaluation Run Results Drilldown
            </h2>
            <p className="text-xs text-slate-400">
              Agent: <span className="text-white font-medium">{run.agent?.name || run.agent_id}</span> ({run.agent?.model || 'LLM'})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onGenerateReport(run.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors shadow-glow-purple"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lab Report</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-4 gap-2 px-6 py-3 bg-obsidian-950/60 border-b border-obsidian-800 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">SUCCESS RATE</span>
            <span className={`text-base font-bold ${run.success_rate >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {run.success_rate}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">TOTAL TESTS</span>
            <span className="text-base font-bold text-white">{run.total_tests}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">PASS / FAIL</span>
            <span className="text-base font-bold">
              <span className="text-emerald-400">{run.passed}</span> / <span className="text-rose-400">{run.failed}</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">TOTAL COST</span>
            <span className="text-base font-bold text-emerald-400">${run.total_cost.toFixed(4)}</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {(['ALL', 'PASS', 'FAIL'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-md font-mono text-xs transition-colors ${
                  filterStatus === st
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-obsidian-850'
                }`}
              >
                {st} ({st === 'ALL' ? results.length : st === 'PASS' ? run.passed : run.failed})
              </button>
            ))}
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            Click any test to inspect steps trace & failure evidence
          </span>
        </div>

        {/* Test Results List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredResults.map((res) => {
            const isPass = res.status === 'PASS';
            const isExpanded = expandedResultId === res.id;
            const primaryFailure = res.failures?.[0];

            return (
              <div
                key={res.id}
                className={`rounded-xl border transition-all ${
                  isPass
                    ? 'bg-obsidian-850/40 border-obsidian-800'
                    : 'bg-rose-950/15 border-rose-500/30'
                }`}
              >
                {/* Result Summary Header */}
                <div
                  onClick={() => toggleExpand(res.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {isPass ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-purple-400">
                          {res.test_case_id}
                        </span>
                        <span className="font-semibold text-xs text-white">
                          {res.test_case?.name || res.test_case_id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-obsidian-800 text-slate-400 font-mono">
                          {res.test_case?.category}
                        </span>
                      </div>
                      {primaryFailure && (
                        <div className="text-[11px] text-rose-300 font-mono mt-0.5">
                          Anomaly: [{primaryFailure.severity}] {primaryFailure.category}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" /> {res.response_time}s
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Footprints className="w-3 h-3" /> {res.steps_used} steps
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPass ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {res.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-obsidian-800/80 space-y-3 text-xs">
                    {/* Prompt & Response */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono mb-1">
                          Test Prompt
                        </div>
                        <div className="p-2.5 rounded bg-obsidian-950 border border-obsidian-800 font-mono text-[11px] text-slate-300 max-h-32 overflow-y-auto">
                          {res.test_case?.input_prompt || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono mb-1">
                          Agent Response
                        </div>
                        <div className="p-2.5 rounded bg-obsidian-950 border border-obsidian-800 font-mono text-[11px] text-slate-300 max-h-32 overflow-y-auto">
                          {res.response || 'No response recorded'}
                        </div>
                      </div>
                    </div>

                    {/* Step Timeline Trace */}
                    {res.agent_steps && res.agent_steps.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono mb-1.5">
                          Multi-Step Execution Trace ({res.agent_steps.length} Steps)
                        </div>
                        <div className="space-y-1.5">
                          {res.agent_steps.map((st) => (
                            <div
                              key={st.id}
                              className="p-2 rounded bg-obsidian-950/80 border border-obsidian-800 flex items-center justify-between text-[11px] font-mono"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-purple-400 font-bold">Step {st.step_number}:</span>
                                <span className="text-slate-200">{st.action}</span>
                                {st.tool && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                                    tool: {st.tool}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">{st.duration}s</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    st.status === 'SUCCESS'
                                      ? 'text-emerald-400'
                                      : 'text-rose-400 bg-rose-500/20'
                                  }`}
                                >
                                  {st.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Failure & Suggested Remediation */}
                    {primaryFailure && (
                      <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 space-y-2">
                        <div className="flex items-center gap-2 text-rose-300 font-semibold font-mono text-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span>
                            [{primaryFailure.severity}] {primaryFailure.category}: {primaryFailure.description}
                          </span>
                        </div>
                        {primaryFailure.evidence && (
                          <div className="text-[11px] font-mono text-slate-300 bg-obsidian-950/80 p-2 rounded border border-rose-500/20">
                            <strong>Evidence:</strong> {primaryFailure.evidence}
                          </div>
                        )}
                        {primaryFailure.suggested_fix && (
                          <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-500/30 flex items-start gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <strong>Prescriptive Fix:</strong> {primaryFailure.suggested_fix}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-obsidian-800 flex justify-end bg-obsidian-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-obsidian-700 text-slate-300 hover:text-white hover:bg-obsidian-800 text-xs font-medium transition-colors"
          >
            Close Drilldown
          </button>
        </div>
      </div>
    </div>
  );
};
