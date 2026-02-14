import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '@/lib/trade-store';
import { EMOTIONS, PAIRS, TIMEFRAMES, Trade } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function AddTrade() {
  const navigate = useNavigate();
  const addTrade = useTradeStore((s) => s.addTrade);

  const [pair, setPair] = useState('');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [riskPercent, setRiskPercent] = useState('');
  const [result, setResult] = useState<'win' | 'loss' | 'breakeven'>('win');
  const [profitLoss, setProfitLoss] = useState('');
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [htfBias, setHtfBias] = useState<'bullish' | 'bearish'>('bullish');
  const [bosPresent, setBosPresent] = useState(false);
  const [liquiditySweep, setLiquiditySweep] = useState(false);
  const [orderBlock, setOrderBlock] = useState(false);
  const [confidence, setConfidence] = useState([5]);
  const [emotionBefore, setEmotionBefore] = useState('');
  const [emotionAfter, setEmotionAfter] = useState('');
  const [notes, setNotes] = useState('');

  const calcRR = () => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    if (!entry || !sl || !tp || entry === sl) return '—';
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    return (reward / risk).toFixed(1);
  };

  const handleSave = () => {
    if (!pair || !entryPrice || !stopLoss || !takeProfit) {
      toast.error('Please fill in required fields');
      return;
    }

    const trade: Trade = {
      id: Date.now().toString(),
      pair,
      direction,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      lotSize: parseFloat(lotSize) || 0.1,
      riskPercent: parseFloat(riskPercent) || 1,
      rrRatio: parseFloat(calcRR()) || 0,
      result,
      profitLossAmount: parseFloat(profitLoss) || 0,
      timeframe: timeframe as Trade['timeframe'],
      htfBias,
      bosPresent,
      liquiditySweep,
      orderBlock,
      confidenceLevel: confidence[0],
      emotionBefore,
      emotionAfter,
      notes,
      createdAt: new Date().toISOString(),
    };

    addTrade(trade);
    toast.success('Trade saved!');
    navigate('/trades');
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Add Trade</h1>
      </div>

      {/* Basic Info */}
      <section className="glass-card p-4 space-y-4 animate-fade-in">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Basic Information</h2>

        <div>
          <Label>Pair</Label>
          <Select value={pair} onValueChange={setPair}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select pair" /></SelectTrigger>
            <SelectContent>
              {PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Direction</Label>
          <div className="flex gap-2 mt-1">
            <Button
              variant={direction === 'buy' ? 'default' : 'outline'}
              className={direction === 'buy' ? 'bg-success text-success-foreground flex-1' : 'flex-1'}
              onClick={() => setDirection('buy')}
            >Buy</Button>
            <Button
              variant={direction === 'sell' ? 'default' : 'outline'}
              className={direction === 'sell' ? 'bg-loss text-loss-foreground flex-1' : 'flex-1'}
              onClick={() => setDirection('sell')}
            >Sell</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><Label>Entry Price</Label><Input className="bg-secondary border-border" type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} /></div>
          <div><Label>Stop Loss</Label><Input className="bg-secondary border-border" type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} /></div>
          <div><Label>Take Profit</Label><Input className="bg-secondary border-border" type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} /></div>
          <div><Label>Lot Size</Label><Input className="bg-secondary border-border" type="number" value={lotSize} onChange={e => setLotSize(e.target.value)} /></div>
          <div><Label>Risk %</Label><Input className="bg-secondary border-border" type="number" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} /></div>
          <div>
            <Label>R:R Ratio</Label>
            <div className="h-10 flex items-center px-3 bg-secondary border border-border rounded-md text-sm text-primary font-semibold">{calcRR()}:1</div>
          </div>
        </div>

        <div>
          <Label>Result</Label>
          <div className="flex gap-2 mt-1">
            {(['win', 'loss', 'breakeven'] as const).map(r => (
              <Button
                key={r}
                variant={result === r ? 'default' : 'outline'}
                className={`flex-1 capitalize ${result === r && r === 'win' ? 'bg-success text-success-foreground' : result === r && r === 'loss' ? 'bg-loss text-loss-foreground' : ''}`}
                onClick={() => setResult(r)}
              >{r}</Button>
            ))}
          </div>
        </div>

        <div><Label>Profit / Loss ($)</Label><Input className="bg-secondary border-border" type="number" value={profitLoss} onChange={e => setProfitLoss(e.target.value)} /></div>
      </section>

      {/* SMC Logic */}
      <section className="glass-card p-4 space-y-4 animate-fade-in">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">SMC Logic</h2>

        <div>
          <Label>Higher Timeframe Bias</Label>
          <div className="flex gap-2 mt-1">
            <Button variant={htfBias === 'bullish' ? 'default' : 'outline'} className={`flex-1 ${htfBias === 'bullish' ? 'bg-success text-success-foreground' : ''}`} onClick={() => setHtfBias('bullish')}>Bullish</Button>
            <Button variant={htfBias === 'bearish' ? 'default' : 'outline'} className={`flex-1 ${htfBias === 'bearish' ? 'bg-loss text-loss-foreground' : ''}`} onClick={() => setHtfBias('bearish')}>Bearish</Button>
          </div>
        </div>

        <div>
          <Label>Entry Timeframe</Label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map(tf => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Break of Structure (BOS)', value: bosPresent, set: setBosPresent },
            { label: 'Liquidity Sweep', value: liquiditySweep, set: setLiquiditySweep },
            { label: 'Order Block Mitigation', value: orderBlock, set: setOrderBlock },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between">
              <Label className="text-sm">{label}</Label>
              <Switch checked={value} onCheckedChange={set} />
            </div>
          ))}
        </div>
      </section>

      {/* Psychology */}
      <section className="glass-card p-4 space-y-4 animate-fade-in">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Psychology</h2>

        <div>
          <Label>Confidence Level: {confidence[0]}/10</Label>
          <Slider value={confidence} onValueChange={setConfidence} min={1} max={10} step={1} className="mt-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Emotion Before</Label>
            <Select value={emotionBefore} onValueChange={setEmotionBefore}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Emotion After</Label>
            <Select value={emotionAfter} onValueChange={setEmotionAfter}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea className="bg-secondary border-border mt-1" placeholder="Trade notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancel</Button>
        <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleSave}>Save Trade</Button>
      </div>
    </div>
  );
}
