import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Clock, 
  Cpu, 
  DollarSign, 
  ShieldCheck, 
  TrendingUp 
} from 'lucide-react';
import { AnalyticsSummary } from '../../types';

interface MetricCardsProps {
  analytics: AnalyticsSummary | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ analytics }) => {
  const successRate = analytics?.overall_success_rate ?? 0;
  const passed = analytics?.overall_passed ?? 0;
  const failed = analytics?.overall_failed ?? 0;
  const total = analytics?.total_tests_executed ?? 0;
  const avgTime = analytics?.avg_response_time ?? 0;
  const avgSteps = analytics?.avg_steps_used ?? 0;
  const totalCost = analytics?.total_cost ?? 0;

  const cards = [
    {
      title: 'Reliability Score',
      value: `${successRate}%`,
      subtitle: `${passed} of ${total} tests passed`,
      icon: ShieldCheck,
      color: successRate >= 80 ? 'text-emerald-400' : 'text-amber-400',
      bgGlow: successRate >= 80 ? 'shadow-glow-emerald' : '',
      accentBorder: successRate >= 80 ? 'border-emerald-500/30' : 'border-amber-500/30',
      badge: successRate >= 85 ? 'Healthy' : 'Needs Review',
      badgeColor: successRate >= 85 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
    },
    {
      title: 'Pass / Fail Count',
      value: `${passed} / ${failed}`,
      subtitle: `${failed} detected failure modes`,
      icon: Activity,
      color: 'text-indigo-400',
      bgGlow: '',
      accentBorder: 'border-indigo-500/30',
      badge: `${analytics?.total_runs ?? 0} Runs`,
      badgeColor: 'bg-indigo-500/20 text-indigo-300'
    },
    {
      title: 'Average Latency',
      value: `${avgTime}s`,
      subtitle: 'Mean response duration',
      icon: Clock,
      color: avgTime <= 3.5 ? 'text-cyan-400' : 'text-rose-400',
      bgGlow: '',
      accentBorder: 'border-cyan-500/30',
      badge: avgTime <= 4.0 ? 'SLA Passed' : 'SLA Warning',
      badgeColor: avgTime <= 4.0 ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'
    },
    {
      title: 'Average Step Depth',
      value: `${avgSteps}`,
      subtitle: 'Steps per test execution',
      icon: Cpu,
      color: 'text-purple-400',
      bgGlow: '',
      accentBorder: 'border-purple-500/30',
      badge: 'Multi-Step',
      badgeColor: 'bg-purple-500/20 text-purple-300'
    },
    {
      title: 'Benchmark API Cost',
      value: `$${totalCost.toFixed(4)}`,
      subtitle: 'Token utilization estimate',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgGlow: '',
      accentBorder: 'border-emerald-500/30',
      badge: 'Cost Tracked',
      badgeColor: 'bg-emerald-500/20 text-emerald-300'
    },
    {
      title: 'Active Test Suite',
      value: '25 Tests',
      subtitle: '5 Evaluation Categories',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgGlow: '',
      accentBorder: 'border-purple-500/30',
      badge: '100% Seeded',
      badgeColor: 'bg-purple-500/20 text-purple-300'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between border ${card.accentBorder} relative overflow-hidden`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className={`p-2 rounded-lg bg-obsidian-850 border border-obsidian-700/60 ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">{card.value}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-obsidian-800 text-[11px]">
                <span className="text-slate-400 truncate">{card.subtitle}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
