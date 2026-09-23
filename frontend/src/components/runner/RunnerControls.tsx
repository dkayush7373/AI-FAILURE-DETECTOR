import React, { useState } from 'react';
import { Agent, TestCase } from '../../types';
import { 
  Play, 
  Cpu, 
  CheckSquare, 
  Square, 
  Sparkles, 
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface RunnerControlsProps {
  agents: Agent[];
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  testCases: TestCase[];
  selectedTestIds: string[];
  setSelectedTestIds: (ids: string[]) => void;
  onLaunchRun: (simulateFailures?: boolean) => void;
  isRunning: boolean;
}

export const RunnerControls: React.FC<RunnerControlsProps> = ({
  agents,
  selectedAgentId,
  setSelectedAgentId,
  testCases,
  selectedTestIds,
  setSelectedTestIds,
  onLaunchRun,
  isRunning,
}) => {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [simulateFailures, setSimulateFailures] = useState(true);

  const categories = ['ALL', 'Basic', 'Complex Reasoning', 'Edge Cases', 'Tool & Execution', 'Quality & Error Handling'];

  const handleSelectAll = () => {
    setSelectedTestIds(testCases.map((tc) => tc.id));
  };

  const handleDeselectAll = () => {
    setSelectedTestIds([]);
  };

  const handleSelectCategory = (cat: string) => {
    if (cat === 'ALL') {
      handleSelectAll();
    } else {
      setSelectedTestIds(testCases.filter((tc) => tc.category === cat).map((tc) => tc.id));
    }
  };

  const toggleTestSelection = (id: string) => {
    if (selectedTestIds.includes(id)) {
      setSelectedTestIds(selectedTestIds.filter((t) => t !== id));
    } else {
      setSelectedTestIds([...selectedTestIds, id]);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-obsidian-800 space-y-5">
      {/* Target Agent & Mode Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-obsidian-800">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            Evaluation Target Profile
          </h3>
          <p className="text-xs text-slate-400">Select agent model under reliability test</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={isRunning}
            className="bg-obsidian-950 border border-obsidian-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.model})
              </option>
            ))}
          </select>

          {/* Simulate Realistic Failures Toggle */}
          <button
            type="button"
            onClick={() => setSimulateFailures(!simulateFailures)}
            disabled={isRunning}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              simulateFailures
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-glow-rose'
                : 'bg-obsidian-950 text-slate-400 border-obsidian-800'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${simulateFailures ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>{simulateFailures ? 'Realistic Failure Simulation' : 'Standard Validation'}</span>
          </button>
        </div>
      </div>

      {/* Test Case Selection Panel */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">Select Tests to Execute</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
              {selectedTestIds.length} of {testCases.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleSelectAll}
              disabled={isRunning}
              className="text-purple-400 hover:text-purple-300 font-medium px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
            >
              Select All (25)
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={isRunning}
              className="text-slate-400 hover:text-slate-200 font-medium px-2 py-1 rounded bg-obsidian-850 hover:bg-obsidian-800 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 mb-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleSelectCategory(cat)}
              disabled={isRunning}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-obsidian-950 border border-obsidian-800 hover:border-purple-500/40 text-slate-300 hover:text-white transition-colors"
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Compact Grid of Test Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-lg bg-obsidian-950 border border-obsidian-800">
          {testCases.map((tc) => {
            const isSelected = selectedTestIds.includes(tc.id);
            return (
              <div
                key={tc.id}
                onClick={() => !isRunning && toggleTestSelection(tc.id)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-purple-600/15 border-purple-500/40 text-purple-200'
                    : 'bg-obsidian-900 border-obsidian-800 text-slate-400 hover:text-slate-200 hover:border-obsidian-700'
                } ${isRunning ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {isSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <div className="truncate">
                  <span className="font-mono font-bold text-[10px] mr-1">{tc.id}</span>
                  <span className="text-[11px] truncate">{tc.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Launch Run CTA */}
      <div className="pt-2 flex items-center justify-between">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Real-time evaluation engine armed and ready.</span>
        </div>

        <button
          onClick={() => onLaunchRun(simulateFailures)}
          disabled={isRunning || selectedTestIds.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm shadow-glow-purple transition-all duration-200 hover:scale-[1.02] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isRunning ? 'Evaluation In Progress...' : `Run Evaluation (${selectedTestIds.length} Tests)`}</span>
        </button>
      </div>
    </div>
  );
};
