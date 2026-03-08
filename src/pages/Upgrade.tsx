import { useState } from 'react';
import { Crown, Copy, CheckCircle, Sparkles, Zap, BarChart3, Brain, Shield, ArrowLeft, Mail } from 'lucide-react';
import PaymentMethodsSection from '@/components/payment/PaymentMethods';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const BANK_DETAILS = {
  accountHolder: 'PETRUS S. PROTASIUS',
  accountNumber: '11990961265',
  accountType: 'Current Account',
  bankName: 'Nedbank',
  branchCode: '461079',
  amount: 'R165/month (≈ $9)',
  reference: 'PF-PRO',
};

const FEATURES = [
  { icon: <Zap className="h-4 w-4" />, label: 'Unlimited trade logging' },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Full institutional analytics & equity curve' },
  { icon: <Brain className="h-4 w-4" />, label: 'AI Trade Coach (GPT-powered insights)' },
  { icon: <Sparkles className="h-4 w-4" />, label: 'AI Market Analysis (Gold, USDT, V75 & more)' },
  { icon: <Shield className="h-4 w-4" />, label: 'Edge Score & Discipline Score tracking' },
  { icon: <Sparkles className="h-4 w-4" />, label: 'Psychology module & emotional check-ins' },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Prop Firm Challenge Tracker' },
  { icon: <Shield className="h-4 w-4" />, label: 'Risk calculator & position sizing' },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Session analytics & performance heatmaps' },
  { icon: <Zap className="h-4 w-4" />, label: 'Broker auto-sync (MT4/MT5)' },
  { icon: <Brain className="h-4 w-4" />, label: 'Trade screenshot storage & annotation' },
  { icon: <Sparkles className="h-4 w-4" />, label: 'XP gamification, streaks & achievements' },
];

export default function Upgrade() {
  const [copied, setCopied] = useState<string | null>(null);
  const { subscribed } = useAuth();
  const navigate = useNavigate();

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  // If already Pro, show status
  if (subscribed) {
    return (
      <div className="px-4 pt-6 pb-24 space-y-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="glass-card p-6 text-center animate-fade-in border border-chart-4/30">
          <CheckCircle className="h-12 w-12 text-chart-4 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-1">You're on Pro!</h2>
          <p className="text-sm text-muted-foreground">You have full access to all Pro features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 space-y-5 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Crown className="h-5 w-5 text-chart-4" />
        Upgrade to Pro
      </h1>

      {/* Pricing & Features */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-chart-4/20 via-primary/10 to-chart-5/10 p-5 border border-chart-4/20 animate-fade-in">
        <div className="text-center mb-4">
          <p className="text-4xl font-bold text-chart-4">R165<span className="text-base text-muted-foreground font-normal">/month</span></p>
          <p className="text-xs text-muted-foreground">≈ $9 USD · Cancel anytime</p>
        </div>
        <div className="space-y-2.5">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="text-chart-4">{f.icon}</div>
              <span className="text-sm text-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bank Transfer Details */}
      <div className="glass-card p-4 space-y-3 border border-border animate-fade-in">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          🏦 Bank Transfer Details
        </h3>
        {Object.entries({
          'Account Holder': BANK_DETAILS.accountHolder,
          'Account Number': BANK_DETAILS.accountNumber,
          'Account Type': BANK_DETAILS.accountType,
          'Bank': BANK_DETAILS.bankName,
          'Branch Code': BANK_DETAILS.branchCode,
          'Amount': BANK_DETAILS.amount,
          'Reference': BANK_DETAILS.reference,
        }).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>
            <button
              onClick={() => copy(value, label)}
              className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
            >
              {copied === label
                ? <CheckCircle className="h-3.5 w-3.5 text-chart-4" />
                : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="rounded-xl bg-chart-4/10 border border-chart-4/20 p-4 animate-fade-in">
        <p className="text-xs text-chart-4 font-semibold mb-2">⚡ Next Steps</p>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>Transfer R165 to the account above</li>
          <li>Use reference: <strong className="text-foreground">PF-PRO</strong></li>
          <li>Email proof of payment to <strong className="text-foreground">traderdrprecision@gmail.com</strong></li>
          <li>Your account will be upgraded within 24 hours</li>
        </ol>
      </div>

      {/* Namibian Payment Methods */}
      <PaymentMethodsSection amount="NAD 165 / $9 USD" />

      <div className="border-t border-border my-4" />
      <p className="text-xs text-muted-foreground text-center mb-2">Or pay via bank transfer:</p>

      <Button
        className="w-full bg-chart-4 hover:bg-chart-4/90 text-background font-bold h-11"
        onClick={() => window.open('mailto:traderdrprecision@gmail.com?subject=Precision Flow Pro Payment&body=Hi, I have made a payment for Precision Flow Pro. Please find proof of payment attached.', '_blank')}
      >
        <Mail className="h-4 w-4 mr-2" />
        Send Proof of Payment
      </Button>
    </div>
  );
}
