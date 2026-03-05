import { useEffect } from 'react';
import { Flame, Trophy, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useUserXP, useAchievements, useAddXP, useUnlockAchievement, getLevelFromXP, ALL_BADGES, checkBadgeEligibility } from '@/hooks/useGamification';
import { useTrades } from '@/hooks/useTrades';
import { Progress } from '@/components/ui/progress';

export default function ProgressCard() {
  const { data: xp } = useUserXP();
  const { data: achievements = [] } = useAchievements();
  const { data: trades = [] } = useTrades();
  const unlockAchievement = useUnlockAchievement();
  const [expanded, setExpanded] = useState(false);

  // Auto-check and unlock badges
  useEffect(() => {
    if (trades.length === 0 || !achievements) return;
    const toUnlock = checkBadgeEligibility(trades, achievements);
    toUnlock.forEach(badge => {
      unlockAchievement.mutate(badge);
    });
  }, [trades.length, achievements?.length]);

  const totalXp = xp?.totalXp ?? 0;
  const streak = xp?.currentStreak ?? 0;
  const level = getLevelFromXP(totalXp);
  const unlockedKeys = new Set(achievements.map(a => a.badgeKey));

  return (
    <div className="glass-card animate-fade-in overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Flame className="h-5 w-5 text-chart-4" />
            <span className="text-lg font-bold text-chart-4">{streak}</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{totalXp} XP</span>
          </div>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
            {level.name}
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* XP Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{level.name}</span>
              <span className="text-xs text-muted-foreground">{level.nextName}</span>
            </div>
            <Progress value={level.progress} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              {totalXp} / {level.nextMin} XP
            </p>
          </div>

          {/* Streak Info */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-secondary/50 rounded-lg p-3 text-center">
              <Flame className="h-5 w-5 text-chart-4 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{streak}</p>
              <p className="text-[10px] text-muted-foreground">Current Streak</p>
            </div>
            <div className="flex-1 bg-secondary/50 rounded-lg p-3 text-center">
              <Trophy className="h-5 w-5 text-chart-4 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{xp?.longestStreak ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Best Streak</p>
            </div>
          </div>

          {/* Achievement Badges */}
          <div>
            <h3 className="stat-label mb-2">Achievements</h3>
            <div className="grid grid-cols-3 gap-2">
              {ALL_BADGES.map(badge => {
                const unlocked = unlockedKeys.has(badge.key);
                return (
                  <div
                    key={badge.key}
                    className={`rounded-lg p-2 text-center border transition-all ${
                      unlocked
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-secondary/30 border-border/50 opacity-40'
                    }`}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <p className="text-[9px] text-foreground font-medium mt-1 leading-tight">{badge.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
