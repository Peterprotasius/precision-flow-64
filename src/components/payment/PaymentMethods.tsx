import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  icon: string;
  name: string;
  instructions: string;
  accentColor: string;
  number: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'fnb_ewallet',
    icon: '🏦',
    name: 'FNB eWallet',
    accentColor: '#006400',
    number: '0814716308',
    instructions: 'Send your subscription payment via FNB eWallet to:',
  },
  {
    id: 'bw_easywallet',
    icon: '🏛️',
    name: 'Bank Windhoek EasyWallet',
    accentColor: '#003087',
    number: '0814716308',
    instructions: 'Send your subscription payment via Bank Windhoek EasyWallet to:',
  },
  {
    id: 'sb_blue_voucher',
    icon: '💙',
    name: 'Standard Bank Blue Voucher',
    accentColor: '#0033A0',
    number: '0814716308',
    instructions: 'Purchase a Standard Bank Blue Voucher for the subscription amount and send the voucher PIN to:',
  },
];

interface PaymentMethodsProps {
  amount: string;
}

export default function PaymentMethodsSection({ amount }: PaymentMethodsProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [amountPaid, setAmountPaid] = useState('');
  const [reference, setReference] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === selected);

  const handleSubmit = async () => {
    if (!user || !selectedMethod || !reference.trim()) {
      toast.error('Please fill in the reference number.');
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl: string | null = null;

      if (screenshotFile) {
        const ext = screenshotFile.name.split('.').pop();
        const path = `${user.id}/payment-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('screenshots')
          .upload(path, screenshotFile);
        if (uploadErr) throw uploadErr;
        screenshotUrl = path;
      }

      const { error } = await supabase.from('payment_confirmations').insert({
        user_id: user.id,
        payment_method: selectedMethod.name,
        amount: parseFloat(amountPaid) || 0,
        reference: reference.trim(),
        screenshot_url: screenshotUrl,
      });

      if (error) throw error;
      setStep('success');
      toast.success('Payment confirmation submitted!');
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="glass-card p-6 text-center animate-fade-in">
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-2">Payment Confirmation Submitted!</h3>
        <p className="text-sm text-muted-foreground">
          Your Pro access will be activated within 24 hours once verified. Thank you for supporting us! 🙏
        </p>
        <Button className="mt-4" variant="outline" onClick={() => { setStep('select'); setSelected(null); setReference(''); setAmountPaid(''); setScreenshotFile(null); }}>
          Done
        </Button>
      </div>
    );
  }

  if (step === 'confirm' && selectedMethod) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="glass-card p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{selectedMethod.icon}</span>
            <h3 className="font-semibold text-foreground">{selectedMethod.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{selectedMethod.instructions}</p>
          <p className="text-lg font-bold text-primary">📱 {selectedMethod.number}</p>
          <p className="text-xs text-muted-foreground mt-2">Amount due: <strong className="text-foreground">{amount}</strong></p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Payment Method</label>
            <Input value={selectedMethod.name} disabled />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Amount Paid</label>
            <Input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="e.g. 165" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Reference Number / Voucher PIN *</label>
            <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Enter your reference or PIN" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Proof of Payment (optional)</label>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-border text-muted-foreground text-sm hover:border-primary/50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              {screenshotFile ? screenshotFile.name : 'Upload screenshot'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setScreenshotFile(e.target.files?.[0] || null)} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>Back</Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground"
            onClick={handleSubmit}
            disabled={submitting || !reference.trim()}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Payment Confirmation'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">📱 Mobile Payment Methods</h3>
      <p className="text-xs text-muted-foreground">Select your preferred payment method below</p>

      {PAYMENT_METHODS.map(method => (
        <button
          key={method.id}
          onClick={() => { setSelected(method.id); setStep('confirm'); }}
          className="w-full glass-card p-4 text-left border transition-colors hover:border-primary/50 animate-fade-in"
          style={{ borderColor: selected === method.id ? method.accentColor : undefined }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{method.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">{method.name}</p>
              <p className="text-xs text-muted-foreground">{method.instructions}</p>
              <p className="text-xs font-semibold text-primary mt-1">📱 {method.number}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
