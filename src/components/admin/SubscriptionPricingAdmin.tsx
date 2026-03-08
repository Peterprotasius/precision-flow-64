import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Pricing {
  monthly_nad: number;
  monthly_usd: number;
  annual_nad: number;
  annual_usd: number;
  annual_discount_pct: number;
}

export default function SubscriptionPricingAdmin() {
  const [pricing, setPricing] = useState<Pricing>({ monthly_nad: 165, monthly_usd: 9, annual_nad: 1650, annual_usd: 90, annual_discount_pct: 17 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'subscription_pricing')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setPricing(data.value as unknown as Pricing);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('admin_settings')
      .update({ value: pricing as any, updated_at: new Date().toISOString() })
      .eq('key', 'subscription_pricing');
    if (error) toast.error('Failed to save');
    else toast.success('Pricing updated!');
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Subscription Pricing</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Monthly (NAD)</label>
          <Input type="number" value={pricing.monthly_nad} onChange={e => setPricing(p => ({ ...p, monthly_nad: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Monthly (USD)</label>
          <Input type="number" value={pricing.monthly_usd} onChange={e => setPricing(p => ({ ...p, monthly_usd: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Annual (NAD)</label>
          <Input type="number" value={pricing.annual_nad} onChange={e => setPricing(p => ({ ...p, annual_nad: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Annual (USD)</label>
          <Input type="number" value={pricing.annual_usd} onChange={e => setPricing(p => ({ ...p, annual_usd: Number(e.target.value) }))} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground">Annual Discount %</label>
          <Input type="number" value={pricing.annual_discount_pct} onChange={e => setPricing(p => ({ ...p, annual_discount_pct: Number(e.target.value) }))} />
        </div>
      </div>
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Pricing'}
      </Button>
    </div>
  );
}
