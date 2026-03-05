import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Trade } from '@/lib/mock-data';

export interface UserXP {
  id: string;
  userId: string;
  totalXp: number;
  currentLevel: string;
  currentStreak: number;
  longestStreak: number;
  lastTradeDate: string | null;
}

export interface Achievement {
  id: string;
  badgeKey: string;
  badgeName: string;
  badgeDescription: string | null;
  unlockedAt: string;
}

const XP_LEVELS = [
  { name: 'Rookie', min: 0 },
  { name: 'Developing', min: 500 },
  { name: 'Consistent', min: 1500 },
  { name: 'Advanced', min: 3500 },
  { name: 'Elite Trader', min: 7000 },
];

export function getLevelFromXP(xp: number) {
  let level = XP_LEVELS[0];
  for (const l of XP_LEVELS) {
    if (xp >= l.min) level = l;
  }
  const idx = XP_LEVELS.indexOf(level);
  const next = XP_LEVELS[idx + 1];
  return {
    name: level.name,
    currentMin: level.min,
    nextMin: next?.min ?? level.min,
    nextName: next?.name ?? 'Max Level',
    progress: next ? ((xp - level.min) / (next.min - level.min)) * 100 : 100,
    index: idx,
  };
}

export const ALL_BADGES = [
  { key: 'first_trade', name: 'First Trade Logged', description: 'Log your very first trade', icon: '🎯' },
  { key: 'green_week', name: 'Green Week', description: 'Positive P/L for a full week', icon: '💚' },
  { key: 'ice_cold', name: 'Ice Cold', description: '5 consecutive wins', icon: '🧊' },
  { key: 'discipline_master', name: 'Discipline Master', description: '30 days 100% plan followed', icon: '🏆' },
  { key: 'rr_king', name: 'R:R King', description: 'Achieve 10:1 R:R on a single trade', icon: '👑' },
  { key: 'prop_passer', name: 'Prop Passer', description: 'Pass a prop challenge via app', icon: '🏅' },
  { key: 'century_club', name: 'Century Club', description: 'Log 100 trades', icon: '💯' },
  { key: 'zero_revenge', name: 'Zero Revenge', description: 'Full month zero revenge tags', icon: '🧘' },
  { key: 'consistent', name: 'Consistent', description: '3 consecutive profitable months', icon: '📈' },
];

export function useUserXP() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user_xp', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        totalXp: data.total_xp,
        currentLevel: data.current_level,
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        lastTradeDate: data.last_trade_date,
      } as UserXP;
    },
    enabled: !!user,
  });
}

export function useAchievements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user!.id)
        .order('unlocked_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(d => ({
        id: d.id,
        badgeKey: d.badge_key,
        badgeName: d.badge_name,
        badgeDescription: d.badge_description,
        unlockedAt: d.unlocked_at,
      })) as Achievement[];
    },
    enabled: !!user,
  });
}

export function useAddXP() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('Not authenticated');
      // Get current XP
      const { data: existing } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];

      if (existing) {
        const lastDate = existing.last_trade_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = existing.current_streak;
        if (lastDate === yesterdayStr) {
          newStreak = existing.current_streak + 1;
        } else if (lastDate !== today) {
          newStreak = 1;
        }

        const newXP = existing.total_xp + amount;
        const level = getLevelFromXP(newXP);

        const { error } = await supabase
          .from('user_xp')
          .update({
            total_xp: newXP,
            current_level: level.name,
            current_streak: newStreak,
            longest_streak: Math.max(existing.longest_streak, newStreak),
            last_trade_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const level = getLevelFromXP(amount);
        const { error } = await supabase
          .from('user_xp')
          .insert({
            user_id: user.id,
            total_xp: amount,
            current_level: level.name,
            current_streak: 1,
            longest_streak: 1,
            last_trade_date: today,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_xp'] });
    },
  });
}

export function useUnlockAchievement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ badgeKey, badgeName, badgeDescription }: { badgeKey: string; badgeName: string; badgeDescription?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('achievements')
        .insert({
          user_id: user.id,
          badge_key: badgeKey,
          badge_name: badgeName,
          badge_description: badgeDescription ?? null,
        });
      // Ignore unique constraint errors (already unlocked)
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

// Check and unlock badges based on trades
export function checkBadgeEligibility(trades: Trade[], achievements: Achievement[]) {
  const unlocked = new Set(achievements.map(a => a.badgeKey));
  const toUnlock: { badgeKey: string; badgeName: string; badgeDescription: string }[] = [];

  const closedTrades = trades.filter(t => t.result === 'win' || t.result === 'loss');

  // First Trade Logged
  if (!unlocked.has('first_trade') && trades.length >= 1) {
    toUnlock.push({ badgeKey: 'first_trade', badgeName: 'First Trade Logged', badgeDescription: 'Log your very first trade' });
  }

  // Century Club
  if (!unlocked.has('century_club') && trades.length >= 100) {
    toUnlock.push({ badgeKey: 'century_club', badgeName: 'Century Club', badgeDescription: 'Log 100 trades' });
  }

  // Ice Cold - 5 consecutive wins
  if (!unlocked.has('ice_cold') && closedTrades.length >= 5) {
    let maxConsecutiveWins = 0;
    let current = 0;
    for (const t of closedTrades) {
      if (t.result === 'win') { current++; maxConsecutiveWins = Math.max(maxConsecutiveWins, current); }
      else current = 0;
    }
    if (maxConsecutiveWins >= 5) {
      toUnlock.push({ badgeKey: 'ice_cold', badgeName: 'Ice Cold', badgeDescription: '5 consecutive wins' });
    }
  }

  // R:R King
  if (!unlocked.has('rr_king') && closedTrades.some(t => t.rrRatio >= 10)) {
    toUnlock.push({ badgeKey: 'rr_king', badgeName: 'R:R King', badgeDescription: 'Achieve 10:1 R:R on a single trade' });
  }

  return toUnlock;
}
