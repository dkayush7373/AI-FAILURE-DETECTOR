import React from 'react';
import { EvaluationRun } from '../../types';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ChevronRight, 
  DollarSign, 
  Clock, 
  Cpu 
} from 'lucide-react';

interface RunHistoryTableProps {
  runs: EvaluationRun[];
  onSelectRun: (run: EvaluationRun) => void;
  onGenerateReport: (runId: string) => void;
}

export const RunHistoryTable: React.FC<RunHistoryTableProps> = ({
  runs,
  onSelectRun,
  onGenerateReport,
}) => {
  return (
    <div className="glass-panel rounded-xl border border-obsidian-800 overflow-hidden">
      <div className="p-4 border-b border-obsidian-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Evaluation Run Archives</h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {runs.length} Historical Benchmarks Logged
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-obsidian-800 bg-obsidian-900/80 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
              <th className="py-3 px-4 font-semibold">Run ID</th>
              <th className="py-3 px-4 font-semibold">Agent Profile</th>
              <th className="py-3 px-4 font-semibold text-center">Tests</th>
              <th className="py-3 px-4 font-semibold text-center">Pass / Fail</th>
              <th className="py-3 px-4 font-semibold text-center">Success Rate</th>
              <th className="py-3 px-4 font-semibold text-center">API Cost</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800/60 font-mono">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                  No evaluation runs recorded yet.
                </td>
              </tr>
            ) : (
              runs.map((run) => {
                const isHigh = run.success_rate >= 85;
                const isMedium = run.success_rate >= 70;
                return (
                  <tr
                    key={run.id}
                    onClick={() => onSelectRun(run)}
                    className="hover:bg-obsidian-850/70 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-purple-300">
                      {run.id}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {run.started_at ? new Date(run.started_at).toLocaleString() : 'N/A'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {run.agent?.name || run.agent_id}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Model: {run.agent?.model || 'gpt-4o'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center text-slate-300">
                      {run.total_tests}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-emerald-400 font-bold">{run.passed}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-400 font-bold">{run.failed}</span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isHigh
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isMedium
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {run.success_rate}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center text-emerald-400">
                      ${run.total_cost.toFixed(4)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onGenerateReport(run.id)}
                          className="px-2.5 py-1 rounded bg-obsidian-850 hover:bg-purple-600 text-slate-300 hover:text-white border border-obsidian-700 hover:border-purple-500 transition-colors text-[11px] font-sans flex items-center gap-1"
                          title="Generate QA Lab Report"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </button>
                        <button
                          onClick={() => onSelectRun(run)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-obsidian-800 transition-colors"
                          title="View Run Results"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
