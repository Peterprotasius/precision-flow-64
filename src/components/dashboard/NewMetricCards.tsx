import { useMemo } from 'react';
import { Activity, TrendingDown, BarChart2, ShieldCheck, Crosshair } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import type { Trade } from '@/lib/mock-data';
import { calcPortfolioStats } from '@/lib/analytics';

interface Props {
  trades: Trade[];
}

function MetricCard({
  label, value, icon, colorClass, badge,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass?: string;
  badge?: { text: string; color: string } | null;
}) {
  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <span className="stat-label">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className={`stat-value ${colorClass || 'text-foreground'}`}>{value}</p>
      {badge && (
        <span className={`mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.color}`}>
          {badge.text}
        </span>
      )}
    </div>
  );
}

export default function NewMetricCards({ trades }: Props) {
  const stats = useMemo(() => {
    const portfolio = calcPortfolioStats(trades);
    const closed = trades.filter(t => t.result === 'win' || t.result === 'loss' || t.result === 'breakeven');

    // Avg risk per trade
    const avgRisk = closed.length > 0
      ? closed.reduce((s, t) => s + t.riskPercent, 0) / closed.length
      : 0;

    // Risk consistency: % of trades within 0.2% of avg risk
    const consistentTrades = closed.filter(t => Math.abs(t.riskPercent - avgRisk) <= 0.2);
    const riskConsistency = closed.length > 0
      ? Math.round((consistentTrades.length / closed.length) * 100)
      : 0;

    return {
      expectancy: portfolio.expectancy,
      maxDrawdown: portfolio.maxDrawdown,
      profitFactor: portfolio.profitFactor,
      avgRisk: Math.round(avgRisk * 100) / 100,
      riskConsistency,
    };
  }, [trades]);

  const expectancyDisplay = useAnimatedCounter(stats.expectancy, 800, 2);
  const maxDDDisplay = useAnimatedCounter(stats.maxDrawdown, 800, 1, '', '%');
  const pfDisplay = useAnimatedCounter(stats.profitFactor, 800, 2);
  const avgRiskDisplay = useAnimatedCounter(stats.avgRisk, 800, 2, '', '%');
  const rcDisplay = useAnimatedCounter(stats.riskConsistency, 800, 0, '', '%');

  const rcBadge = stats.riskConsistency >= 80
    ? { text: 'Consistent', color: 'bg-success/20 text-success' }
    : stats.riskConsistency >= 50
    ? { text: 'Developing', color: 'bg-chart-4/20 text-chart-4' }
    : { text: 'Inconsistent', color: 'bg-loss/20 text-loss' };

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        label="Expectancy"
        value={`${expectancyDisplay}R`}
        icon={<Activity className="h-4 w-4" />}
        colorClass={stats.expectancy >= 0 ? 'text-success' : 'text-loss'}
      />
      <MetricCard
        label="Max Drawdown"
        value={maxDDDisplay}
        icon={<TrendingDown className="h-4 w-4" />}
        colorClass="text-loss"
      />
      <MetricCard
        label="Profit Factor"
        value={pfDisplay}
        icon={<BarChart2 className="h-4 w-4" />}
        colorClass={stats.profitFactor >= 1 ? 'text-success' : 'text-loss'}
      />
      <MetricCard
        label="Avg Risk/Trade"
        value={avgRiskDisplay}
        icon={<Crosshair className="h-4 w-4" />}
      />
      <div className="col-span-2">
        <MetricCard
          label="Risk Consistency"
          value={rcDisplay}
          icon={<ShieldCheck className="h-4 w-4" />}
          colorClass={stats.riskConsistency >= 80 ? 'text-success' : stats.riskConsistency >= 50 ? 'text-chart-4' : 'text-loss'}
          badge={rcBadge}
        />
      </div>
    </div>
  );
}
