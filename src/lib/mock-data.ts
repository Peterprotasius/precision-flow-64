export interface Trade {
  id: string;
  pair: string;
  direction: 'buy' | 'sell';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskPercent: number;
  rrRatio: number;
  result: 'win' | 'loss' | 'breakeven' | 'open';
  profitLossAmount: number;
  timeframe: '5m' | '15m' | '1H' | '4H' | 'Daily';
  htfBias: 'bullish' | 'bearish';
  bosPresent: boolean;
  liquiditySweep: boolean;
  orderBlock: boolean;
  confidenceLevel: number;
  emotionBefore: string;
  emotionAfter: string;
  notes: string;
  screenshotUrl?: string;
  createdAt: string;
}

export const EMOTIONS = [
  'Calm', 'Confident', 'Anxious', 'Fearful', 'Greedy', 'FOMO', 'Revenge', 'Bored', 'Excited', 'Neutral'
];

export const PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD',
  'EUR/GBP', 'GBP/JPY', 'EUR/JPY', 'NZD/USD', 'USD/CHF',
  'XAU/USD', 'GBP/AUD', 'EUR/AUD', 'AUD/JPY', 'CAD/JPY',
  'Volatility 10', 'Volatility 25', 'Volatility 50', 'Volatility 75', 'Volatility 100',
  'Volatility 10 (1s)', 'Volatility 25 (1s)', 'Volatility 50 (1s)', 'Volatility 75 (1s)', 'Volatility 100 (1s)',
  'Boom 300', 'Boom 500', 'Boom 1000', 'Crash 300', 'Crash 500', 'Crash 1000',
  'Step Index', 'Range Break 100', 'Range Break 200',
  'Jump 10', 'Jump 25', 'Jump 50', 'Jump 75', 'Jump 100',
];

export const TIMEFRAMES = ['5m', '15m', '1H', '4H', 'Daily'] as const;

export const mockTrades: Trade[] = [
  {
    id: '1',
    pair: 'EUR/USD',
    direction: 'buy',
    entryPrice: 1.0850,
    stopLoss: 1.0820,
    takeProfit: 1.0910,
    lotSize: 0.5,
    riskPercent: 1.5,
    rrRatio: 2.0,
    result: 'win',
    profitLossAmount: 300,
    timeframe: '15m',
    htfBias: 'bullish',
    bosPresent: true,
    liquiditySweep: true,
    orderBlock: true,
    confidenceLevel: 8,
    emotionBefore: 'Confident',
    emotionAfter: 'Calm',
    notes: 'Clean setup with all confluences aligned.',
    createdAt: '2025-02-13T10:30:00Z',
  },
  {
    id: '2',
    pair: 'GBP/USD',
    direction: 'sell',
    entryPrice: 1.2650,
    stopLoss: 1.2680,
    takeProfit: 1.2590,
    lotSize: 0.3,
    riskPercent: 1.0,
    rrRatio: 2.0,
    result: 'loss',
    profitLossAmount: -90,
    timeframe: '1H',
    htfBias: 'bearish',
    bosPresent: true,
    liquiditySweep: false,
    orderBlock: true,
    confidenceLevel: 5,
    emotionBefore: 'Anxious',
    emotionAfter: 'Fearful',
    notes: 'No liquidity sweep. Entered too early.',
    createdAt: '2025-02-12T14:15:00Z',
  },
  {
    id: '3',
    pair: 'XAU/USD',
    direction: 'buy',
    entryPrice: 2025.50,
    stopLoss: 2020.00,
    takeProfit: 2042.00,
    lotSize: 0.1,
    riskPercent: 2.0,
    rrRatio: 3.0,
    result: 'win',
    profitLossAmount: 165,
    timeframe: '4H',
    htfBias: 'bullish',
    bosPresent: true,
    liquiditySweep: true,
    orderBlock: true,
    confidenceLevel: 9,
    emotionBefore: 'Calm',
    emotionAfter: 'Excited',
    notes: 'Perfect SMC setup on gold. All confluences.',
    createdAt: '2025-02-11T09:00:00Z',
  },
  {
    id: '4',
    pair: 'USD/JPY',
    direction: 'sell',
    entryPrice: 149.80,
    stopLoss: 150.10,
    takeProfit: 149.20,
    lotSize: 0.5,
    riskPercent: 1.5,
    rrRatio: 2.0,
    result: 'win',
    profitLossAmount: 200,
    timeframe: '15m',
    htfBias: 'bearish',
    bosPresent: true,
    liquiditySweep: true,
    orderBlock: false,
    confidenceLevel: 7,
    emotionBefore: 'Confident',
    emotionAfter: 'Calm',
    notes: 'Good entry but missed OB. Still hit TP.',
    createdAt: '2025-02-10T16:45:00Z',
  },
  {
    id: '5',
    pair: 'EUR/GBP',
    direction: 'buy',
    entryPrice: 0.8550,
    stopLoss: 0.8530,
    takeProfit: 0.8590,
    lotSize: 0.4,
    riskPercent: 1.0,
    rrRatio: 2.0,
    result: 'loss',
    profitLossAmount: -80,
    timeframe: '1H',
    htfBias: 'bullish',
    bosPresent: false,
    liquiditySweep: false,
    orderBlock: false,
    confidenceLevel: 3,
    emotionBefore: 'FOMO',
    emotionAfter: 'Revenge',
    notes: 'FOMO entry. No structure break. Need to be more patient.',
    createdAt: '2025-02-09T11:20:00Z',
  },
  {
    id: '6',
    pair: 'GBP/JPY',
    direction: 'buy',
    entryPrice: 188.50,
    stopLoss: 188.00,
    takeProfit: 189.50,
    lotSize: 0.2,
    riskPercent: 1.0,
    rrRatio: 2.0,
    result: 'win',
    profitLossAmount: 200,
    timeframe: '4H',
    htfBias: 'bullish',
    bosPresent: true,
    liquiditySweep: true,
    orderBlock: true,
    confidenceLevel: 8,
    emotionBefore: 'Calm',
    emotionAfter: 'Confident',
    notes: 'Textbook setup.',
    createdAt: '2025-02-08T08:30:00Z',
  },
];
