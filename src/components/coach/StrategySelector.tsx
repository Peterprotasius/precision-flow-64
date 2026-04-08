import { Target, TrendingUp, BarChart3 } from 'lucide-react';

export type Strategy = 'smc' | 'trendline' | 'snr' | null;

interface StrategySelectorProps {
  selected: Strategy;
  onSelect: (strategy: Strategy) => void;
}

const strategies = [
  { key: 'smc' as const, label: 'SMC', icon: Target, desc: 'Smart Money Concepts' },
  { key: 'trendline' as const, label: 'Trendline', icon: TrendingUp, desc: 'Break & Retest' },
  { key: 'snr' as const, label: 'S&R', icon: BarChart3, desc: 'Support & Resistance' },
];

export default function StrategySelector({ selected, onSelect }: StrategySelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {strategies.map(s => {
        const Icon = s.icon;
        const active = selected === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onSelect(active ? null : s.key)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
