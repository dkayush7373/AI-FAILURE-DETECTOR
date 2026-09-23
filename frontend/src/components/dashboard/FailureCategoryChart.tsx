import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { FailureCategoryDistribution } from '../../types';

interface FailureCategoryChartProps {
  categories: FailureCategoryDistribution[];
}

export const FailureCategoryChart: React.FC<FailureCategoryChartProps> = ({ categories }) => {
  // Show non-zero categories first, or top categories
  const displayData = categories && categories.length > 0
    ? categories.slice(0, 8)
    : [];

  const CATEGORY_COLORS: Record<string, string> = {
    'Incorrect Answer': '#f43f5e',
    'Incomplete Response': '#fb7185',
    'Tool Execution Failure': '#e11d48',
    'Step Limit Exceeded': '#8b5cf6',
    'Timeout': '#ec4899',
    'Invalid Output Format': '#a855f7',
    'Hallucinated Claim': '#ef4444',
    'Error Handling Failure': '#f97316',
    'Unclear Response': '#eab308',
    'Unknown Failure': '#64748b'
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-obsidian-900 border border-obsidian-700 p-3 rounded-lg shadow-xl text-xs font-mono">
          <div className="font-semibold text-white mb-1">{p.category}</div>
          <div className="text-purple-400">Occurrences: <span className="text-white font-bold">{p.count}</span></div>
          <div className="text-slate-400">Share: <span className="text-slate-200">{p.percentage}%</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-obsidian-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Top AI Failure Modes</h3>
          <p className="text-xs text-slate-400">Distribution across 10 failure categories</p>
        </div>
        <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
          Taxonomy Analysis
        </span>
      </div>

      <div className="flex-1 min-h-[220px]">
        {displayData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            No failure modes recorded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              layout="vertical"
              data={displayData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis 
                type="category" 
                dataKey="category" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                width={130}
                tickFormatter={(val) => val.length > 16 ? `${val.substring(0, 16)}...` : val}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {displayData.map((entry, index) => (
                  <Cell 
                    key={`bar-${index}`} 
                    fill={CATEGORY_COLORS[entry.category] || '#8b5cf6'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="pt-3 border-t border-obsidian-800 mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Most common: <strong className="text-purple-300">{displayData[0]?.category || 'N/A'}</strong></span>
        <span>Standard 10-Class Classification</span>
      </div>
    </div>
  );
};
