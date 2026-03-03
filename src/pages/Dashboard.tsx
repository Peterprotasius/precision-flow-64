import { useMemo, useState } from 'react';
import { useTrades } from '@/hooks/useTrades';
import StatCard from '@/components/StatCard';
import { TrendingUp, TrendingDown, Target, BarChart3, Trophy, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import DashboardHeader from '@/components/DashboardHeader';
import ProUpgradeModal from '@/components/ProUpgradeModal';
import { useAuth } from '@/hooks/useAuth';
import NewMetricCards from '@/components/dashboard/NewMetricCards';
import EdgeScoreWidget from '@/components/dashboard/EdgeScoreWidget';
import EnhancedEquityCurve from '@/components/dashboard/EnhancedEquityCurve';
import TodaySummaryCard from '@/components/dashboard/TodaySummaryCard';
import SampleSizeWarning from '@/components/dashboard/SampleSizeWarning';

export default function Dashboard() {
  const { data: trades = [], isLoading } = useTrades();

  const stats = useMemo(() => {
    const closedTrades = trades.filter(t => t.result === 'win' || t.result === 'loss');
    const wins = closedTrades.filter(t => t.result === 'win');
    const losses = closedTrades.filter(t => t.result === 'loss');
    const totalPL = closedTrades.reduce((sum, t) => sum + t.profitLossAmount, 0);
    const avgRR = closedTrades.length > 0
      ? closedTrades.reduce((sum, t) => sum + t.rrRatio, 0) / closedTrades.length
      : 0;

    const pairPL: Record<string, { pl: number; count: number }> = {};
    closedTrades.forEach(t => {
      if (!pairPL[t.pair]) pairPL[t.pair] = { pl: 0, count: 0 };
      pairPL[t.pair].pl += t.profitLossAmount;
      pairPL[t.pair].count++;
    });
    // Only show pairs with >= 5 trades
    const qualifiedPairs = Object.entries(pairPL).filter(([, v]) => v.count >= 5);
    const sortedPairs = qualifiedPairs.sort((a, b) => b[1].pl - a[1].pl);
    const bestPair = sortedPairs[0]?.[0] || '—';
    const worstPair = sortedPairs[sortedPairs.length - 1]?.[0] || '—';

    let running = 0;
    const equityCurve = closedTrades
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((t, i) => {
        running += t.profitLossAmount;
        return { trade: i + 1, equity: running, date: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      });

    return { total: closedTrades.length, winRate: closedTrades.length > 0 ? Math.round((wins.length / closedTrades.length) * 100) : 0, totalPL, avgRR: avgRR.toFixed(1), bestPair, worstPair, wins: wins.length, losses: losses.length, equityCurve };
  }, [trades]);

  const pieData = [
    { name: 'Wins', value: stats.wins },
    { name: 'Losses', value: stats.losses },
  ];
  const PIE_COLORS = ['hsl(152, 60%, 48%)', 'hsl(0, 72%, 55%)'];

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { subscribed } = useAuth();

  // Check if best/worst pair has enough trades for tooltip
  const hasPairData = stats.bestPair !== '—';

  if (isLoading) return <div className="px-4 pt-6"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="px-4 pt-6 space-y-5">
      <DashboardHeader />

      {!subscribed && (
        <button
          onClick={() => setUpgradeOpen(true)}
          className="w-full text-left relative overflow-hidden rounded-xl border border-chart-4/30 bg-gradient-to-r from-chart-4/10 via-chart-5/10 to-primary/10 p-4 animate-fade-in"
        >
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-chart-4/10 blur-2xl" />
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chart-4/20">
              <TrendingUp className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm">Try Pro Analytics Free</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-chart-4/20 text-chart-4 px-1.5 py-0.5 rounded">Limited Time</span>
              </div>
              <p className="text-xs text-muted-foreground">Unlock advanced insights, Edge Score, AI Coach & unlimited trades.</p>
            </div>
          </div>
        </button>
      )}

      {/* Existing metric cards — unchanged */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Trades" value={stats.total} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} icon={<Target className="h-4 w-4" />} trend={stats.winRate >= 50 ? 'up' : 'down'} />
        <StatCard
          label="Total P/L"
          value={`${stats.totalPL >= 0 ? '+' : ''}$${stats.totalPL.toFixed(0)}`}
          icon={stats.totalPL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          trend={stats.totalPL >= 0 ? 'up' : 'down'}
        />
        <StatCard label="Avg R:R" value={`${stats.avgRR}:1`} icon={<Target className="h-4 w-4" />} />
        <div className="relative group">
          <StatCard label="Best Pair" value={stats.bestPair} icon={<Trophy className="h-4 w-4" />} trend={hasPairData ? 'up' : undefined} />
          {!hasPairData && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover border border-border rounded-lg text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              Minimum 5 trades required for pair ranking
            </div>
          )}
        </div>
        <div className="relative group">
          <StatCard label="Worst Pair" value={stats.worstPair} icon={<AlertTriangle className="h-4 w-4" />} trend={hasPairData ? 'down' : undefined} />
          {!hasPairData && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover border border-border rounded-lg text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              Minimum 5 trades required for pair ranking
            </div>
          )}
        </div>
      </div>

      {/* NEW: Sample size warning */}
      <SampleSizeWarning tradeCount={stats.total} />

      {/* NEW: Additional metric cards (1A) */}
      <NewMetricCards trades={trades} />

      {/* NEW: Edge Score Widget (1B) */}
      <EdgeScoreWidget trades={trades} />

      {/* UPGRADED: Enhanced Equity Curve (1C) — replaces old simple curve */}
      <EnhancedEquityCurve trades={trades} />

      {/* Win/Loss Pie — existing, untouched */}
      <div className="glass-card p-4 animate-slide-up">
        <h2 className="stat-label mb-3">Win vs Loss</h2>
        <div className="flex items-center justify-center gap-8">
          <div className="h-32 w-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-success" />
              <span className="text-sm text-foreground">{stats.wins} Wins</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-loss" />
              <span className="text-sm text-foreground">{stats.losses} Losses</span>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Today's Summary Card (1D) */}
      <TodaySummaryCard trades={trades} />

      <ProUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
