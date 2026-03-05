import { useState, useRef, useMemo, useCallback } from 'react';
import { Download, Share2, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTrades } from '@/hooks/useTrades';
import { useUserXP, getLevelFromXP } from '@/hooks/useGamification';
import { useProfile } from '@/hooks/useProfile';
import { calcPortfolioStats } from '@/lib/analytics';

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function ExportSection() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange>('30d');
  const [generating, setGenerating] = useState(false);
  const { data: trades = [] } = useTrades();
  const { data: xp } = useUserXP();
  const { data: profile } = useProfile();
  const cardRef = useRef<HTMLDivElement>(null);

  const filteredTrades = useMemo(() => {
    if (range === 'all') return trades;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return trades.filter(t => new Date(t.createdAt) >= cutoff);
  }, [trades, range]);

  const stats = useMemo(() => calcPortfolioStats(filteredTrades), [filteredTrades]);
  const level = getLevelFromXP(xp?.totalXp ?? 0);

  const generateCSV = useCallback(() => {
    const headers = ['Date', 'Pair', 'Direction', 'Entry', 'SL', 'TP', 'Lot Size', 'Risk %', 'R:R', 'Result', 'P/L'];
    const rows = filteredTrades.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t.pair, t.direction, t.entryPrice, t.stopLoss, t.takeProfit,
      t.lotSize, t.riskPercent, t.rrRatio, t.result, t.profitLossAmount,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-report-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredTrades, range]);

  const handleShare = async () => {
    const text = `📊 My ${range === 'all' ? 'All-Time' : range.toUpperCase()} Trading Performance\n\n` +
      `Win Rate: ${stats.winRate}%\n` +
      `Total R: ${stats.totalR}R\n` +
      `Profit Factor: ${stats.profitFactor}\n` +
      `Trades: ${stats.closed.length}\n` +
      `Level: ${level.name}\n\n` +
      `Tracked with PrecisionFlow 📱`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Trading Performance', text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const rangeLabel = range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last 90 Days' : 'All Time';

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8"
      >
        <Download className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Export & Share
            </DialogTitle>
          </DialogHeader>

          {/* Date Range */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as DateRange[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  range === r
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground'
                }`}
              >
                {r === 'all' ? 'All' : r.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Snapshot Card */}
          <div ref={cardRef} className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">{profile?.displayName || 'Trader'}</p>
                <p className="text-[10px] text-muted-foreground">{rangeLabel} Performance</p>
              </div>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                {level.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-secondary/50 rounded-lg p-2">
                <p className="text-lg font-bold text-foreground">{stats.winRate}%</p>
                <p className="text-[9px] text-muted-foreground">Win Rate</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2">
                <p className={`text-lg font-bold ${stats.totalR >= 0 ? 'text-success' : 'text-loss'}`}>
                  {stats.totalR > 0 ? '+' : ''}{stats.totalR}R
                </p>
                <p className="text-[9px] text-muted-foreground">Total R</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2">
                <p className="text-lg font-bold text-foreground">{stats.profitFactor}</p>
                <p className="text-[9px] text-muted-foreground">Profit Factor</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2">
                <p className="text-lg font-bold text-foreground">{stats.closed.length}</p>
                <p className="text-[9px] text-muted-foreground">Trades</p>
              </div>
            </div>
            <p className="text-[8px] text-muted-foreground text-center">Tracked with PrecisionFlow</p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={generateCSV} className="gap-2">
              <Download className="h-4 w-4" />
              CSV Export
            </Button>
            <Button onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
