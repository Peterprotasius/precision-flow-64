import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Copy, CheckCircle, Sparkles, Zap, BarChart3, Brain, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface ProUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  { icon: <Zap className="h-4 w-4" />, label: 'Unlimited trades' },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Full institutional analytics' },
  { icon: <Brain className="h-4 w-4" />, label: 'AI Trade Coach (GPT-powered)' },
  { icon: <Shield className="h-4 w-4" />, label: 'Edge Score & Discipline Score' },
  { icon: <Sparkles className="h-4 w-4" />, label: 'Psychology module & pattern detection' },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Risk simulator & screenshot storage' },
];

export default function ProUpgradeModal({ open, onOpenChange }: ProUpgradeModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [step, setStep] = useState<'features' | 'payment'>('features');

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/20">
              <Crown className="h-4 w-4 text-chart-4" />
            </div>
            <span>Precision Flow Pro</span>
          </DialogTitle>
        </DialogHeader>

        {step === 'features' ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-chart-4/20 via-primary/10 to-chart-5/10 p-4 border border-chart-4/20">
              <div className="text-center mb-3">
                <p className="text-3xl font-bold text-chart-4">R165<span className="text-base text-muted-foreground font-normal">/month</span></p>
                <p className="text-xs text-muted-foreground">≈ $9 USD · Cancel anytime</p>
              </div>
              <div className="space-y-2">
                {FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="text-chart-4">{f.icon}</div>
                    <span className="text-sm text-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-3 border border-primary/20">
              <p className="text-xs text-muted-foreground text-center">
                🏦 Payment via EFT bank transfer (South Africa). After payment, send proof to{' '}
                <a href="mailto:traderdrprecision@gmail.com" className="text-primary">
                  traderdrprecision@gmail.com
                </a>{' '}
                and your account will be upgraded within 24 hours.
              </p>
            </div>

            <Button
              className="w-full bg-chart-4 hover:bg-chart-4/90 text-background font-bold h-11"
              onClick={() => setStep('payment')}
            >
              <Crown className="h-4 w-4 mr-2" />
              View Payment Details
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setStep('features')} className="text-muted-foreground text-xs hover:text-foreground">← Back</button>
              <h3 className="text-sm font-semibold text-foreground">Bank Transfer Details</h3>
            </div>

            <div className="glass-card p-4 space-y-3 border border-border">
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
                      ? <CheckCircle className="h-3.5 w-3.5 text-success" />
                      : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-chart-4/10 border border-chart-4/20 p-3">
              <p className="text-xs text-chart-4 font-semibold mb-1">⚡ Next Steps</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Transfer R165 to the account above</li>
                <li>Use reference: <strong className="text-foreground">PF-PRO</strong></li>
                <li>Email proof of payment to traderdrprecision@gmail.com</li>
                <li>Your account will be upgraded within 24 hours</li>
              </ol>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('mailto:traderdrprecision@gmail.com?subject=Precision Flow Pro Payment&body=Hi, I have made a payment for Precision Flow Pro. Please find proof of payment attached.', '_blank')}
            >
              📧 Send Proof of Payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
