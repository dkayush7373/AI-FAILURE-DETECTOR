import React, { useState } from 'react';
import { TestCase } from '../../types';
import { 
  Search, 
  Filter, 
  Play, 
  Edit, 
  Plus, 
  Clock, 
  Footprints, 
  ChevronRight,
  ShieldAlert,
  Code2
} from 'lucide-react';

interface TestCaseListProps {
  testCases: TestCase[];
  onSelectTestCase: (tc: TestCase) => void;
  onRunSingleTest: (tc: TestCase) => void;
  onOpenCreateModal: () => void;
}

export const TestCaseList: React.FC<TestCaseListProps> = ({
  testCases,
  onSelectTestCase,
  onRunSingleTest,
  onOpenCreateModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  const categories = ['ALL', 'Basic', 'Complex Reasoning', 'Edge Cases', 'Tool & Execution', 'Quality & Error Handling'];
  const priorities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredTests = testCases.filter((tc) => {
    const matchesSearch =
      tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tc.input_prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || tc.category === selectedCategory;
    const matchesPriority = selectedPriority === 'ALL' || tc.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'LOW':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Basic':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'Complex Reasoning':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Edge Cases':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Tool & Execution':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'Quality & Error Handling':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="glass-panel rounded-xl p-4 border border-obsidian-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test ID, name, or prompt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Category & Priority Selectors */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-glow-purple transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Test Case</span>
          </button>
        </div>
      </div>

      {/* Test Cases Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
        <span>Showing {filteredTests.length} of {testCases.length} Canonical Benchmark Tests</span>
        <span>Suite: TC-001 through TC-025</span>
      </div>

      {/* Test Cases Table */}
      <div className="glass-panel rounded-xl border border-obsidian-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-obsidian-800 bg-obsidian-900/80 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
                <th className="py-3 px-4 font-semibold w-24">ID</th>
                <th className="py-3 px-4 font-semibold">Test Name & Evaluation Intent</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-center">Priority</th>
                <th className="py-3 px-4 font-semibold text-center">SLAs</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800/60">
              {filteredTests.map((tc) => (
                <tr
                  key={tc.id}
                  className="hover:bg-obsidian-850/70 transition-colors group cursor-pointer"
                  onClick={() => onSelectTestCase(tc)}
                >
                  {/* ID */}
                  <td className="py-3 px-4 font-mono font-bold text-purple-400 whitespace-nowrap">
                    {tc.id}
                  </td>

                  {/* Name & Prompt Preview */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {tc.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-md mt-0.5 font-mono">
                      {tc.input_prompt ? `"${tc.input_prompt}"` : '<Empty prompt test>'}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getCategoryBadge(tc.category)}`}>
                      {tc.category}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getPriorityBadge(tc.priority)}`}>
                      {tc.priority}
                    </span>
                  </td>

                  {/* SLAs */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3 font-mono text-[11px] text-slate-400">
                      <span className="flex items-center gap-1" title="Max response time">
                        <Clock className="w-3 h-3 text-cyan-400" /> {tc.max_time}s
                      </span>
                      <span className="flex items-center gap-1" title="Max allowed step depth">
                        <Footprints className="w-3 h-3 text-purple-400" /> {tc.max_steps} steps
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onRunSingleTest(tc)}
                        className="px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all text-[11px] font-medium flex items-center gap-1"
                        title="Run single test evaluation"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run</span>
                      </button>
                      <button
                        onClick={() => onSelectTestCase(tc)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-obsidian-800 transition-colors"
                        title="View specifications"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
