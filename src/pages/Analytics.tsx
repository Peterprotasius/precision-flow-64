import { useMemo, useState } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { useAuth } from '@/hooks/useAuth';
import { calcPortfolioStats, calcEdgeScore, edgeScoreLabel, calcDisciplineScore } from '@/lib/analytics';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { Lock, TrendingUp, TrendingDown, Target, BarChart3, Shield, Zap } from 'lucide-react';
import ProUpgradeModal from '@/components/ProUpgradeModal';

function LockedOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm z-10">
      <Lock className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm font-semibold text-foreground mb-1">Pro Feature</p>
      <p className="text-xs text-muted-foreground text-center px-4 mb-3">Upgrade to unlock institutional analytics</p>
      <button
        onClick={onUpgrade}
        className="bg-chart-4 text-background text-xs font-bold px-4 py-2 rounded-lg hover:bg-chart-4/90 transition-colors"
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

export default function Analytics() {
  const { data: trades = [], isLoading } = useTrades();
  const { subscribed } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const stats = useMemo(() => calcPortfolioStats(trades), [trades]);

  const sessionData = Object.entries(stats.sessionStats).map(([session, { wins, losses }]) => ({
    session,
    'Win Rate': wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
    wins, losses,
  }));

  const tfData = Object.entries(stats.tfStats).map(([tf, { wins, losses }]) => ({
    tf,
    'Win Rate': wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
  }));

  const setupData = [
    { name: 'Full SMC', count: stats.setupStats.fullSMC.length, wr: stats.setupStats.fullSMC.length > 0 ? Math.round(stats.setupStats.fullSMC.filter(t => t.result === 'win').length / stats.setupStats.fullSMC.length * 100) : 0 },
    { name: 'BOS Only', count: stats.setupStats.bosOnly.length, wr: stats.setupStats.bosOnly.length > 0 ? Math.round(stats.setupStats.bosOnly.filter(t => t.result === 'win').length / stats.setupStats.bosOnly.length * 100) : 0 },
    { name: 'Liq. Sweep', count: stats.setupStats.liquiditySweep.length, wr: stats.setupStats.liquiditySweep.length > 0 ? Math.round(stats.setupStats.liquiditySweep.filter(t => t.result === 'win').length / stats.setupStats.liquiditySweep.length * 100) : 0 },
    { name: 'Order Block', count: stats.setupStats.orderBlock.length, wr: stats.setupStats.orderBlock.length > 0 ? Math.round(stats.setupStats.orderBlock.filter(t => t.result === 'win').length / stats.setupStats.orderBlock.length * 100) : 0 },
  ].filter(d => d.count > 0);

  const recentEdge = trades.length > 0 ? calcEdgeScore(trades[0], trades) : 0;
  const edgeMeta = edgeScoreLabel(recentEdge);
  const recentDiscipline = trades.length > 0 ? calcDisciplineScore(trades[0], trades) : 0;

  if (isLoading) return <div className="px-4 pt-6"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="px-4 pt-6 pb-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Institutional performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total R', value: `${stats.totalR > 0 ? '+' : ''}${stats.totalR}R`, icon: <TrendingUp className="h-4 w-4" />, color: stats.totalR >= 0 ? 'text-success' : 'text-loss' },
          { label: 'Profit Factor', value: stats.profitFactor.toString(), icon: <Target className="h-4 w-4" />, color: stats.profitFactor >= 1.5 ? 'text-success' : 'text-loss' },
          { label: 'Expectancy', value: `${stats.expectancy}R`, icon: <BarChart3 className="h-4 w-4" />, color: stats.expectancy > 0 ? 'text-success' : 'text-loss' },
          { label: 'Max Drawdown', value: `${stats.maxDrawdown}%`, icon: <TrendingDown className="h-4 w-4" />, color: stats.maxDrawdown > 20 ? 'text-loss' : 'text-chart-4' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="glass-card p-3">
            <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">{icon}<span className="text-[10px] uppercase tracking-wider">{label}</span></div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Edge Score & Discipline — Pro */}
      <div className="relative">
        <div className={`glass-card p-4 space-y-3 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
          <h2 className="stat-label">Institutional Scores</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Edge Score</p>
              <p className="text-2xl font-bold text-primary">{recentEdge}</p>
              <p className={`text-[10px] font-semibold ${edgeMeta.color}`}>{edgeMeta.label}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Discipline</p>
              <p className="text-2xl font-bold text-chart-4">{recentDiscipline}</p>
              <p className="text-[10px] text-muted-foreground">/ 100</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Avg R/Trade', value: `${stats.avgR}R` },
              { label: 'Win Rate', value: `${stats.winRate}%` },
              { label: 'Trades', value: stats.closed.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-secondary/30 rounded-lg p-2">
                <p className="text-xs font-bold text-foreground">{value}</p>
                <p className="text-[9px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
        {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
      </div>

      {/* R-based Equity Curve */}
      <div className="glass-card p-4">
        <h2 className="stat-label mb-3">R-Multiple Equity Curve</h2>
        {stats.equityCurve.length < 2 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Need more trades for equity curve</p>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityCurve}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}R`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(220, 18%, 14%)', border: '1px solid hsl(220, 14%, 22%)', borderRadius: '8px', fontSize: 11 }}
                  formatter={(v: number) => [`${v}R`, 'Cumulative R']}
                />
                <Area type="monotone" dataKey="equity" stroke="hsl(174, 72%, 46%)" fill="url(#rGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Session Performance — Pro */}
      <div className="relative">
        <div className={`glass-card p-4 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
          <h2 className="stat-label mb-3">Session Performance</h2>
          {sessionData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No session data yet</p>
          ) : (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionData}>
                  <XAxis dataKey="session" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 18%, 14%)', border: '1px solid hsl(220, 14%, 22%)', borderRadius: '8px', fontSize: 11 }} />
                  <Bar dataKey="Win Rate" fill="hsl(174, 72%, 46%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
      </div>

      {/* Setup Win Rates — Pro */}
      <div className="relative">
        <div className={`glass-card p-4 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
          <h2 className="stat-label mb-3">Setup Type Win Rates</h2>
          {setupData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No setup data yet</p>
          ) : (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setupData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 18%, 14%)', border: '1px solid hsl(220, 14%, 22%)', borderRadius: '8px', fontSize: 11 }} />
                  <Bar dataKey="wr" fill="hsl(152, 60%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
      </div>

      {/* Timeframe Heatmap — Pro */}
      <div className="relative">
        <div className={`glass-card p-4 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
          <h2 className="stat-label mb-3">Timeframe Heatmap</h2>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(stats.tfStats).map(([tf, { wins, losses }]) => {
              const total = wins + losses;
              const wr = total > 0 ? Math.round((wins / total) * 100) : 0;
              const color = wr >= 60 ? 'bg-success/20 border-success/30 text-success' : wr >= 40 ? 'bg-chart-4/20 border-chart-4/30 text-chart-4' : 'bg-loss/20 border-loss/30 text-loss';
              return (
                <div key={tf} className={`rounded-lg border p-3 text-center ${color}`}>
                  <p className="text-xs font-bold">{tf}</p>
                  <p className="text-lg font-bold">{wr}%</p>
                  <p className="text-[9px] opacity-70">{total} trades</p>
                </div>
              );
            })}
          </div>
        </div>
        {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
      </div>

      <ProUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
