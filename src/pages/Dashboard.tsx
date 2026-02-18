import { useMemo, useState } from 'react';
import { useTrades } from '@/hooks/useTrades';
import StatCard from '@/components/StatCard';
import { TrendingUp, TrendingDown, Target, BarChart3, Trophy, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import DashboardHeader from '@/components/DashboardHeader';
import ProUpgradeModal from '@/components/ProUpgradeModal';
import { useAuth } from '@/hooks/useAuth';

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

    const pairPL: Record<string, number> = {};
    closedTrades.forEach(t => { pairPL[t.pair] = (pairPL[t.pair] || 0) + t.profitLossAmount; });
    const sortedPairs = Object.entries(pairPL).sort((a, b) => b[1] - a[1]);
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
        <StatCard label="Best Pair" value={stats.bestPair} icon={<Trophy className="h-4 w-4" />} trend="up" />
        <StatCard label="Worst Pair" value={stats.worstPair} icon={<AlertTriangle className="h-4 w-4" />} trend="down" />
      </div>

      {/* Equity Curve */}
      <div className="glass-card p-4 animate-slide-up">
        <h2 className="stat-label mb-3">Equity Curve</h2>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.equityCurve}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(220, 18%, 14%)', border: '1px solid hsl(220, 14%, 22%)', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: 'hsl(210, 20%, 92%)' }}
                formatter={(value: number) => [`$${value}`, 'Equity']}
              />
              <Area type="monotone" dataKey="equity" stroke="hsl(174, 72%, 46%)" fill="url(#equityGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win/Loss Pie */}
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

      <ProUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

