import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PassFailChartProps {
  passed: number;
  failed: number;
}

export const PassFailChart: React.FC<PassFailChartProps> = ({ passed, failed }) => {
  const total = passed + failed;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const data = [
    { name: 'Passed', value: passed, color: '#10b981' },
    { name: 'Failed', value: failed, color: '#f43f5e' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
      return (
        <div className="bg-obsidian-900 border border-obsidian-700 p-2.5 rounded-lg text-xs shadow-xl font-mono">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.payload.color }} />
            <span className="text-white font-semibold">{p.name}</span>
          </div>
          <p className="text-slate-300">{p.value} tests ({pct}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-obsidian-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Pass vs. Fail Distribution</h3>
          <p className="text-xs text-slate-400">Total verified outcomes</p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-obsidian-850 text-slate-300 border border-obsidian-700">
          {total} Executions
        </span>
      </div>

      <div className="relative flex-1 min-h-[200px] flex items-center justify-center">
        {total === 0 ? (
          <div className="text-xs text-slate-400">No test data available</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0d0f17" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center metric indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-white">{passRate}%</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Reliability</span>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-obsidian-800 mt-2 text-xs">
        <div className="flex items-center justify-between p-2 rounded bg-obsidian-850/60 border border-obsidian-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Passed</span>
          </div>
          <span className="font-mono font-bold text-emerald-400">{passed}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-obsidian-850/60 border border-obsidian-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">Failed</span>
          </div>
          <span className="font-mono font-bold text-rose-400">{failed}</span>
        </div>
      </div>
    </div>
  );
};
