import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  Play, 
  RefreshCw, 
  Search,
  Command
} from 'lucide-react';
import { Agent } from '../../types';

interface HeaderProps {
  currentTab: string;
  agents: Agent[];
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  onRunClick: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenCommandPalette?: () => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'QA Observability & Reliability Lab',
    subtitle: 'Evaluate agent behaviors, track regression metrics, and remediate failure vulnerabilities.'
  },
  'test-cases': {
    title: 'Predefined Test Suite (25 Tests)',
    subtitle: 'Browse, filter, and configure benchmark test cases spanning basic retrieval to stress testing.'
  },
  runner: {
    title: 'Interactive Test Runner',
    subtitle: 'Execute live agent evaluations with real-time step traces and anomaly inspection.'
  },
  evaluations: {
    title: 'Historical Evaluation Runs',
    subtitle: 'Audit past evaluation sessions, pass rates, latency benchmarks, and cost trends.'
  },
  failures: {
    title: 'Failure Mode Diagnostics',
    subtitle: '10-category taxonomy analysis, severity distribution, and developer remediation fixes.'
  },
  reports: {
    title: 'Executive QA Lab Reports',
    subtitle: 'Export audit-grade lab reports in Markdown, JSON benchmarks, or printable formats.'
  },
  settings: {
    title: 'Agent Profiles & Laboratory Settings',
    subtitle: 'Configure target agent API endpoints, step thresholds, and simulated failure behaviors.'
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  agents,
  selectedAgentId,
  setSelectedAgentId,
  isDemoMode,
  setIsDemoMode,
  onRunClick,
  onRefresh,
  isRefreshing,
  onOpenCommandPalette,
}) => {
  const currentInfo = TAB_TITLES[currentTab] || { title: 'AI Failure Detector', subtitle: 'Observability Lab' };

  return (
    <header className="border-b border-obsidian-800 bg-obsidian-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Page Title and Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
          <span className="text-purple-400 font-mono">LAB //</span>
          <span className="capitalize">{currentTab.replace('-', ' ')}</span>
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">{currentInfo.title}</h2>
        <p className="text-xs text-slate-400 hidden sm:block">{currentInfo.subtitle}</p>
      </div>

      {/* Controls & Quick Actions */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Quick Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-obsidian-800/80 border border-obsidian-700/80 hover:border-purple-500/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm group"
            title="Search actions and benchmarks (Ctrl+K or ⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-mono text-[11px] text-slate-400">Search tests...</span>
            <div className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-obsidian-950/70 border border-obsidian-700 text-slate-400">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </button>
        )}

        {/* Demo Mode Toggle Badge */}
        <button
          onClick={() => setIsDemoMode(!isDemoMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            isDemoMode
              ? 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-glow-purple'
              : 'bg-obsidian-800 text-slate-400 border-obsidian-700 hover:text-slate-200'
          }`}
          title="Toggle Simulation vs Live Mode"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isDemoMode ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{isDemoMode ? 'DEMO MODE ACTIVE' : 'LIVE API MODE'}</span>
        </button>

        {/* Agent Profile Selector */}
        <div className="flex items-center gap-2 bg-obsidian-800/80 border border-obsidian-700 rounded-lg px-2.5 py-1 text-xs">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1 font-mono text-xs"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id} className="bg-obsidian-900 text-slate-200">
                {agent.name} ({agent.model})
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-obsidian-800 border border-obsidian-700 hover:bg-obsidian-700/80 text-slate-300 transition-colors disabled:opacity-50"
          title="Refresh Lab Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
        </button>

        {/* Trigger Run Button */}
        <button
          onClick={onRunClick}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-glow-purple transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Quick Run</span>
        </button>
      </div>
    </header>
  );
};
