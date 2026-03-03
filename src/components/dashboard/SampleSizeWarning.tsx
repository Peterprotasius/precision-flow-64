import { AlertTriangle } from 'lucide-react';

interface SampleSizeWarningProps {
  tradeCount: number;
}

export default function SampleSizeWarning({ tradeCount }: SampleSizeWarningProps) {
  if (tradeCount >= 20) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-chart-4/30 bg-chart-4/5 p-4 animate-fade-in">
      <AlertTriangle className="h-5 w-5 text-chart-4 shrink-0 mt-0.5" />
      <p className="text-sm text-chart-4">
        Limited sample size — statistics may not reflect true edge. Log at least 20 trades for meaningful data.
      </p>
    </div>
  );
}
