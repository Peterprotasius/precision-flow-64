import { useMemo } from 'react';
import { useTradeStore } from '@/lib/trade-store';
import { TrendingUp, TrendingDown, Zap, AlertTriangle, Target, Clock } from 'lucide-react';

interface Insight {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
}

export default function Insights() {
  const { trades } = useTradeStore();

  const insights = useMemo<Insight[]>(() => {
    const closed = trades.filter(t => t.result === 'win' || t.result === 'loss');
    if (closed.length === 0) return [];

    const wins = closed.filter(t => t.result === 'win');
    const wr = (subset: typeof closed) => subset.length > 0 ? Math.round((subset.filter(t => t.result === 'win').length / subset.length) * 100) : 0;

    // Win rate with liquidity sweep
    const withSweep = closed.filter(t => t.liquiditySweep);
    const withoutSweep = closed.filter(t => !t.liquiditySweep);

    // Win rate per timeframe
    const timeframes = [...new Set(closed.map(t => t.timeframe))];
    const bestTF = timeframes.reduce((best, tf) => {
      const tfTrades = closed.filter(t => t.timeframe === tf);
      const rate = wr(tfTrades);
      return rate > (best.rate || 0) ? { tf, rate } : best;
    }, { tf: '', rate: 0 });

    // Low confidence win rate
    const lowConf = closed.filter(t => t.confidenceLevel < 5);

    // Best setup combination
    const fullSetup = closed.filter(t => t.bosPresent && t.liquiditySweep && t.orderBlock);

    // Most losing setup
    const noSetup = closed.filter(t => !t.bosPresent && !t.liquiditySweep && !t.orderBlock);

    const results: Insight[] = [
      {
        icon: <Zap className="h-5 w-5 text-primary" />,
        title: 'Liquidity Sweep Impact',
        value: `${wr(withSweep)}% vs ${wr(withoutSweep)}%`,
        description: `Win rate with liquidity sweep (${withSweep.length} trades) vs without (${withoutSweep.length} trades)`,
        trend: wr(withSweep) > wr(withoutSweep) ? 'up' : 'down',
      },
      {
        icon: <Clock className="h-5 w-5 text-primary" />,
        title: 'Best Timeframe',
        value: `${bestTF.tf} — ${bestTF.rate}%`,
        description: `Your highest win rate timeframe based on ${closed.length} trades`,
        trend: bestTF.rate >= 50 ? 'up' : 'down',
      },
      {
        icon: <AlertTriangle className="h-5 w-5 text-chart-4" />,
        title: 'Low Confidence Trades',
        value: lowConf.length > 0 ? `${wr(lowConf)}% win rate` : 'No data',
        description: `Performance when confidence below 5 (${lowConf.length} trades)`,
        trend: wr(lowConf) >= 50 ? 'up' : 'down',
      },
      {
        icon: <TrendingUp className="h-5 w-5 text-success" />,
        title: 'Full SMC Setup',
        value: fullSetup.length > 0 ? `${wr(fullSetup)}% win rate` : 'No data',
        description: `BOS + Liquidity Sweep + Order Block (${fullSetup.length} trades)`,
        trend: 'up',
      },
      {
        icon: <TrendingDown className="h-5 w-5 text-loss" />,
        title: 'No SMC Confluence',
        value: noSetup.length > 0 ? `${wr(noSetup)}% win rate` : 'No data',
        description: `Trades with no BOS, no sweep, no OB (${noSetup.length} trades)`,
        trend: 'down',
      },
      {
        icon: <Target className="h-5 w-5 text-primary" />,
        title: 'Average Win vs Loss Size',
        value: `+$${wins.length > 0 ? Math.round(wins.reduce((s, t) => s + t.profitLossAmount, 0) / wins.length) : 0} / -$${Math.abs(Math.round(
          closed.filter(t => t.result === 'loss').reduce((s, t) => s + t.profitLossAmount, 0) / (closed.filter(t => t.result === 'loss').length || 1)
        ))}`,
        description: 'Average profit on wins vs average loss on losing trades',
        trend: 'neutral',
      },
    ];

    return results;
  }, [trades]);

  return (
    <div className="px-4 pt-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Insights</h1>
        <p className="text-sm text-muted-foreground">Rule-based performance analytics</p>
      </div>

      {insights.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">Add trades to see insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
                  <p className={`text-lg font-bold mt-0.5 ${
                    insight.trend === 'up' ? 'text-success' : insight.trend === 'down' ? 'text-loss' : 'text-foreground'
                  }`}>{insight.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
