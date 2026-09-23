import React from 'react';
import { RunProgress } from '../../types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Activity 
} from 'lucide-react';

interface ActiveTraceViewerProps {
  progress: RunProgress | null;
  onSelectResult?: (testId: string) => void;
}

export const ActiveTraceViewer: React.FC<ActiveTraceViewerProps> = ({
  progress,
  onSelectResult,
}) => {
  const recentResults = progress?.recent_results || [];

  return (
    <div className="glass-panel rounded-xl p-5 border border-obsidian-800 space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-obsidian-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Live Execution Traces</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Showing last {recentResults.length} test outcomes
        </span>
      </div>

      {recentResults.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-mono">
          Ready to run. Click "Run Evaluation" above to begin streaming execution traces.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {recentResults.map((item, idx) => {
            const isPass = item.status === 'PASS';
            return (
              <div
                key={idx}
                onClick={() => onSelectResult?.(item.test_id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isPass
                    ? 'bg-emerald-950/15 border-emerald-500/20 hover:border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPass ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-mono font-bold text-xs text-purple-300">
                      {item.test_id}
                    </span>
                    <span className="text-xs font-semibold text-white truncate max-w-sm">
                      {item.test_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" /> {item.latency}s
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        isPass
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* If failure detected, show breakdown */}
                {item.failure && (
                  <div className="mt-2 pt-2 border-t border-rose-500/20 text-xs flex items-start gap-2 text-rose-300 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-200">[{item.failure.severity}] {item.failure.category}:</span>{' '}
                      <span className="text-slate-300">{item.failure.description}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
