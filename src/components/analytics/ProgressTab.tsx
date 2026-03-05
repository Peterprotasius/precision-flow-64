import { useMemo } from 'react';
import { Flame, Trophy, Star, Award, TrendingUp } from 'lucide-react';
import { useUserXP, useAchievements, getLevelFromXP, ALL_BADGES } from '@/hooks/useGamification';
import { useTrades } from '@/hooks/useTrades';
import { Progress } from '@/components/ui/progress';

export default function ProgressTab() {
  const { data: xp } = useUserXP();
  const { data: achievements = [] } = useAchievements();
  const { data: trades = [] } = useTrades();

  const totalXp = xp?.totalXp ?? 0;
  const streak = xp?.currentStreak ?? 0;
  const level = getLevelFromXP(totalXp);
  const unlockedKeys = new Set(achievements.map(a => a.badgeKey));

  // Monthly report card
  const monthlyGrade = useMemo(() => {
    const now = new Date();
    const monthTrades = trades.filter(t => {
      const d = new Date(t.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const closed = monthTrades.filter(t => t.result === 'win' || t.result === 'loss');
    if (closed.length === 0) return { grade: '—', winRate: 0, avgRR: 0, trades: 0 };

    const wins = closed.filter(t => t.result === 'win').length;
    const winRate = Math.round((wins / closed.length) * 100);
    const avgRR = closed.reduce((s, t) => s + t.rrRatio, 0) / closed.length;
    const totalPL = closed.reduce((s, t) => s + t.profitLossAmount, 0);

    // Simple grade calc
    let score = 0;
    if (winRate >= 55) score += 2; else if (winRate >= 45) score += 1;
    if (avgRR >= 2) score += 2; else if (avgRR >= 1) score += 1;
    if (totalPL > 0) score += 2; else if (totalPL === 0) score += 1;
    if (streak >= 7) score += 2; else if (streak >= 3) score += 1;

    const grades = ['F', 'D', 'D', 'C', 'C', 'B', 'B', 'A', 'A'];
    return {
      grade: grades[Math.min(score, grades.length - 1)],
      winRate,
      avgRR: avgRR.toFixed(1),
      trades: closed.length,
      totalPL,
    };
  }, [trades, streak]);

  return (
    <div className="space-y-5">
      {/* Level & XP */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h2 className="stat-label">Level & Experience</h2>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{totalXp}</p>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-foreground">{level.name}</span>
            <span className="text-xs text-muted-foreground">{level.nextName}</span>
          </div>
          <Progress value={level.progress} className="h-3" />
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            {totalXp - level.currentMin} / {level.nextMin - level.currentMin} XP to next level
          </p>
        </div>

        {/* XP Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-secondary/50 rounded-lg p-2">
            <p className="font-bold text-foreground">+10</p>
            <p className="text-muted-foreground">per trade</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2">
            <p className="font-bold text-foreground">+15</p>
            <p className="text-muted-foreground">per win</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2">
            <p className="font-bold text-foreground">+5</p>
            <p className="text-muted-foreground">screenshot</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2">
            <p className="font-bold text-foreground">+50</p>
            <p className="text-muted-foreground">badge unlock</p>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-5 w-5 text-chart-4" />
          <h2 className="stat-label">Streaks</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Flame className="h-8 w-8 text-chart-4 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Trophy className="h-8 w-8 text-chart-4 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{xp?.longestStreak ?? 0}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="stat-label">Achievement Badges</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {achievements.length}/{ALL_BADGES.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ALL_BADGES.map(badge => {
            const unlocked = unlockedKeys.has(badge.key);
            return (
              <div
                key={badge.key}
                className={`rounded-lg p-3 text-center border transition-all ${
                  unlocked
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-secondary/30 border-border/50 opacity-40 grayscale'
                }`}
              >
                <span className="text-2xl block">{badge.icon}</span>
                <p className="text-[10px] text-foreground font-medium mt-1 leading-tight">{badge.name}</p>
                <p className="text-[8px] text-muted-foreground mt-0.5 leading-tight">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Report Card */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="stat-label">Monthly Report Card</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className={`h-20 w-20 rounded-2xl flex items-center justify-center text-3xl font-bold border-2 ${
            monthlyGrade.grade === 'A' ? 'bg-success/20 border-success/40 text-success' :
            monthlyGrade.grade === 'B' ? 'bg-primary/20 border-primary/40 text-primary' :
            monthlyGrade.grade === 'C' ? 'bg-chart-4/20 border-chart-4/40 text-chart-4' :
            'bg-loss/20 border-loss/40 text-loss'
          }`}>
            {monthlyGrade.grade}
          </div>
          <div className="flex-1 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="text-foreground font-medium">{monthlyGrade.winRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg R:R</span>
              <span className="text-foreground font-medium">{monthlyGrade.avgRR}:1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trades</span>
              <span className="text-foreground font-medium">{monthlyGrade.trades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Streak</span>
              <span className="text-foreground font-medium">{streak} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
