import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Trade } from '@/lib/mock-data';
import { calcRMultiple } from '@/lib/analytics';

interface Props {
  trades: Trade[];
}

type CurveMode = 'balance' | 'equity' | 'rmultiple';
type TimeFilter = '7D' | '30D' | '90D' | 'All';

export default function EnhancedEquityCurve({ trades }: Props) {
  const [mode, setMode] = useState<CurveMode>('balance');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');

  const data = useMemo(() => {
    const closed = trades
      .filter(t => t.result === 'win' || t.result === 'loss' || t.result === 'breakeven')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Apply time filter
    const now = Date.now();
    const filterMs: Record<TimeFilter, number> = {
      '7D': 7 * 86400000,
      '30D': 30 * 86400000,
      '90D': 90 * 86400000,
      'All': Infinity,
    };
    const cutoff = now - filterMs[timeFilter];
    const filtered = closed.filter(t => new Date(t.createdAt).getTime() >= cutoff);

    let running = 0;
    let peak = 0;
    return filtered.map((t, i) => {
      const rMultiple = calcRMultiple(t);
      running += mode === 'rmultiple' ? rMultiple : t.profitLossAmount;
      if (running > peak) peak = running;
      const drawdown = peak > 0 && running < peak;

      return {
        trade: i + 1,
        value: Math.round(running * 100) / 100,
        drawdown,
        date: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
  }, [trades, mode, timeFilter]);

  const modes: { key: CurveMode; label: string }[] = [
    { key: 'balance', label: 'Balance' },
    { key: 'equity', label: 'Equity' },
    { key: 'rmultiple', label: 'R-Multiple' },
  ];

  const timeFilters: TimeFilter[] = ['7D', '30D', '90D', 'All'];
  const yPrefix = mode === 'rmultiple' ? '' : '$';

  return (
    <div className="glass-card p-4 animate-slide-up">
      <h2 className="stat-label mb-3">Equity Curve</h2>

      {/* Mode Toggle */}
      <div className="flex gap-1 mb-3">
        {modes.map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              mode === m.key
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Time Filters */}
      <div className="flex gap-1 mb-3">
        {timeFilters.map(tf => (
          <button
            key={tf}
            onClick={() => setTimeFilter(tf)}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
              timeFilter === tf
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="enhancedEquityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.12} />
                <stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${yPrefix}${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(220, 18%, 14%)', border: '1px solid hsl(220, 14%, 22%)', borderRadius: '8px', fontSize: 12 }}
              labelStyle={{ color: 'hsl(210, 20%, 92%)' }}
              formatter={(value: number) => [`${yPrefix}${value}`, mode === 'rmultiple' ? 'Cumulative R' : 'Equity']}
            />
            <ReferenceLine y={0} stroke="hsl(220, 14%, 22%)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(174, 72%, 46%)"
              fill="url(#enhancedEquityGrad)"
              strokeWidth={2}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
