import { useState, useMemo } from 'react';
import { useTradeStore } from '@/lib/trade-store';
import { Trade } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, ArrowDownRight, ChevronRight, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function TradeList() {
  const { trades } = useTradeStore();
  const [filterPair, setFilterPair] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return trades
      .filter(t => filterPair === 'all' || t.pair === filterPair)
      .filter(t => filterResult === 'all' || t.result === filterResult)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [trades, filterPair, filterResult]);

  const uniquePairs = [...new Set(trades.map(t => t.pair))];

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Trades</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} trades</p>
        </div>
        <button
          className="flex items-center gap-1 text-sm text-primary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <div className="flex gap-3 animate-fade-in">
          <Select value={filterPair} onValueChange={setFilterPair}>
            <SelectTrigger className="bg-secondary border-border flex-1"><SelectValue placeholder="Pair" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pairs</SelectItem>
              {uniquePairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="bg-secondary border-border flex-1"><SelectValue placeholder="Result" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="win">Win</SelectItem>
              <SelectItem value="loss">Loss</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(trade => (
          <button
            key={trade.id}
            className="glass-card p-4 w-full text-left flex items-center gap-3 animate-fade-in"
            onClick={() => setSelectedTrade(trade)}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${trade.direction === 'buy' ? 'bg-success/15' : 'bg-loss/15'}`}>
              {trade.direction === 'buy'
                ? <ArrowUpRight className="h-5 w-5 text-success" />
                : <ArrowDownRight className="h-5 w-5 text-loss" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{trade.pair}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  trade.result === 'win' ? 'bg-success/15 text-success' : 'bg-loss/15 text-loss'
                }`}>{trade.result.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{trade.timeframe}</span>
                <span>·</span>
                <span>{new Date(trade.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${trade.profitLossAmount >= 0 ? 'text-success' : 'text-loss'}`}>
                {trade.profitLossAmount >= 0 ? '+' : ''}${trade.profitLossAmount}
              </p>
              <p className="text-xs text-muted-foreground">{trade.rrRatio}:1 R:R</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Trade Detail Dialog */}
      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          {selectedTrade && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  {selectedTrade.pair}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedTrade.result === 'win' ? 'bg-success/15 text-success' : 'bg-loss/15 text-loss'
                  }`}>{selectedTrade.result.toUpperCase()}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Direction', selectedTrade.direction.toUpperCase()],
                    ['Entry', selectedTrade.entryPrice],
                    ['Stop Loss', selectedTrade.stopLoss],
                    ['Take Profit', selectedTrade.takeProfit],
                    ['Lot Size', selectedTrade.lotSize],
                    ['Risk %', `${selectedTrade.riskPercent}%`],
                    ['R:R', `${selectedTrade.rrRatio}:1`],
                    ['P/L', `$${selectedTrade.profitLossAmount}`],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <p className="font-medium text-foreground">{val}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3">
                  <h3 className="text-primary font-semibold text-xs uppercase tracking-wider mb-2">SMC Logic</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>HTF Bias: <span className={selectedTrade.htfBias === 'bullish' ? 'text-success' : 'text-loss'}>{selectedTrade.htfBias}</span></div>
                    <div>Timeframe: <span className="text-foreground">{selectedTrade.timeframe}</span></div>
                    <div>BOS: <span className={selectedTrade.bosPresent ? 'text-success' : 'text-loss'}>{selectedTrade.bosPresent ? 'Yes' : 'No'}</span></div>
                    <div>Liq Sweep: <span className={selectedTrade.liquiditySweep ? 'text-success' : 'text-loss'}>{selectedTrade.liquiditySweep ? 'Yes' : 'No'}</span></div>
                    <div>Order Block: <span className={selectedTrade.orderBlock ? 'text-success' : 'text-loss'}>{selectedTrade.orderBlock ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <h3 className="text-primary font-semibold text-xs uppercase tracking-wider mb-2">Psychology</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Confidence: <span className="text-foreground">{selectedTrade.confidenceLevel}/10</span></div>
                    <div>Before: <span className="text-foreground">{selectedTrade.emotionBefore}</span></div>
                    <div>After: <span className="text-foreground">{selectedTrade.emotionAfter}</span></div>
                  </div>
                </div>

                {selectedTrade.notes && (
                  <div className="border-t border-border pt-3">
                    <h3 className="text-primary font-semibold text-xs uppercase tracking-wider mb-1">Notes</h3>
                    <p className="text-muted-foreground text-xs">{selectedTrade.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
