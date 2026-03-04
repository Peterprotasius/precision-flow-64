import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wifi, WifiOff, Upload, Download, Plus, Trash2, Monitor, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PAIRS } from '@/lib/mock-data';

interface BrokerConnection {
  id: string;
  broker_name: string;
  broker_type: string;
  account_number: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  sync_status: string;
}

export default function BrokerSync() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [brokerName, setBrokerName] = useState('');
  const [brokerType, setBrokerType] = useState('mt5');
  const [accountNumber, setAccountNumber] = useState('');

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['broker-connections', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_connections')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BrokerConnection[];
    },
    enabled: !!user,
  });

  const addConnection = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('broker_connections').insert({
        user_id: user!.id,
        broker_name: brokerName,
        broker_type: brokerType,
        account_number: accountNumber || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      setAddOpen(false);
      setBrokerName('');
      setAccountNumber('');
      toast.success('Broker account added!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteConnection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('broker_connections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      toast.success('Broker removed');
    },
  });

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      toast.error('CSV file appears empty');
      return;
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Auto-detect columns
    const pairCol = headers.findIndex(h => ['pair', 'symbol', 'instrument', 'asset'].includes(h));
    const dirCol = headers.findIndex(h => ['direction', 'type', 'side', 'action'].includes(h));
    const entryCol = headers.findIndex(h => ['entry', 'entry_price', 'open', 'open_price'].includes(h));
    const exitCol = headers.findIndex(h => ['exit', 'exit_price', 'close', 'close_price'].includes(h));
    const lotCol = headers.findIndex(h => ['lot', 'lots', 'lot_size', 'volume', 'size'].includes(h));
    const plCol = headers.findIndex(h => ['pl', 'p/l', 'profit', 'profit_loss', 'pnl', 'net_profit'].includes(h));
    const slCol = headers.findIndex(h => ['sl', 'stop_loss', 'stoploss', 'stop'].includes(h));
    const tpCol = headers.findIndex(h => ['tp', 'take_profit', 'takeprofit', 'target'].includes(h));

    if (pairCol === -1 || entryCol === -1) {
      toast.error('Could not detect required columns (pair, entry). Check your CSV format.');
      return;
    }

    let imported = 0;
    const trades = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (!cols[pairCol]) continue;

      const entry = parseFloat(cols[entryCol]) || 0;
      const sl = slCol !== -1 ? parseFloat(cols[slCol]) || 0 : 0;
      const tp = tpCol !== -1 ? parseFloat(cols[tpCol]) || 0 : 0;
      const pl = plCol !== -1 ? parseFloat(cols[plCol]) || 0 : 0;
      const lot = lotCol !== -1 ? parseFloat(cols[lotCol]) || 0.1 : 0.1;
      const dir = dirCol !== -1 ? (cols[dirCol]?.toLowerCase().includes('buy') ? 'buy' : 'sell') : 'buy';
      const risk = sl && entry ? Math.abs(entry - sl) : 0;
      const reward = tp && entry ? Math.abs(tp - entry) : 0;
      const rr = risk > 0 ? reward / risk : 0;

      trades.push({
        user_id: user!.id,
        pair: cols[pairCol],
        direction: dir,
        entry_price: entry,
        stop_loss: sl,
        take_profit: tp,
        lot_size: lot,
        risk_percent: 1,
        rr_ratio: parseFloat(rr.toFixed(2)),
        result: pl > 0 ? 'win' : pl < 0 ? 'loss' : 'breakeven',
        profit_loss_amount: pl,
        timeframe: '15m',
        htf_bias: 'bullish',
      });
      imported++;
    }

    if (trades.length > 0) {
      const { error } = await supabase.from('trades').insert(trades);
      if (error) {
        toast.error('Import failed: ' + error.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    }

    toast.success(`${imported} trades imported successfully!`);
    setCsvOpen(false);
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold text-foreground">Connect Broker</h1>
      </div>

      {/* Connection Methods */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setGuideOpen(true)}
          className="glass-card p-4 text-left space-y-2 animate-fade-in"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">MT4/MT5 Sync</h3>
          <p className="text-xs text-muted-foreground">Auto-sync via EA plugin</p>
        </button>
        <button
          onClick={() => setCsvOpen(true)}
          className="glass-card p-4 text-left space-y-2 animate-fade-in"
        >
          <div className="h-10 w-10 rounded-lg bg-chart-4/15 flex items-center justify-center">
            <FileText className="h-5 w-5 text-chart-4" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">CSV Import</h3>
          <p className="text-xs text-muted-foreground">Import trade history</p>
        </button>
      </div>

      {/* Broker Accounts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Broker Accounts</h2>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="gap-1">
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>

        {isLoading ? (
          <div className="glass-card p-8 text-center"><p className="text-muted-foreground text-sm">Loading...</p></div>
        ) : connections.length === 0 ? (
          <div className="glass-card p-8 text-center space-y-3">
            <WifiOff className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-sm">No broker accounts connected yet</p>
            <Button size="sm" onClick={() => setAddOpen(true)}>Add Broker Account</Button>
          </div>
        ) : (
          connections.map(conn => (
            <div key={conn.id} className="glass-card p-4 flex items-center gap-3 animate-fade-in">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${conn.is_active ? 'bg-success/15' : 'bg-muted'}`}>
                {conn.is_active ? <Wifi className="h-5 w-5 text-success" /> : <WifiOff className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">{conn.broker_name}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{conn.broker_type}</span>
                  {conn.is_active && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                  )}
                </div>
                {conn.account_number && <p className="text-xs text-muted-foreground">Account: {conn.account_number}</p>}
                {conn.last_synced_at && (
                  <p className="text-xs text-muted-foreground">Last synced: {new Date(conn.last_synced_at).toLocaleString()}</p>
                )}
              </div>
              <button onClick={() => deleteConnection.mutate(conn.id)} className="text-muted-foreground hover:text-loss">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Broker Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader><DialogTitle>Add Broker Account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Broker Name</Label>
              <Input className="bg-secondary border-border" value={brokerName} onChange={e => setBrokerName(e.target.value)} placeholder="e.g. ICMarkets, Exness" />
            </div>
            <div>
              <Label>Platform</Label>
              <Select value={brokerType} onValueChange={setBrokerType}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mt4">MetaTrader 4</SelectItem>
                  <SelectItem value="mt5">MetaTrader 5</SelectItem>
                  <SelectItem value="ctrader">cTrader</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Account Number (optional)</Label>
              <Input className="bg-secondary border-border" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="12345678" />
            </div>
            <Button className="w-full" onClick={() => addConnection.mutate()} disabled={!brokerName || addConnection.isPending}>
              {addConnection.isPending ? 'Adding...' : 'Add Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader><DialogTitle>Import Trades from CSV</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="glass-card p-3 space-y-2">
              <h4 className="text-xs font-semibold text-primary uppercase">AI Auto-Mapper</h4>
              <p className="text-xs text-muted-foreground">
                Our system automatically detects column headers. Supported columns:
              </p>
              <div className="flex flex-wrap gap-1">
                {['pair/symbol', 'direction/type', 'entry', 'exit', 'sl', 'tp', 'lot/volume', 'profit/pnl'].map(h => (
                  <span key={h} className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full">{h}</span>
                ))}
              </div>
            </div>
            <div>
              <Label className="cursor-pointer">
                <div className="glass-card p-6 text-center space-y-2 hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-foreground">Click to select CSV file</p>
                  <p className="text-xs text-muted-foreground">Supports .csv exports from MT4/MT5</p>
                </div>
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MT4/MT5 Setup Guide Dialog */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="bg-card border-border max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>MT4/MT5 Auto-Sync Setup</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Download the EA Plugin', desc: 'Download the PrecisionFlow EA plugin for your MT4 or MT5 terminal.' },
              { step: 2, title: 'Install the EA', desc: 'Copy the EA file to your terminal\'s Experts folder: MQL4/Experts (MT4) or MQL5/Experts (MT5).' },
              { step: 3, title: 'Enable Auto Trading', desc: 'In your terminal, go to Tools → Options → Expert Advisors and enable "Allow automated trading".' },
              { step: 4, title: 'Attach EA to Chart', desc: 'Open any chart, drag the PrecisionFlow EA onto it, and enter your API key from Settings.' },
              { step: 5, title: 'Verify Connection', desc: 'The EA will show a green "Connected" status in the top-right corner of your chart.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{s.step}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
            <div className="glass-card p-3 border-chart-4/30">
              <p className="text-xs text-chart-4">⚠️ EA plugin is coming soon. For now, use CSV import to bulk-import your trade history.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
