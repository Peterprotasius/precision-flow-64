import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function ProTrialBanner() {
  const { subscribed } = useAuth();
  const navigate = useNavigate();

  if (subscribed) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-chart-4/30 bg-gradient-to-r from-chart-4/10 via-chart-5/10 to-primary/10 p-4 animate-fade-in">
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-chart-4/10 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-chart-5/10 blur-xl" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chart-4/20">
          <Sparkles className="h-5 w-5 text-chart-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground text-sm">Try Pro Analytics Free</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-chart-4/20 text-chart-4 px-1.5 py-0.5 rounded">Limited Time</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Unlock AI Market Analysis, Prop Firm Tracker, session heatmaps, PDF reports & unlimited trades.
          </p>
          <Button
            size="sm"
            className="h-8 bg-chart-4 text-background hover:bg-chart-4/90 gap-1.5 text-xs font-semibold"
            onClick={() => navigate('/upgrade')}
          >
            <Crown className="h-3.5 w-3.5" />
            Upgrade to Pro
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
