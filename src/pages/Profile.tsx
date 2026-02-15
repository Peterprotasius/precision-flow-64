import { useTrades } from '@/hooks/useTrades';
import { useAuth } from '@/hooks/useAuth';
import { User, Crown, LogOut, Shield, Bell, HelpCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export default function Profile() {
  const { data: trades = [] } = useTrades();
  const { user, signOut, subscribed, subscriptionEnd, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      checkSubscription();
      toast.success('Subscription activated! Welcome to Pro.');
    }
  }, [searchParams, checkSubscription]);

  const tradesThisMonth = trades.filter(t => {
    const d = new Date(t.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch {
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch {
      toast.error('Failed to open subscription management.');
    }
  };

  return (
    <div className="px-4 pt-6 space-y-5">
      <h1 className="text-xl font-bold text-foreground">Profile</h1>

      <div className="glass-card p-5 flex items-center gap-4 animate-fade-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground text-lg">Trader</h2>
            {subscribed && <span className="text-xs bg-chart-4/20 text-chart-4 px-2 py-0.5 rounded-full font-medium">PRO</span>}
          </div>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {subscribed ? (
        <div className="glass-card p-4 animate-fade-in border border-chart-4/30">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-chart-4" />
            <h3 className="font-semibold text-foreground">Pro Plan Active</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Unlimited trades & full access</p>
          {subscriptionEnd && (
            <p className="text-xs text-muted-foreground mb-3">
              Renews {new Date(subscriptionEnd).toLocaleDateString()}
            </p>
          )}
          <Button variant="outline" className="w-full" onClick={handleManageSubscription}>
            Manage Subscription
          </Button>
        </div>
      ) : (
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-5 w-5 text-chart-4" />
            <h3 className="font-semibold text-foreground">Upgrade to Pro</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{tradesThisMonth}/20 trades used this month</p>
          <div className="w-full bg-secondary rounded-full h-2 mb-3">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min((tradesThisMonth / 20) * 100, 100)}%` }} />
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 mb-4">
            <li>• Unlimited trades</li>
            <li>• Advanced analytics & insights</li>
            <li>• Unlimited screenshot storage</li>
            <li>• Full insights dashboard</li>
          </ul>
          <Button className="w-full bg-primary text-primary-foreground" onClick={handleUpgrade} disabled={checkoutLoading}>
            {checkoutLoading ? 'Loading...' : 'Upgrade — $9/month'}
          </Button>
        </div>
      )}

      <div className="glass-card divide-y divide-border animate-fade-in">
        {[
          { icon: Bell, label: 'Notifications', action: () => toast.info('Coming soon') },
          { icon: Shield, label: 'Privacy & Security', action: () => toast.info('Coming soon') },
          { icon: HelpCircle, label: 'Help & Support', action: () => toast.info('Coming soon') },
          { icon: LogOut, label: 'Log Out', action: handleSignOut },
        ].map(({ icon: Icon, label, action }) => (
          <button key={label} className="flex items-center gap-3 w-full px-4 py-3.5 text-left" onClick={action}>
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
