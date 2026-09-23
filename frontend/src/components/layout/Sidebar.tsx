import React from 'react';
import { 
  LayoutDashboard, 
  FlaskConical, 
  PlayCircle, 
  History, 
  AlertTriangle, 
  FileText, 
  Settings, 
  ShieldAlert,
  Activity,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  health: { status: string; database: string; demo_mode: boolean; stats: any } | null;
  onOpenNewRun: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  health,
  onOpenNewRun,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Lab Dashboard', icon: LayoutDashboard },
    { id: 'test-cases', label: 'Test Suite (25)', icon: FlaskConical },
    { id: 'runner', label: 'Test Runner', icon: PlayCircle },
    { id: 'evaluations', label: 'Evaluation Runs', icon: History },
    { id: 'failures', label: 'Failure Analysis', icon: AlertTriangle },
    { id: 'reports', label: 'Lab Reports', icon: FileText },
    { id: 'settings', label: 'Agents & Config', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-obsidian-900 border-r border-obsidian-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand & Logo */}
      <div className="p-5 border-b border-obsidian-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-glow-purple">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              AI FAILURE <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono border border-purple-500/30">LAB</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Test. Fail. Improve.</p>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-4">
        <button
          onClick={onOpenNewRun}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium text-sm shadow-glow-purple transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Run Evaluation</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Observability Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.id === 'failures' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-obsidian-800 bg-obsidian-950/60">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            System Ready
          </span>
          <span className="text-[10px] font-mono text-slate-400">v1.0.0</span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>Database: SQLite</span>
          <span className="text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </span>
        </div>
        {health?.stats && (
          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            {health.stats.test_cases || 25} Tests • {health.stats.agents || 4} Profiles
          </div>
        )}
      </div>
    </aside>
  );
};
