import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SETUP_TYPES = [
  'Order Block', 'FVG', 'BOS', 'CHoCH', 'Liquidity Grab',
  'CISD', 'MSS', 'Premium Zone', 'Discount Zone', 'Inducement'
];

const SESSIONS = ['London', 'New York', 'Asian', 'London-NY Overlap', 'Other'];

const EXECUTION_QUALITIES = [
  'A+ Setup', 'B Setup', 'C Setup', 'Forced Trade',
  'FOMO Entry', 'Revenge Trade', 'Early Entry', 'Late Entry'
];

const TIMEFRAME_BIASES = [
  'HTF Bias Confirmed', 'LTF Entry', 'HTF Conflict', 'Top-Down Aligned'
];

const STRATEGIES = [
  'Smart Money Concepts', 'Break & Retest', 'Scalping',
  'Supply & Demand', 'Price Action', 'Custom Strategy'
];

const OUTCOME_TAGS = [
  'Full Target Hit', 'Partial Take Profit', 'Breakeven',
  'Stopped Out', 'Manual Close', 'Closed Early'
];

interface TradeTagsProps {
  setupTypes: string[];
  onSetupTypesChange: (v: string[]) => void;
  session: string;
  onSessionChange: (v: string) => void;
  executionQuality: string;
  onExecutionQualityChange: (v: string) => void;
  timeframeBias: string[];
  onTimeframeBiasChange: (v: string[]) => void;
  strategy: string;
  onStrategyChange: (v: string) => void;
  customStrategyName: string;
  onCustomStrategyNameChange: (v: string) => void;
  outcomeTag: string;
  onOutcomeTagChange: (v: string) => void;
}

function ChipSelect({ options, selected, onChange, multi = true }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  multi?: boolean;
}) {
  const toggle = (opt: string) => {
    if (multi) {
      onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
    } else {
      onChange([opt]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
            selected.includes(opt)
              ? 'bg-primary/20 border-primary text-primary font-medium'
              : 'bg-secondary border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function TradeTagsSection({
  setupTypes, onSetupTypesChange,
  session, onSessionChange,
  executionQuality, onExecutionQualityChange,
  timeframeBias, onTimeframeBiasChange,
  strategy, onStrategyChange,
  customStrategyName, onCustomStrategyNameChange,
  outcomeTag, onOutcomeTagChange,
}: TradeTagsProps) {
  return (
    <section className="glass-card p-4 space-y-4 animate-fade-in">
      <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Advanced Tags</h2>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Setup Type (multi-select)</Label>
        <ChipSelect options={SETUP_TYPES} selected={setupTypes} onChange={onSetupTypesChange} />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Session</Label>
        <ChipSelect options={SESSIONS} selected={[session]} onChange={v => onSessionChange(v[0] || 'Other')} multi={false} />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Execution Quality</Label>
        <ChipSelect options={EXECUTION_QUALITIES} selected={[executionQuality]} onChange={v => onExecutionQualityChange(v[0] || 'B Setup')} multi={false} />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Timeframe Bias (multi-select)</Label>
        <ChipSelect options={TIMEFRAME_BIASES} selected={timeframeBias} onChange={onTimeframeBiasChange} />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Strategy</Label>
        <ChipSelect options={STRATEGIES} selected={[strategy]} onChange={v => onStrategyChange(v[0] || 'Smart Money Concepts')} multi={false} />
        {strategy === 'Custom Strategy' && (
          <Input
            className="bg-secondary border-border mt-2"
            placeholder="Enter custom strategy name..."
            value={customStrategyName}
            onChange={e => onCustomStrategyNameChange(e.target.value)}
          />
        )}
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Trade Outcome</Label>
        <ChipSelect options={OUTCOME_TAGS} selected={[outcomeTag]} onChange={v => onOutcomeTagChange(v[0] || '')} multi={false} />
      </div>
    </section>
  );
}
