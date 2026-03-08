import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, TrendingUp } from 'lucide-react';

interface Config {
  enabled: boolean;
  pro_only: boolean;
  disclaimer: string;
}

export default function MarketAnalysisSettingsAdmin() {
  const [config, setConfig] = useState<Config>({ enabled: true, pro_only: true, disclaimer: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'market_analysis_config')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setConfig(data.value as unknown as Config);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('admin_settings')
      .update({ value: config as any, updated_at: new Date().toISOString() })
      .eq('key', 'market_analysis_config');
    if (error) toast.error('Failed to save');
    else toast.success('Settings updated!');
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4" /> Market Analysis Settings
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground">Enable Market Analysis</label>
          <Switch checked={config.enabled} onCheckedChange={v => setConfig(c => ({ ...c, enabled: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground">Pro Only</label>
          <Switch checked={config.pro_only} onCheckedChange={v => setConfig(c => ({ ...c, pro_only: v }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Custom Disclaimer</label>
          <Input value={config.disclaimer} onChange={e => setConfig(c => ({ ...c, disclaimer: e.target.value }))} placeholder="Disclaimer text shown below analysis" />
        </div>
      </div>
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Settings'}
      </Button>
    </div>
  );
}
