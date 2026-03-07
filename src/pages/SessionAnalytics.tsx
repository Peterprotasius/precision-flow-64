import { useMemo, useState } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { useAuth } from '@/hooks/useAuth';
import { calcEdgeScore, calcDisciplineScore } from '@/lib/analytics';
import type { Trade } from '@/lib/mock-data';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from 'recharts';
import { Lock, Clock, Layers, Target, TrendingUp, Zap } from 'lucide-react';
import ProUpgradeModal from '@/components/ProUpgradeModal';

function LockedOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm z-10">
      <Lock className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm font-semibold text-foreground mb-1">Pro Feature</p>
      <button onClick={onUpgrade} className="bg-chart-4 text-background text-xs font-bold px-4 py-2 rounded-lg hover:bg-chart-4/90 transition-colors">
        Upgrade to Pro
      </button>
    </div>
  );
}

type TabKey = 'session' | 'strategy' | 'timeframe';

const SESSIONS = ['Asia', 'London', 'New York'] as const;
const SESSION_COLORS = ['hsl(var(--chart-5))', 'hsl(var(--primary))', 'hsl(var(--chart-4))'];

function getSession(createdAt: string): string {
  const hour = new Date(createdAt).getUTCHours();
  if (hour >= 0 && hour < 8) return 'Asia';
  if (hour >= 8 && hour < 14) return 'London';
  return 'New York';
}

function getStrategy(trade: Trade): string {
  if (trade.bosPresent && trade.liquiditySweep && trade.orderBlock) return 'Full SMC';
  if (trade.bosPresent && trade.liquiditySweep) return 'BOS + Liq Sweep';
  if (trade.bosPresent && trade.orderBlock) return 'BOS + OB';
  if (trade.liquiditySweep) return 'Liquidity Sweep';
  if (trade.orderBlock) return 'Order Block';
  if (trade.bosPresent) return 'BOS Only';
  return 'No Confluence';
}

