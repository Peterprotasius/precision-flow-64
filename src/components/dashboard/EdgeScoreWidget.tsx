import { useMemo } from 'react';
import type { Trade } from '@/lib/mock-data';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface Props {
  trades: Trade[];
}

function CircularGauge({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 71 ? 'hsl(var(--success))' : score >= 41 ? 'hsl(var(--chart-4))' : 'hsl(var(--loss))';
  const label = score >= 71 ? 'Sharp Edge' : score >= 41 ? 'Building' : 'Developing';

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
          strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{Math.round(score)}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function EdgeScoreWidget({ trades }: Props) {
  const scores = useMemo(() => {
    const closed = trades.filter(t => t.result === 'win' || t.result === 'loss');
    if (closed.length === 0) return { overall: 0, riskDiscipline: 0, ruleAdherence: 0, emotionalStability: 0 };

    // Risk Discipline: % of trades within 0.5% of avg risk
    const risks = closed.map(t => t.riskPercent);
    const avgRisk = risks.reduce((s, r) => s + r, 0) / risks.length;
    const consistent = closed.filter(t => Math.abs(t.riskPercent - avgRisk) <= 0.5);
    const riskDiscipline = (consistent.length / closed.length) * 100;

    // Rule Adherence: % of trades with at least one SMC confluence
    const withRules = closed.filter(t => t.bosPresent || t.liquiditySweep || t.orderBlock);
    const ruleAdherence = (withRules.length / closed.length) * 100;

    // Emotional Stability: % calm/confident trades
    const stableEmotions = ['Calm', 'Confident', 'Neutral', 'Excited'];
    const stable = closed.filter(t => stableEmotions.includes(t.emotionBefore));
    const emotionalStability = (stable.length / closed.length) * 100;

    // Win rate component (0-100 scaled)
    const winRate = (closed.filter(t => t.result === 'win').length / closed.length) * 100;

    // R:R consistency: how consistent the planned R:R is
    const rrs = closed.map(t => t.rrRatio);
    const avgRR = rrs.reduce((s, r) => s + r, 0) / rrs.length;
    const rrStd = Math.sqrt(rrs.reduce((s, r) => s + Math.pow(r - avgRR, 2), 0) / rrs.length);
    const rrConsistency = Math.max(0, Math.min(100, 100 - rrStd * 20));

    const overall =
      riskDiscipline * 0.25 +
      ruleAdherence * 0.25 +
      emotionalStability * 0.20 +
      winRate * 0.15 +
      rrConsistency * 0.15;

    return {
      overall: Math.round(overall * 10) / 10,
      riskDiscipline: Math.round(riskDiscipline),
      ruleAdherence: Math.round(ruleAdherence),
      emotionalStability: Math.round(emotionalStability),
    };
  }, [trades]);

  return (
    <div className="glass-card p-5 animate-slide-up">
      <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Your Edge Score</h2>
      <div className="flex flex-col items-center gap-5">
        <CircularGauge score={scores.overall} />
        <div className="w-full space-y-3">
          <ProgressBar label="Risk Discipline" value={scores.riskDiscipline} color="hsl(var(--primary))" />
          <ProgressBar label="Rule Adherence" value={scores.ruleAdherence} color="hsl(var(--success))" />
          <ProgressBar label="Emotional Stability" value={scores.emotionalStability} color="hsl(var(--chart-4))" />
        </div>
      </div>
    </div>
  );
}
