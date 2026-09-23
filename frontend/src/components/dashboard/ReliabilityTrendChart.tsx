import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { ReliabilityTrendPoint } from '../../types';

interface ReliabilityTrendChartProps {
  trendData: ReliabilityTrendPoint[];
}

export const ReliabilityTrendChart: React.FC<ReliabilityTrendChartProps> = ({ trendData }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-obsidian-900 border border-obsidian-700 p-3 rounded-lg shadow-xl text-xs font-mono">
          <div className="text-purple-400 font-semibold mb-1">{data.run_id} ({data.agent_name})</div>
          <div className="text-slate-300">Timestamp: {data.started_at}</div>
          <div className="text-emerald-400 font-bold mt-1">Success Rate: {data.success_rate}%</div>
          <div className="text-slate-400">Passed: {data.passed} / {data.total_tests}</div>
          <div className="text-slate-400">Cost: ${data.total_cost.toFixed(4)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-obsidian-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Reliability Trend Over Evaluation Runs</h3>
          <p className="text-xs text-slate-400">Success rate progression across evaluation benchmarks</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[11px] font-mono text-slate-400">{trendData.length} Tracked Runs</span>
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
        {trendData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            No historical run data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2438" />
              <XAxis 
                dataKey="run_id" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                tickFormatter={(id) => id.replace('run-', '#')} 
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="success_rate"
                name="Success Rate"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 1.5, r: 4 }}
                activeDot={{ r: 6, fill: '#a855f7', stroke: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="pt-3 border-t border-obsidian-800 mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Target SLA Threshold: <strong className="text-emerald-400">90.0%</strong></span>
        <span>Observability Benchmark</span>
      </div>
    </div>
  );
};
