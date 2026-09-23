import React, { useState } from 'react';
import { TestCase } from '../../types';
import { 
  X, 
  Play, 
  Clock, 
  Footprints, 
  ShieldAlert, 
  CheckCircle2, 
  Code2, 
  Copy, 
  Check 
} from 'lucide-react';

interface TestCaseDrawerProps {
  testCase: TestCase | null;
  onClose: () => void;
  onRunTest: (tc: TestCase) => void;
  onShowToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const TestCaseDrawer: React.FC<TestCaseDrawerProps> = ({
  testCase,
  onClose,
  onRunTest,
  onShowToast,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCriteria, setCopiedCriteria] = useState(false);

  if (!testCase) return null;

  const copyPrompt = () => {
    navigator.clipboard.writeText(testCase.input_prompt || '');
    setCopiedPrompt(true);
    if (onShowToast) {
      onShowToast('success', 'Test Prompt Copied', `${testCase.id} prompt copied to clipboard`);
    }
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const formattedCriteria = (() => {
    try {
      return JSON.stringify(JSON.parse(testCase.success_criteria), null, 2);
    } catch {
      return testCase.success_criteria;
    }
  })();

  const copyCriteria = () => {
    navigator.clipboard.writeText(formattedCriteria);
    setCopiedCriteria(true);
    if (onShowToast) {
      onShowToast('success', 'Criteria Rules Copied', `${testCase.id} rules JSON copied to clipboard`);
    }
    setTimeout(() => setCopiedCriteria(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-obsidian-900 border-l border-obsidian-800 h-full flex flex-col shadow-2xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-obsidian-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {testCase.id}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-obsidian-800 text-slate-300 border border-obsidian-700">
                {testCase.category}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                testCase.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                testCase.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                'bg-indigo-500/20 text-indigo-300'
              }`}>
                {testCase.priority}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{testCase.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-obsidian-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SLA Requirements */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="glass-panel p-3 rounded-lg border border-obsidian-800 flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Response SLA</div>
              <div className="text-sm font-mono font-bold text-white">≤ {testCase.max_time} seconds</div>
            </div>
          </div>

          <div className="glass-panel p-3 rounded-lg border border-obsidian-800 flex items-center gap-3">
            <div className="p-2 rounded bg-purple-500/10 text-purple-400">
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Step Budget</div>
              <div className="text-sm font-mono font-bold text-white">≤ {testCase.max_steps} steps</div>
            </div>
          </div>
        </div>

        {/* Test Specifications */}
        <div className="space-y-4 flex-1">
          {/* Input Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                Input Prompt to Agent
              </label>
              <button
                onClick={copyPrompt}
                className="text-[11px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                title="Copy prompt text"
              >
                {copiedPrompt ? (
                  <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                ) : (
                  <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                )}
              </button>
            </div>
            <div className="p-3.5 rounded-lg bg-obsidian-950 border border-obsidian-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {testCase.input_prompt || '<Empty Input Prompt>'}
            </div>
          </div>

          {/* Expected Outcome */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Expected Outcome / Correct Behavior
            </label>
            <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed">
              {testCase.expected_outcome}
            </div>
          </div>

          {/* Success Criteria Rules */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Evaluation Criteria & Rules (JSON Engine)
              </label>
              <button
                onClick={copyCriteria}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                title="Copy JSON criteria"
              >
                {copiedCriteria ? (
                  <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                ) : (
                  <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Rules</span>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-lg bg-obsidian-950 border border-obsidian-800 font-mono text-[11px] text-purple-300 overflow-x-auto leading-normal">
              {formattedCriteria}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-obsidian-800 mt-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-obsidian-700 text-slate-300 hover:text-white hover:bg-obsidian-800 text-xs font-medium transition-colors"
          >
            Close Drawer
          </button>
          <button
            onClick={() => {
              onClose();
              onRunTest(testCase);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-glow-purple transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Single Test Evaluation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
