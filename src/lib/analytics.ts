import type { Trade } from '@/lib/mock-data';

// ─── R-Multiple Calculations ───────────────────────────────────────────────
export function calcRMultiple(trade: Trade): number {
  const { entryPrice, stopLoss, takeProfit, direction, result } = trade;
  if (result === 'breakeven') return 0;
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return 0;
  const reward = Math.abs(takeProfit - entryPrice);
  const rr = reward / risk;
  if (result === 'win') return rr;
  if (result === 'loss') return -1;
  return 0;
}

// ─── Setup Score (0–10) ────────────────────────────────────────────────────
export function calcSetupScore(trade: Trade): number {
  const { bosPresent, liquiditySweep, orderBlock } = trade;
  const full = bosPresent && liquiditySweep && orderBlock;
  if (full) return 9;
  if (bosPresent && liquiditySweep) return 7;
  if (bosPresent && orderBlock) return 7;
  if (liquiditySweep || orderBlock) return 6;
  if (bosPresent) return 4;
  return 2;
}

// ─── R:R Score (0–10) ─────────────────────────────────────────────────────
export function calcRRScore(rr: number): number {
  if (rr >= 3) return 10;
  if (rr >= 2) return 8;
  if (rr >= 1.5) return 6;
  return 3;
}

// ─── Edge Score (0–10) ────────────────────────────────────────────────────
export function calcEdgeScore(trade: Trade, allTrades: Trade[]): number {
  const setupScore = calcSetupScore(trade);
  const rrScore = calcRRScore(trade.rrRatio);

  // Risk consistency: stddev of risk %
  const risks = allTrades.map(t => t.riskPercent);
  const avgRisk = risks.reduce((s, r) => s + r, 0) / (risks.length || 1);
  const std = Math.sqrt(risks.reduce((s, r) => s + Math.pow(r - avgRisk, 2), 0) / (risks.length || 1));
  const riskConsistency = Math.max(0, Math.min(10, 10 - std * 3));

  // Emotional stability score
  const emotionalStability =
    trade.confidenceLevel >= 7 && !['Revenge', 'FOMO', 'Fearful', 'Greedy'].includes(trade.emotionBefore)
      ? 8
      : trade.confidenceLevel >= 5
      ? 5
      : 2;

  // Historical setup win rate for same setup type
  const similar = allTrades.filter(t =>
    t.bosPresent === trade.bosPresent &&
    t.liquiditySweep === trade.liquiditySweep &&
    t.orderBlock === trade.orderBlock &&
    (t.result === 'win' || t.result === 'loss')
  );
  const histPerf = similar.length > 0
    ? (similar.filter(t => t.result === 'win').length / similar.length) * 10
    : 5;

  const weighted =
    setupScore * 0.30 +
    rrScore * 0.20 +
    riskConsistency * 0.20 +
    emotionalStability * 0.15 +
    histPerf * 0.15;

  return Math.round(weighted * 10) / 10;
}

export function edgeScoreLabel(score: number): { label: string; color: string } {
  if (score >= 8) return { label: 'Institutional Grade', color: 'text-success' };
  if (score >= 5) return { label: 'Developing Edge', color: 'text-chart-4' };
  return { label: 'Weak Edge', color: 'text-loss' };
}

// ─── Discipline Score (0–100) ──────────────────────────────────────────────
export function calcDisciplineScore(trade: Trade, allTrades: Trade[]): number {
  let score = 100;

  if (trade.rrRatio < 2) score -= 10;

  const risks = allTrades.map(t => t.riskPercent);
  const avgRisk = risks.reduce((s, r) => s + r, 0) / (risks.length || 1);
  if (Math.abs(trade.riskPercent - avgRisk) > 1) score -= 15;

  // Revenge: 3 trades within 1 hour after a loss
  const tradeTime = new Date(trade.createdAt).getTime();
  const recentAfterLoss = allTrades.filter(t => {
    const prev = new Date(t.createdAt).getTime();
    return t.result === 'loss' && tradeTime - prev < 60 * 60 * 1000 && tradeTime > prev;
  });
  if (recentAfterLoss.length >= 1) score -= 10;

  if (['FOMO', 'Revenge', 'Greedy'].includes(trade.emotionBefore)) score -= 15;

  return Math.max(0, Math.min(100, score));
}

