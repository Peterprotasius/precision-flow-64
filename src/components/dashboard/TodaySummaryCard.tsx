import { useMemo } from 'react';
import { Calendar, Target, TrendingUp, CheckCircle } from 'lucide-react';
import type { Trade } from '@/lib/mock-data';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface Props {
  trades: Trade[];
}

export default function TodaySummaryCard({ trades }: Props) {
  const today = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todayTrades = trades.filter(t => new Date(t.createdAt).getTime() >= startOfDay);
    const closed = todayTrades.filter(t => t.result === 'win' || t.result === 'loss');
    const wins = closed.filter(t => t.result === 'win');
    const totalPL = closed.reduce((s, t) => s + t.profitLossAmount, 0);
    const winRate = closed.length > 0 ? Math.round((wins.length / closed.length) * 100) : 0;
    // Rules followed: trades with at least one SMC confluence
    const withRules = closed.filter(t => t.bosPresent || t.liquiditySweep || t.orderBlock);
    const rulesFollowed = closed.length > 0 ? Math.round((withRules.length / closed.length) * 100) : 0;

    return { count: todayTrades.length, totalPL, winRate, rulesFollowed };
  }, [trades]);

  const plDisplay = useAnimatedCounter(today.totalPL, 800, 0, today.totalPL >= 0 ? '+$' : '-$');
  const wrDisplay = useAnimatedCounter(today.winRate, 800, 0, '', '%');

  return (
    <div className="glass-card p-4 animate-slide-up">
      <h2 className="stat-label mb-3 flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5" />
        Today's Summary
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">P/L</span>
          <p className={`text-lg font-bold ${today.totalPL >= 0 ? 'text-success' : 'text-loss'}`}>
            {today.totalPL >= 0 ? '+' : ''}${Math.abs(today.totalPL).toFixed(0)}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Trades</span>
          <p className="text-lg font-bold text-foreground">{today.count}</p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</span>
          <p className="text-lg font-bold text-foreground">{wrDisplay}</p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Rules Followed
          </span>
          <p className={`text-lg font-bold ${today.rulesFollowed >= 80 ? 'text-success' : today.rulesFollowed >= 50 ? 'text-chart-4' : 'text-loss'}`}>
            {today.rulesFollowed}%
          </p>
        </div>
      </div>
    </div>
  );
}
