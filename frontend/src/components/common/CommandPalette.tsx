import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FlaskConical, 
  LayoutDashboard, 
  PlayCircle, 
  History, 
  AlertTriangle, 
  FileText, 
  Settings, 
  Play, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  X,
  Zap
} from 'lucide-react';
import { TestCase } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  testCases: TestCase[];
  onSelectTab: (tab: string) => void;
  onSelectTestCase: (tc: TestCase) => void;
  onRunTest: (tc: TestCase) => void;
  onQuickRun: () => void;
  onToggleDemoMode: () => void;
  isDemoMode: boolean;
  onRefresh: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  testCases,
  onSelectTab,
  onSelectTestCase,
  onRunTest,
  onQuickRun,
  onToggleDemoMode,
  isDemoMode,
  onRefresh,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  interface PaletteItem {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    icon: any;
    action: () => void;
    data?: TestCase;
  }

  // Build items list
  const navActions: PaletteItem[] = [
    { id: 'nav-dashboard', type: 'nav', title: 'Go to Lab Dashboard', subtitle: 'Overview & Reliability KPIs', icon: LayoutDashboard, action: () => onSelectTab('dashboard') },
    { id: 'nav-test-cases', type: 'nav', title: 'Go to Test Cases Suite', subtitle: 'Browse all 25 canonical benchmarks', icon: FlaskConical, action: () => onSelectTab('test-cases') },
    { id: 'nav-runner', type: 'nav', title: 'Go to Interactive Test Runner', subtitle: 'Execute and observe step traces', icon: PlayCircle, action: () => onSelectTab('runner') },
    { id: 'nav-evaluations', type: 'nav', title: 'Go to Historical Evaluation Runs', subtitle: 'Audit past test sessions', icon: History, action: () => onSelectTab('evaluations') },
    { id: 'nav-failures', type: 'nav', title: 'Go to Failure Analysis Matrix', subtitle: '10-category taxonomy & remediation', icon: AlertTriangle, action: () => onSelectTab('failures') },
    { id: 'nav-reports', type: 'nav', title: 'Go to Lab Reports Generator', subtitle: 'Markdown & JSON audit export', icon: FileText, action: () => onSelectTab('reports') },
    { id: 'nav-settings', type: 'nav', title: 'Go to Settings & Agent Profiles', subtitle: 'Configure models & endpoints', icon: Settings, action: () => onSelectTab('settings') },
  ];

  const quickActions: PaletteItem[] = [
    { id: 'action-quick-run', type: 'action', title: 'Launch Quick Evaluation Run', subtitle: 'Execute active test batch', icon: Play, action: onQuickRun },
    { id: 'action-toggle-demo', type: 'action', title: isDemoMode ? 'Switch to Live API Mode' : 'Switch to Demo Mode (Simulator)', subtitle: `Currently: ${isDemoMode ? 'Demo Simulator' : 'Live API'}`, icon: Sparkles, action: onToggleDemoMode },
    { id: 'action-refresh', type: 'action', title: 'Refresh All Lab Data', subtitle: 'Synchronize evaluations and analytics', icon: RefreshCw, action: onRefresh },
  ];

  const testItems: PaletteItem[] = testCases.map((tc) => ({
    id: `tc-${tc.id}`,
    type: 'test',
    title: `${tc.id}: ${tc.name}`,
    subtitle: `${tc.category} • Priority: ${tc.priority} • Max SLA: ${tc.max_time}s`,
    icon: Zap,
    data: tc,
    action: () => onSelectTestCase(tc),
  }));

  const allItems = [...quickActions, ...navActions, ...testItems];

  const filteredItems = allItems.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        current.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-obsidian-900 border border-obsidian-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-obsidian-800 flex items-center gap-3 bg-obsidian-950/40">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search test cases, actions, views, or commands... (e.g. TC-007, runner, yaml)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none font-mono"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-800 text-slate-400 border border-obsidian-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              No matching test cases or actions found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-600/20 text-white border border-purple-500/40 shadow-glow-purple'
                      : 'text-slate-300 hover:bg-obsidian-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg border ${
                      item.type === 'action' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      item.type === 'test' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}>
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-mono truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.type === 'test' && item.data && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRunTest(item.data as TestCase);
                          onClose();
                        }}
                        className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-[10px] text-white font-mono font-medium flex items-center gap-1 transition-colors"
                        title="Run this test now"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Run</span>
                      </button>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <span>Jump</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-obsidian-800 bg-obsidian-950/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-obsidian-800 border border-obsidian-700 text-white text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-obsidian-800 border border-obsidian-700 text-white text-[10px]">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-obsidian-800 border border-obsidian-700 text-white text-[10px]">↵</kbd>
              <span>Select</span>
            </span>
          </div>
          <span>{filteredItems.length} items available</span>
        </div>
      </div>
    </div>
  );
};
