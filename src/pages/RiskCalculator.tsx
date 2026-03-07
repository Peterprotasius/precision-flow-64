import { useState, useMemo } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { Calculator, DollarSign, Percent, Target, AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function RiskCalculator() {
  const { data: trades = [] } = useTrades();

  const [accountBalance, setAccountBalance] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('1');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [pipValue, setPipValue] = useState('10');

  const calc = useMemo(() => {
    const balance = parseFloat(accountBalance) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tp = parseFloat(takeProfit) || 0;
    const pv = parseFloat(pipValue) || 10;

    const riskAmount = balance * (risk / 100);
    const slDistance = Math.abs(entry - sl);
    const tpDistance = Math.abs(tp - entry);
    const rrRatio = slDistance > 0 ? tpDistance / slDistance : 0;

    // Pip-based position sizing (for forex: 1 pip = 0.0001 for most, 0.01 for JPY)
    const slPips = slDistance > 0 ? slDistance : 0;
    const positionSize = slPips > 0 && pv > 0 ? riskAmount / (slPips * pv) : 0;
    const potentialProfit = slPips > 0 ? riskAmount * rrRatio : 0;

    return {
      riskAmount: Math.round(riskAmount * 100) / 100,
      slDistance: Math.round(slDistance * 100000) / 100000,
      tpDistance: Math.round(tpDistance * 100000) / 100000,
      rrRatio: Math.round(rrRatio * 100) / 100,
      positionSize: Math.round(positionSize * 100) / 100,
      potentialProfit: Math.round(potentialProfit * 100) / 100,
    };
  }, [accountBalance, riskPercent, entryPrice, stopLoss, takeProfit, pipValue]);

  // Historical stats for context
  const historicalStats = useMemo(() => {
    const closed = trades.filter(t => t.result === 'win' || t.result === 'loss');
    if (closed.length === 0) return null;

    const avgRisk = closed.reduce((s, t) => s + t.riskPercent, 0) / closed.length;
    const avgRR = closed.reduce((s, t) => s + t.rrRatio, 0) / closed.length;
    const winRate = closed.filter(t => t.result === 'win').length / closed.length;
    const maxRisk = Math.max(...closed.map(t => t.riskPercent));

    return {
      avgRisk: Math.round(avgRisk * 100) / 100,
      avgRR: Math.round(avgRR * 100) / 100,
      winRate: Math.round(winRate * 100),
      maxRisk: Math.round(maxRisk * 100) / 100,
    };
  }, [trades]);

  // Risk level indicator
  const riskLevel = useMemo(() => {
    const r = parseFloat(riskPercent) || 0;
    if (r <= 1) return { label: 'Conservative', color: 'text-success', bg: 'bg-success/10 border-success/20' };
    if (r <= 2) return { label: 'Moderate', color: 'text-chart-4', bg: 'bg-chart-4/10 border-chart-4/20' };
    if (r <= 3) return { label: 'Aggressive', color: 'text-loss', bg: 'bg-loss/10 border-loss/20' };
    return { label: 'Dangerous', color: 'text-loss', bg: 'bg-loss/20 border-loss/30' };
  }, [riskPercent]);

  return (
    <div className="px-4 pt-6 pb-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Risk Calculator</h1>
        <p className="text-sm text-muted-foreground">Position sizing & risk management</p>
      </div>

      {/* Risk Level Badge */}
      <div className={`glass-card p-3 border ${riskLevel.bg} flex items-center gap-3`}>
        <Shield className={`h-5 w-5 ${riskLevel.color}`} />
        <div>
          <p className={`text-sm font-bold ${riskLevel.color}`}>{riskLevel.label} Risk</p>
          <p className="text-[10px] text-muted-foreground">
            {parseFloat(riskPercent) <= 1 ? 'Institutional standard' : parseFloat(riskPercent) <= 2 ? 'Acceptable for experienced traders' : 'Consider reducing your risk'}
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="glass-card p-4 space-y-4">
        <h2 className="stat-label">Trade Parameters</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Account Balance</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={accountBalance}
                onChange={e => setAccountBalance(e.target.value)}
                className="pl-9 bg-secondary/50 border-border"
                placeholder="10000"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Risk %</label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={riskPercent}
                onChange={e => setRiskPercent(e.target.value)}
                className="pl-9 bg-secondary/50 border-border"
                placeholder="1"
                step="0.25"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Entry Price</label>
            <Input
              type="number"
              value={entryPrice}
              onChange={e => setEntryPrice(e.target.value)}
              className="bg-secondary/50 border-border"
              placeholder="1.0850"
              step="0.0001"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Stop Loss</label>
            <Input
              type="number"
              value={stopLoss}
              onChange={e => setStopLoss(e.target.value)}
              className="bg-secondary/50 border-border"
              placeholder="1.0820"
              step="0.0001"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Take Profit</label>
            <Input
              type="number"
              value={takeProfit}
              onChange={e => setTakeProfit(e.target.value)}
              className="bg-secondary/50 border-border"
              placeholder="1.0910"
              step="0.0001"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Pip Value ($)</label>
          <Input
            type="number"
            value={pipValue}
            onChange={e => setPipValue(e.target.value)}
            className="bg-secondary/50 border-border w-1/2"
            placeholder="10"
          />
          <p className="text-[9px] text-muted-foreground mt-1">Standard lot = $10/pip for most pairs</p>
        </div>
      </div>

      {/* Results */}
      <div className="glass-card p-4 space-y-4">
        <h2 className="stat-label">Calculated Results</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/40 rounded-xl p-3 text-center">
            <Calculator className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-primary">{calc.positionSize}</p>
            <p className="text-[9px] text-muted-foreground">Lot Size</p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-3 text-center">
            <DollarSign className="h-5 w-5 text-loss mx-auto mb-1" />
            <p className="text-lg font-bold text-loss">${calc.riskAmount}</p>
            <p className="text-[9px] text-muted-foreground">Risk Amount</p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-3 text-center">
            <Target className="h-5 w-5 text-chart-4 mx-auto mb-1" />
            <p className="text-lg font-bold text-chart-4">{calc.rrRatio}:1</p>
            <p className="text-[9px] text-muted-foreground">R:R Ratio</p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-3 text-center">
            <TrendingUp className="h-5 w-5 text-success mx-auto mb-1" />
            <p className="text-lg font-bold text-success">${calc.potentialProfit}</p>
            <p className="text-[9px] text-muted-foreground">Potential Profit</p>
          </div>
        </div>

        {/* R:R Visual Bar */}
        {calc.rrRatio > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Risk</span>
              <span>Reward</span>
            </div>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div
                className="bg-loss/60 transition-all"
                style={{ width: `${Math.min(100 / (1 + calc.rrRatio), 50)}%` }}
              />
              <div
                className="bg-success/60 transition-all"
                style={{ width: `${Math.min((calc.rrRatio * 100) / (1 + calc.rrRatio), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-loss">${calc.riskAmount}</span>
              <span className="text-success">${calc.potentialProfit}</span>
            </div>
          </div>
        )}
      </div>

      {/* R:R quality warning */}
      {calc.rrRatio > 0 && calc.rrRatio < 2 && (
        <div className="glass-card p-3 border border-chart-4/30 bg-chart-4/5 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-chart-4 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-chart-4">R:R Below 2:1</p>
            <p className="text-[10px] text-muted-foreground">Professional traders target minimum 2:1 risk-to-reward. Consider adjusting your TP or SL.</p>
          </div>
        </div>
      )}

      {/* Historical Context */}
      {historicalStats && (
        <div className="glass-card p-4">
          <h2 className="stat-label mb-3">Your Historical Averages</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-foreground">{historicalStats.avgRisk}%</p>
              <p className="text-[9px] text-muted-foreground">Avg Risk %</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-foreground">{historicalStats.avgRR}:1</p>
              <p className="text-[9px] text-muted-foreground">Avg R:R</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-foreground">{historicalStats.winRate}%</p>
              <p className="text-[9px] text-muted-foreground">Win Rate</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className={`text-sm font-bold ${historicalStats.maxRisk > 2 ? 'text-loss' : 'text-foreground'}`}>{historicalStats.maxRisk}%</p>
              <p className="text-[9px] text-muted-foreground">Max Risk Used</p>
            </div>
          </div>

          {/* Deviation warning */}
          {parseFloat(riskPercent) > 0 && historicalStats.avgRisk > 0 && Math.abs(parseFloat(riskPercent) - historicalStats.avgRisk) > 0.5 && (
            <div className="mt-3 flex items-start gap-2 text-chart-4 bg-chart-4/10 rounded-lg p-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p className="text-[10px]">
                Current risk ({riskPercent}%) deviates from your average ({historicalStats.avgRisk}%). Consistency is key to long-term edge.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
