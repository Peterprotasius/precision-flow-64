import { create } from 'zustand';
import { Trade, mockTrades } from '@/lib/mock-data';

interface TradeStore {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
}

export const useTradeStore = create<TradeStore>((set) => ({
  trades: mockTrades,
  addTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades] })),
}));