// ─── Portfolio-level analytics ─────────────────────────────────────────────
export function calcPortfolioStats(trades: Trade[]) {
  const closed = trades.filter(t => t.result === 'win' || t.result === 'loss' || t.result === 'breakeven');
  const rValues = closed.map(t => calcRMultiple(t));
  const wins = rValues.filter(r => r > 0);
  const losses = rValues.filter(r => r < 0);

  const totalR = rValues.reduce((s, r) => s + r, 0);
  const avgR = closed.length > 0 ? totalR / closed.length : 0;
  const winRate = closed.length > 0 ? wins.length / closed.length : 0;
  const avgWinR = wins.length > 0 ? wins.reduce((s, r) => s + r, 0) / wins.length : 0;
  const avgLossR = losses.length > 0 ? Math.abs(losses.reduce((s, r) => s + r, 0) / losses.length) : 0;

  const profitFactor = losses.length > 0
    ? wins.reduce((s, r) => s + r, 0) / Math.abs(losses.reduce((s, r) => s + r, 0))
    : wins.length > 0 ? Infinity : 0;

  const expectancy = winRate * avgWinR - (1 - winRate) * avgLossR;

  // Equity curve (cumulative R)
  let running = 0;
  const equityCurve = closed
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((t, i) => {
      running += calcRMultiple(t);
      return {
        trade: i + 1,
        equity: Math.round(running * 100) / 100,
        date: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });

  // Max drawdown
  let peak = 0;
  let maxDD = 0;
  equityCurve.forEach(({ equity }) => {
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
  });

  // Session breakdown
  const sessionStats: Record<string, { wins: number; losses: number }> = {};
  closed.forEach(t => {
    const hour = new Date(t.createdAt).getUTCHours();
    const session = hour >= 0 && hour < 8 ? 'Asia' : hour >= 8 && hour < 14 ? 'London' : 'New York';
    if (!sessionStats[session]) sessionStats[session] = { wins: 0, losses: 0 };
    if (t.result === 'win') sessionStats[session].wins++;
    else sessionStats[session].losses++;
  });

  // Timeframe heatmap
  const tfStats: Record<string, { wins: number; losses: number }> = {};
  closed.forEach(t => {
    if (!tfStats[t.timeframe]) tfStats[t.timeframe] = { wins: 0, losses: 0 };
    if (t.result === 'win') tfStats[t.timeframe].wins++;
    else tfStats[t.timeframe].losses++;
  });

  // Setup win rates
  const setupStats = {
    fullSMC: closed.filter(t => t.bosPresent && t.liquiditySweep && t.orderBlock),
    bosOnly: closed.filter(t => t.bosPresent && !t.liquiditySweep && !t.orderBlock),
    liquiditySweep: closed.filter(t => t.liquiditySweep && !t.bosPresent),
    orderBlock: closed.filter(t => t.orderBlock && !t.bosPresent && !t.liquiditySweep),
  };

  return {
    totalR: Math.round(totalR * 100) / 100,
    avgR: Math.round(avgR * 100) / 100,
    winRate: Math.round(winRate * 100),
    profitFactor: isFinite(profitFactor) ? Math.round(profitFactor * 100) / 100 : 99.9,
    expectancy: Math.round(expectancy * 100) / 100,
    maxDrawdown: Math.round(maxDD * 10) / 10,
    equityCurve,
    sessionStats,
    tfStats,
    setupStats,
    closed,
    rValues,
  };
}

// ─── Psychology analysis ───────────────────────────────────────────────────
export function calcPsychStats(trades: Trade[]) {
  const closed = trades.filter(t => t.result === 'win' || t.result === 'loss');

  const wr = (subset: Trade[]) =>
    subset.length > 0 ? Math.round((subset.filter(t => t.result === 'win').length / subset.length) * 100) : 0;

  const highConf = closed.filter(t => t.confidenceLevel >= 8);
  const afterLoss = closed.filter((t, i) => {
    const prev = closed[i - 1];
    return prev?.result === 'loss';
  });
  const afterTwoLosses = closed.filter((t, i) => {
    return closed[i - 1]?.result === 'loss' && closed[i - 2]?.result === 'loss';
  });

  // Emotion-performance correlation
  const emotionWR: Record<string, { wins: number; total: number }> = {};
  closed.forEach(t => {
    const e = t.emotionBefore || 'Unknown';
    if (!emotionWR[e]) emotionWR[e] = { wins: 0, total: 0 };
    emotionWR[e].total++;
    if (t.result === 'win') emotionWR[e].wins++;
  });

  // Revenge trading detection: 3 trades in 1 hour after a loss
  let revengeDetected = false;
  closed.forEach((t, i) => {
    if (t.result === 'loss') {
      const nextHour = new Date(t.createdAt).getTime() + 60 * 60 * 1000;
      const tradesAfter = closed.slice(i + 1).filter(t2 => new Date(t2.createdAt).getTime() < nextHour);
      if (tradesAfter.length >= 2) revengeDetected = true;
    }
  });

  const avgDiscipline = closed.length > 0
    ? Math.round(closed.reduce((s, t) => s + calcDisciplineScore(t, trades), 0) / closed.length)
    : 0;

  return {
    wrHighConf: wr(highConf),
    highConfCount: highConf.length,
    wrAfterLoss: wr(afterLoss),
    afterLossCount: afterLoss.length,
    wrAfterTwoLosses: wr(afterTwoLosses),
    afterTwoLossCount: afterTwoLosses.length,
    emotionWR,
    revengeDetected,
    avgDiscipline,
  };
}
