import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Trade } from '@/lib/mock-data';

interface DbTrade {
  id: string;
  user_id: string;
  pair: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  lot_size: number;
  risk_percent: number;
  rr_ratio: number;
  result: string;
  profit_loss_amount: number;
  timeframe: string;
  htf_bias: string;
  bos_present: boolean;
  liquidity_sweep: boolean;
  order_block: boolean;
  confidence_level: number;
  emotion_before: string | null;
  emotion_after: string | null;
  notes: string | null;
  screenshot_url: string | null;
  created_at: string;
}

function dbToTrade(d: DbTrade): Trade {
  return {
    id: d.id,
    pair: d.pair,
    direction: d.direction as Trade['direction'],
    entryPrice: Number(d.entry_price),
    stopLoss: Number(d.stop_loss),
    takeProfit: Number(d.take_profit),
    lotSize: Number(d.lot_size),
    riskPercent: Number(d.risk_percent),
    rrRatio: Number(d.rr_ratio),
    result: d.result as Trade['result'],
    profitLossAmount: Number(d.profit_loss_amount),
    timeframe: d.timeframe as Trade['timeframe'],
    htfBias: d.htf_bias as Trade['htfBias'],
    bosPresent: d.bos_present,
    liquiditySweep: d.liquidity_sweep,
    orderBlock: d.order_block,
    confidenceLevel: d.confidence_level,
    emotionBefore: d.emotion_before ?? '',
    emotionAfter: d.emotion_after ?? '',
    notes: d.notes ?? '',
    screenshotUrl: d.screenshot_url ?? undefined,
    createdAt: d.created_at,
  };
}

export function useTrades() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trades', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as DbTrade[]).map(dbToTrade);
    },
    enabled: !!user,
  });
}

export function useAddTrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (trade: Omit<Trade, 'id' | 'createdAt'>) => {
      const { error } = await supabase.from('trades').insert({
        user_id: user!.id,
        pair: trade.pair,
        direction: trade.direction,
        entry_price: trade.entryPrice,
        stop_loss: trade.stopLoss,
        take_profit: trade.takeProfit,
        lot_size: trade.lotSize,
        risk_percent: trade.riskPercent,
        rr_ratio: trade.rrRatio,
        result: trade.result,
        profit_loss_amount: trade.profitLossAmount,
        timeframe: trade.timeframe,
        htf_bias: trade.htfBias,
        bos_present: trade.bosPresent,
        liquidity_sweep: trade.liquiditySweep,
        order_block: trade.orderBlock,
        confidence_level: trade.confidenceLevel,
        emotion_before: trade.emotionBefore,
        emotion_after: trade.emotionAfter,
        notes: trade.notes,
        screenshot_url: trade.screenshotUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
}
