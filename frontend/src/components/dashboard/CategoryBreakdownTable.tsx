import React from 'react';
import { CategoryStat } from '../../types';
import { Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CategoryBreakdownTableProps {
  categoryStats: CategoryStat[];
  onSelectCategory?: (category: string) => void;
}

export const CategoryBreakdownTable: React.FC<CategoryBreakdownTableProps> = ({
  categoryStats,
  onSelectCategory,
}) => {
  return (
    <div className="glass-panel rounded-xl p-5 border border-obsidian-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Vulnerability by Category</h3>
          <p className="text-xs text-slate-400">Pass vs fail rates across test suites</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>{categoryStats.length} Suites</span>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-obsidian-800 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium text-center">Total</th>
              <th className="pb-2 font-medium text-center">Pass</th>
              <th className="pb-2 font-medium text-center">Fail</th>
              <th className="pb-2 font-medium text-right">Failure Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800/60 font-mono">
            {categoryStats.map((item, idx) => {
              const isFragile = item.failure_rate > 20;
              return (
                <tr 
                  key={idx} 
                  onClick={() => onSelectCategory?.(item.category)}
                  className="hover:bg-obsidian-850/60 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 font-sans font-medium text-slate-200 flex items-center gap-2">
                    {isFragile ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="truncate max-w-[140px]">{item.category}</span>
                  </td>
                  <td className="py-2.5 text-center text-slate-400">{item.total}</td>
                  <td className="py-2.5 text-center text-emerald-400">{item.passed}</td>
                  <td className="py-2.5 text-center text-rose-400">{item.failed}</td>
                  <td className="py-2.5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.failure_rate === 0
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : item.failure_rate < 20
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}>
                      {item.failure_rate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