export default function SessionAnalytics() {
  const { data: trades = [], isLoading } = useTrades();
  const { subscribed } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('session');

  const closed = useMemo(() => trades.filter(t => t.result === 'win' || t.result === 'loss'), [trades]);

  // ── Session Stats ──
  const sessionStats = useMemo(() => {
    return SESSIONS.map(session => {
      const sessionTrades = closed.filter(t => getSession(t.createdAt) === session);
      const wins = sessionTrades.filter(t => t.result === 'win').length;
      const total = sessionTrades.length;
      const wr = total > 0 ? Math.round((wins / total) * 100) : 0;
      const avgR = total > 0 ? Math.round(sessionTrades.reduce((s, t) => s + t.rrRatio, 0) / total * 100) / 100 : 0;
      const pnl = sessionTrades.reduce((s, t) => s + t.profitLossAmount, 0);
      return { session, wins, losses: total - wins, total, wr, avgR, pnl: Math.round(pnl) };
    });
  }, [closed]);

  // ── Strategy Stats ──
  const strategyStats = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    closed.forEach(t => {
      const s = getStrategy(t);
      if (!map[s]) map[s] = [];
      map[s].push(t);
    });
    return Object.entries(map)
      .map(([strategy, trades]) => {
        const wins = trades.filter(t => t.result === 'win').length;
        const total = trades.length;
        const avgDiscipline = Math.round(trades.reduce((s, t) => s + calcDisciplineScore(t, closed), 0) / total);
        const pnl = trades.reduce((s, t) => s + t.profitLossAmount, 0);
        return {
          strategy, total, wins, losses: total - wins,
          wr: Math.round((wins / total) * 100),
          avgDiscipline,
          pnl: Math.round(pnl),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [closed]);

  // ── Timeframe Stats ──
  const timeframeStats = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    closed.forEach(t => {
      if (!map[t.timeframe]) map[t.timeframe] = [];
      map[t.timeframe].push(t);
    });
    return Object.entries(map)
      .map(([tf, trades]) => {
        const wins = trades.filter(t => t.result === 'win').length;
        const total = trades.length;
        const pnl = trades.reduce((s, t) => s + t.profitLossAmount, 0);
        return {
          tf, total, wins, losses: total - wins,
          wr: Math.round((wins / total) * 100),
          pnl: Math.round(pnl),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [closed]);

  // Radar data for session
  const radarData = sessionStats.map(s => ({
    subject: s.session,
    'Win Rate': s.wr,
    'Avg R:R': Math.min(s.avgR * 20, 100),
    'Trade Count': Math.min(s.total * 5, 100),
  }));

  if (isLoading) return <div className="px-4 pt-6"><p className="text-muted-foreground">Loading...</p></div>;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'session', label: 'Sessions', icon: <Clock className="h-4 w-4" /> },
    { key: 'strategy', label: 'Strategy', icon: <Layers className="h-4 w-4" /> },
    { key: 'timeframe', label: 'Timeframes', icon: <Target className="h-4 w-4" /> },
  ];

  return (
    <div className="px-4 pt-6 pb-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Deep Analytics</h1>
        <p className="text-sm text-muted-foreground">Session, strategy & timeframe breakdown</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === key ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ── SESSION TAB ── */}
      {tab === 'session' && (
        <div className="space-y-4">
          {/* Session Cards */}
          <div className="grid grid-cols-3 gap-3">
            {sessionStats.map((s, i) => (
              <div key={s.session} className="glass-card p-3 text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${SESSION_COLORS[i]}20` }}>
                  <Clock className="h-4 w-4" style={{ color: SESSION_COLORS[i] }} />
                </div>
                <p className="text-xs font-bold text-foreground">{s.session}</p>
                <p className={`text-lg font-bold ${s.wr >= 55 ? 'text-success' : s.wr >= 45 ? 'text-chart-4' : 'text-loss'}`}>{s.wr}%</p>
                <p className="text-[9px] text-muted-foreground">{s.total} trades</p>
              </div>
            ))}
          </div>

          {/* Session Bar Chart */}
          <div className="glass-card p-4">
            <h2 className="stat-label mb-3">Session Win Rates</h2>
            {sessionStats.every(s => s.total === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">No session data yet</p>
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionStats}>
                    <XAxis dataKey="session" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 18%, 14%)', border: '1px solid hsl(220, 14%, 22%)', borderRadius: '8px', fontSize: 11 }} />
                    <Bar dataKey="wr" name="Win Rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Session P/L Breakdown — Pro */}
          <div className="relative">
            <div className={`glass-card p-4 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
              <h2 className="stat-label mb-3">Session P/L Breakdown</h2>
              <div className="space-y-3">
                {sessionStats.map((s, i) => (
                  <div key={s.session} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SESSION_COLORS[i] }} />
                      <span className="text-sm text-foreground">{s.session}</span>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${s.pnl >= 0 ? 'text-success' : 'text-loss'}`}>
                        {s.pnl >= 0 ? '+' : ''}${s.pnl}
                      </p>
                      <p className="text-[9px] text-muted-foreground">{s.wins}W / {s.losses}L</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
          </div>

          {/* Radar — Pro */}
          <div className="relative">
            <div className={`glass-card p-4 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
              <h2 className="stat-label mb-3">Session Radar</h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(220, 14%, 22%)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar name="Win Rate" dataKey="Win Rate" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
          </div>
        </div>
      )}

      {/* ── STRATEGY TAB ── */}
      {tab === 'strategy' && (
        <div className="space-y-4">
          {strategyStats.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Log trades to see strategy analysis</p>
            </div>
          ) : (
            <>
              {/* Strategy Cards */}
              {strategyStats.map(s => {
                const wrColor = s.wr >= 60 ? 'text-success' : s.wr >= 45 ? 'text-chart-4' : 'text-loss';
                const bgColor = s.wr >= 60 ? 'bg-success/10 border-success/20' : s.wr >= 45 ? 'bg-chart-4/10 border-chart-4/20' : 'bg-loss/10 border-loss/20';
                return (
                  <div key={s.strategy} className={`glass-card p-4 border ${bgColor}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{s.strategy}</h3>
                        <p className="text-[10px] text-muted-foreground">{s.total} trades</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${wrColor}`}>{s.wr}%</p>
                        <p className="text-[9px] text-muted-foreground">win rate</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-secondary/30 rounded-lg p-2 text-center">
                        <p className="text-xs font-bold text-foreground">{s.wins}W / {s.losses}L</p>
                        <p className="text-[9px] text-muted-foreground">Record</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-2 text-center">
                        <p className={`text-xs font-bold ${s.pnl >= 0 ? 'text-success' : 'text-loss'}`}>
                          {s.pnl >= 0 ? '+' : ''}${s.pnl}
                        </p>
                        <p className="text-[9px] text-muted-foreground">P/L</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-2 text-center">
                        <p className="text-xs font-bold text-chart-4">{s.avgDiscipline}</p>
                        <p className="text-[9px] text-muted-foreground">Discipline</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Strategy Comparison Bar — Pro */}
              <div className="relative">
                <div className={`glass-card p-4 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
                  <h2 className="stat-label mb-3">Strategy Comparison</h2>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={strategyStats}>
                        <XAxis dataKey="strategy" tick={{ fontSize: 8, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 18%, 14%)', border: '1px solid hsl(220, 14%, 22%)', borderRadius: '8px', fontSize: 11 }} />
                        <Bar dataKey="wr" name="Win Rate" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TIMEFRAME TAB ── */}
      {tab === 'timeframe' && (
        <div className="space-y-4">
          {timeframeStats.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Log trades to see timeframe analysis</p>
            </div>
          ) : (
            <>
              {/* Timeframe Heatmap Grid */}
              <div className="grid grid-cols-3 gap-3">
                {timeframeStats.map(t => {
                  const color = t.wr >= 60
                    ? 'bg-success/15 border-success/25 text-success'
                    : t.wr >= 45
                    ? 'bg-chart-4/15 border-chart-4/25 text-chart-4'
                    : 'bg-loss/15 border-loss/25 text-loss';
                  return (
                    <div key={t.tf} className={`rounded-xl border p-3 text-center ${color}`}>
                      <p className="text-xs font-bold">{t.tf}</p>
                      <p className="text-2xl font-bold">{t.wr}%</p>
                      <p className="text-[9px] opacity-70">{t.total} trades</p>
                    </div>
                  );
                })}
              </div>

              {/* Timeframe P/L — Pro */}
              <div className="relative">
                <div className={`glass-card p-4 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
                  <h2 className="stat-label mb-3">Timeframe P/L</h2>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timeframeStats}>
                        <XAxis dataKey="tf" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 18%, 14%)', border: '1px solid hsl(220, 14%, 22%)', borderRadius: '8px', fontSize: 11 }} />
                        <Bar dataKey="pnl" name="P/L" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
              </div>

              {/* Best Timeframe Highlight */}
              {timeframeStats.length > 0 && (() => {
                const best = [...timeframeStats].sort((a, b) => b.wr - a.wr)[0];
                return (
                  <div className="glass-card p-4 border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">Best Performing Timeframe</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary">{best.tf}</p>
                    <p className="text-xs text-muted-foreground">{best.wr}% win rate across {best.total} trades</p>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      <ProUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
