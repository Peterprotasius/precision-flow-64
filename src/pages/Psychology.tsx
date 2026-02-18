import { useMemo, useState } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { useAuth } from '@/hooks/useAuth';
import { calcPsychStats, calcDisciplineScore } from '@/lib/analytics';
import { Brain, AlertTriangle, TrendingUp, TrendingDown, Zap, Lock } from 'lucide-react';
import ProUpgradeModal from '@/components/ProUpgradeModal';

function LockedOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm z-10">
      <Lock className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm font-semibold text-foreground mb-1">Pro Feature</p>
      <button onClick={onUpgrade} className="bg-chart-4 text-background text-xs font-bold px-4 py-2 rounded-lg">Upgrade to Pro</button>
    </div>
  );
}

export default function Psychology() {
  const { data: trades = [], isLoading } = useTrades();
  const { subscribed } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const psych = useMemo(() => calcPsychStats(trades), [trades]);

  const emotionRows = Object.entries(psych.emotionWR)
    .map(([emotion, { wins, total }]) => ({
      emotion,
      wr: total > 0 ? Math.round((wins / total) * 100) : 0,
      total,
    }))
    .sort((a, b) => b.wr - a.wr);

  const disciplineHistory = useMemo(() => {
    const closed = trades.filter(t => t.result === 'win' || t.result === 'loss');
    return closed.slice(-10).map((t, i) => ({
      trade: i + 1,
      score: calcDisciplineScore(t, trades),
    }));
  }, [trades]);

  if (isLoading) return <div className="px-4 pt-6"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="px-4 pt-6 pb-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Psychology</h1>
        <p className="text-sm text-muted-foreground">Mental performance analysis</p>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="stat-label mb-1">Avg Discipline</p>
          <p className={`text-2xl font-bold ${psych.avgDiscipline >= 70 ? 'text-success' : psych.avgDiscipline >= 50 ? 'text-chart-4' : 'text-loss'}`}>
            {psych.avgDiscipline}
          </p>
          <p className="text-[10px] text-muted-foreground">/ 100</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="stat-label mb-1">High Conf WR</p>
          <p className="text-2xl font-bold text-primary">{psych.wrHighConf}%</p>
          <p className="text-[10px] text-muted-foreground">{psych.highConfCount} trades (conf ≥8)</p>
        </div>
      </div>

      {/* Revenge trading alert */}
      {psych.revengeDetected && (
        <div className="glass-card p-4 border border-loss/40 bg-loss/5 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-loss shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-loss">⚠️ Revenge Trading Detected</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You have placed 3+ trades within 1 hour after a loss. This pattern significantly reduces your edge.
                Take a break and reset your psychology before trading again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Post-loss performance */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="stat-label flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Post-Loss Performance
        </h2>
        <div className="space-y-2">
          {[
            { label: 'Win rate after 1 loss', value: psych.wrAfterLoss, count: psych.afterLossCount },
            { label: 'Win rate after 2 losses', value: psych.wrAfterTwoLosses, count: psych.afterTwoLossCount },
          ].map(({ label, value, count }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-xs font-bold ${value >= 50 ? 'text-success' : 'text-loss'}`}>{count > 0 ? `${value}%` : '—'}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full">
                  <div
                    className={`h-1.5 rounded-full ${value >= 50 ? 'bg-success' : 'bg-loss'}`}
                    style={{ width: `${count > 0 ? value : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emotion-performance correlation — Pro */}
      <div className="relative">
        <div className={`glass-card p-4 space-y-3 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
          <h2 className="stat-label flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Emotion → Win Rate
          </h2>
          {emotionRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No emotion data logged</p>
          ) : (
            <div className="space-y-2">
              {emotionRows.map(({ emotion, wr, total }) => (
                <div key={emotion} className="flex items-center gap-2">
                  <span className="text-xs text-foreground w-20 shrink-0">{emotion}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full">
                    <div
                      className={`h-2 rounded-full ${wr >= 60 ? 'bg-success' : wr >= 40 ? 'bg-chart-4' : 'bg-loss'}`}
                      style={{ width: `${wr}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-8 text-right ${wr >= 60 ? 'text-success' : wr >= 40 ? 'text-chart-4' : 'text-loss'}`}>{wr}%</span>
                  <span className="text-[10px] text-muted-foreground w-10 text-right">{total} tr.</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
      </div>

      {/* Discipline trend — Pro */}
      <div className="relative">
        <div className={`glass-card p-4 space-y-3 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
          <h2 className="stat-label">Discipline Score (Last 10 Trades)</h2>
          <div className="flex items-end gap-1 h-20">
            {disciplineHistory.map(({ trade, score }) => (
              <div key={trade} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${score >= 70 ? 'bg-success' : score >= 50 ? 'bg-chart-4' : 'bg-loss'}`}
                  style={{ height: `${(score / 100) * 72}px` }}
                />
                <span className="text-[8px] text-muted-foreground">{trade}</span>
              </div>
            ))}
            {disciplineHistory.length === 0 && (
              <p className="text-sm text-muted-foreground text-center w-full py-4">No trades yet</p>
            )}
          </div>
        </div>
        {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
      </div>

      {/* Psychological Insights */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="stat-label">Insights</h2>
        <div className="space-y-2 text-sm">
          {psych.wrHighConf > psych.wrAfterLoss && (
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <p className="text-muted-foreground">You perform <span className="text-foreground font-semibold">{psych.wrHighConf - psych.wrAfterLoss}% better</span> when confidence is high. Prioritize high-confidence setups.</p>
            </div>
          )}
          {psych.wrAfterTwoLosses < 40 && psych.afterTwoLossCount > 0 && (
            <div className="flex items-start gap-2">
              <TrendingDown className="h-4 w-4 text-loss shrink-0 mt-0.5" />
              <p className="text-muted-foreground">Your win rate drops to <span className="text-loss font-semibold">{psych.wrAfterTwoLosses}%</span> after 2 consecutive losses. Consider a daily loss limit rule.</p>
            </div>
          )}
          {psych.avgDiscipline < 60 && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-chart-4 shrink-0 mt-0.5" />
              <p className="text-muted-foreground">Average discipline score is below 60. Review your risk management and rule adherence.</p>
            </div>
          )}
          {psych.avgDiscipline >= 80 && (
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <p className="text-muted-foreground">Excellent discipline score of <span className="text-success font-semibold">{psych.avgDiscipline}/100</span>. You are operating at a professional level.</p>
            </div>
          )}
        </div>
      </div>

      <ProUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
