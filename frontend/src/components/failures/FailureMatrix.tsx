import React, { useState } from 'react';
import { Failure } from '../../types';
import { 
  AlertTriangle, 
  Lightbulb, 
  Search, 
  Terminal, 
  Copy, 
  Check, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface FailureMatrixProps {
  failures: Failure[];
  onShowToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const FailureMatrix: React.FC<FailureMatrixProps> = ({ failures, onShowToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    'ALL',
    'Incorrect Answer',
    'Incomplete Response',
    'Tool Execution Failure',
    'Step Limit Exceeded',
    'Timeout',
    'Invalid Output Format',
    'Hallucinated Claim',
    'Error Handling Failure',
    'Unclear Response',
    'Unknown Failure'
  ];

  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filtered = failures.filter((f) => {
    const matchesSearch =
      f.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.test_case_name && f.test_case_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.test_case_id && f.test_case_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || f.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'ALL' || f.severity === selectedSeverity;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
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

  const copyToClipboard = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onShowToast) {
      onShowToast('success', `${label} copied to clipboard!`, text.slice(0, 70) + (text.length > 70 ? '...' : ''));
    }
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="glass-panel rounded-xl p-4 border border-obsidian-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search category, test ID, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono"
          />
        </div>

        {/* Dropdowns */}
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
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer font-mono"
          >
            {severities.map((s) => (
              <option key={s} value={s}>
                Severity: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
        <span>Displaying {filtered.length} of {failures.length} Diagnosed Failure Records</span>
        <span>Standardized 10-Class Taxonomy</span>
      </div>

      {/* Failures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 glass-panel p-8 text-center rounded-xl border border-obsidian-800 text-xs text-slate-400">
            No failures match your filter criteria.
          </div>
        ) : (
          filtered.map((f, idx) => {
            const itemKey = f.id || `fail-${idx}`;
            const isEvidenceCopied = copiedId === `evidence-${itemKey}`;
            const isFixCopied = copiedId === `fix-${itemKey}`;

            return (
              <div
                key={itemKey}
                className="glass-panel glass-panel-hover rounded-xl p-5 border border-obsidian-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Category & Severity Pills */}
                  <div className="flex items-center justify-between gap-2 mb-2 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {f.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityStyle(f.severity)}`}>
                        {f.severity}
                      </span>
                    </div>
                    {f.test_case_id && (
                      <span className="text-[11px] text-slate-400 font-bold">
                        {f.test_case_id}
                      </span>
                    )}
                  </div>

                  {/* Test Name & Description */}
                  <h4 className="text-sm font-bold text-white mb-1">
                    {f.test_case_name || f.test_case_id || 'Evaluation Failure'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                {/* Observed Evidence */}
                {f.evidence && (
                  <div>
                    <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-rose-400" />
                        Observed Anomaly Evidence
                      </span>
                      <button
                        onClick={() => copyToClipboard(f.evidence!, `evidence-${itemKey}`, 'Evidence')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] lowercase"
                        title="Copy anomaly evidence"
                      >
                        {isEvidenceCopied ? (
                          <span className="text-emerald-400 flex items-center gap-0.5"><Check className="w-3 h-3" /> copied</span>
                        ) : (
                          <span className="flex items-center gap-0.5"><Copy className="w-3 h-3" /> copy</span>
                        )}
                      </button>
                    </div>
                    <div className="p-2.5 rounded bg-obsidian-950 border border-obsidian-800 font-mono text-[11px] text-rose-300 whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {f.evidence}
                    </div>
                  </div>
                )}

                {/* Actionable Fix */}
                {f.suggested_fix && (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-400 font-mono text-[11px] mb-1">
                      <div className="flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Prescriptive Remediation Fix</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(f.suggested_fix!, `fix-${itemKey}`, 'Remediation Fix')}
                        className="text-emerald-400/80 hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                        title="Copy suggested fix"
                      >
                        {isFixCopied ? (
                          <span className="text-emerald-300 flex items-center gap-0.5"><Check className="w-3 h-3" /> copied</span>
                        ) : (
                          <span className="flex items-center gap-0.5"><Copy className="w-3 h-3" /> copy fix</span>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-200 leading-relaxed font-mono">
                      {f.suggested_fix}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
