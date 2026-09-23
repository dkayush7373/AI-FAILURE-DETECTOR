import React, { useState } from 'react';
import { Sparkles, Info, X, ChevronRight } from 'lucide-react';

interface DemoModeBannerProps {
  isDemoMode: boolean;
  onExploreSuite: () => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ isDemoMode, onExploreSuite }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoMode || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-obsidian-900 border-b border-purple-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-purple-200">
      <div className="flex items-center gap-2.5">
        <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
        <span className="font-semibold text-purple-300">DEMO MODE ACTIVE:</span>
        <span className="text-slate-300">
          Running simulated agent behavior with realistic multi-step traces, tool fallbacks, and deterministic failure modes across all 25 test cases.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onExploreSuite}
          className="flex items-center gap-1 text-purple-300 hover:text-white font-medium underline-offset-4 hover:underline"
        >
          View Test Suite <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-white rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
