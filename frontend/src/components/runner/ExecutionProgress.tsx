import React from 'react';
import { RunProgress } from '../../types';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  Clock, 
  Activity,
  Flame,
  ArrowRight
} from 'lucide-react';

interface ExecutionProgressProps {
  progress: RunProgress | null;
  isRunning: boolean;
}

export const ExecutionProgress: React.FC<ExecutionProgressProps> = ({ progress, isRunning }) => {
  if (!progress && !isRunning) return null;

  const completed = progress?.completed_tests || 0;
  const total = progress?.total_tests || 1;
  const pct = progress?.progress_percentage || Math.round((completed / total) * 100);
  const passed = progress?.passed || 0;
  const failed = progress?.failed || 0;
  const status = progress?.status || (isRunning ? 'RUNNING' : 'COMPLETED');
  const isFinished = status === 'COMPLETED';

  return (
    <div className="glass-panel rounded-xl p-5 border border-obsidian-800 space-y-4 animate-in fade-in duration-300">
      {/* Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-obsidian-800">
        <div className="flex items-center gap-3">
          {isRunning ? (
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {isFinished ? 'Evaluation Run Completed' : 'Evaluating Agent Reliability'}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                isFinished ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300 animate-pulse'
              }`}>
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Run ID: {progress?.run_id || 'Active Session'}</p>
          </div>
        </div>

        {/* Live Counter Badges */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Passed: <strong>{passed}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>Failed: <strong>{failed}</strong></span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Current Test */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Progress:</span>
            <span className="font-mono font-bold text-white">{completed} / {total} Tests Completed</span>
          </div>
          <span className="font-mono font-bold text-purple-400 text-sm">{pct}%</span>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-3 rounded-full bg-obsidian-950 border border-obsidian-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Current Active Test indicator */}
        {!isFinished && progress?.current_test_name && (
          <div className="mt-3 flex items-center gap-2 text-xs bg-obsidian-950 p-2.5 rounded-lg border border-obsidian-800">
            <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
            <span className="text-slate-400 font-mono">Executing:</span>
            <span className="font-mono font-bold text-purple-300">{progress.current_test_id}</span>
            <span className="text-slate-200 truncate">{progress.current_test_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
