import { useTrades } from '@/hooks/useTrades';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile';
import { User, Crown, LogOut, Shield, Bell, HelpCircle, CheckCircle, Camera, Mail, BellRing, BarChart3, Brain, Wifi, Target, Sun, Moon, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useRef } from 'react';
import { registerPushNotifications } from '@/lib/push-notifications';
import { useTheme } from '@/hooks/useTheme';

export default function Profile() {
  const { data: trades = [] } = useTrades();
  const { user, signOut, subscribed, subscriptionEnd, isAdmin, checkSubscription } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      checkSubscription();
      toast.success('Subscription activated! Welcome to Pro.');
    }
  }, [searchParams, checkSubscription]);

  useEffect(() => {
    if (profile?.displayName) setEditName(profile.displayName);
  }, [profile?.displayName]);

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
      if (data?.url) window.open(data.url, '_blank');
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
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast.error('Failed to open subscription management.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB.');
      return;
    }
    try {
      const url = await uploadAvatar.mutateAsync(file);
      await updateProfile.mutateAsync({ avatarUrl: url });
    } catch {
      toast.error('Failed to upload avatar.');
    }
  };

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty.');
      return;
    }
    await updateProfile.mutateAsync({ displayName: trimmed });
    setEditOpen(false);
  };

  const initials = (profile?.displayName || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="px-4 pt-6 space-y-5 pb-24">
      <h1 className="text-xl font-bold text-foreground">Profile</h1>

      {/* Profile card with avatar */}
      <div className="glass-card p-5 flex items-center gap-4 animate-fade-in">
        <div className="relative">
          <Avatar className="h-14 w-14">
            {profile?.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt="Avatar" />
            ) : null}
            <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md"
          >
            <Camera className="h-3 w-3 text-primary-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground text-lg truncate">
              {profile?.displayName || 'Trader'}
            </h2>
            {subscribed && (
              <span className="text-xs bg-chart-4/20 text-chart-4 px-2 py-0.5 rounded-full font-medium shrink-0">
                PRO
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          <button
            onClick={() => setEditOpen(true)}
            className="text-xs text-primary mt-1"
          >
            Edit Name
          </button>
        </div>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Trading Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Your trading name"
              maxLength={50}
            />
            <Button
              className="w-full"
              onClick={handleSaveName}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription section */}
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
          <Button className="w-full bg-primary text-primary-foreground" onClick={() => navigate('/upgrade')}>
            Upgrade — $9/month
          </Button>
        </div>
      )}

      {/* Appearance section */}
      <div className="glass-card p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Appearance</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${
              theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            <Moon className="h-4 w-4" />
            <span className="text-sm">Dark</span>
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${
              theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            <Sun className="h-4 w-4" />
            <span className="text-sm">Light</span>
          </button>
        </div>
      </div>

      {/* Menu items */}
      <div className="glass-card divide-y divide-border animate-fade-in">
        {isAdmin && (
          <button className="flex items-center gap-3 w-full px-4 py-3.5 text-left" onClick={() => navigate('/admin/users')}>
            <Shield className="h-5 w-5 text-chart-4" />
            <span className="text-sm text-foreground flex-1 font-semibold">Admin Panel</span>
            <span className="text-[10px] bg-chart-4/20 text-chart-4 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>
          </button>
        )}
        <button className="flex items-center gap-3 w-full px-4 py-3.5 text-left" onClick={() => navigate('/broker-sync')}>
          <Wifi className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground flex-1">Connect Broker</span>
        </button>
        <button className="flex items-center gap-3 w-full px-4 py-3.5 text-left" onClick={() => navigate('/prop-tracker')}>
          <Target className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground flex-1">Prop Accounts</span>
        </button>
        <button className="flex items-center gap-3 w-full px-4 py-3.5 text-left" onClick={() => navigate('/analytics')}>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground flex-1">Analytics</span>
        </button>
        <button className="flex items-center gap-3 w-full px-4 py-3.5 text-left" onClick={() => navigate('/psychology')}>
          <Brain className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground flex-1">Psychology</span>
        </button>
        <button className="flex items-center gap-3 w-full px-4 py-3.5 text-left" onClick={() => navigate('/notifications')}>
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground flex-1">Notifications & News</span>
        </button>
        <button
          className="flex items-center gap-3 w-full px-4 py-3.5 text-left"
          onClick={async () => {
            if (!user) return;
            const success = await registerPushNotifications(user.id);
            if (success) toast.success('Push notifications enabled!');
            else toast.info('Push notifications not available or denied.');
          }}
        >
          <BellRing className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground">Enable Push Notifications</span>
        </button>
        <button className="flex items-center gap-3 w-full px-4 py-3.5 text-left" onClick={() => setPrivacyOpen(true)}>
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground">Privacy & Security</span>
        </button>
        <button
          className="flex items-center gap-3 w-full px-4 py-3.5 text-left"
          onClick={() => window.open('mailto:traderdrprecision@gmail.com?subject=PrecisionFlow Support', '_blank')}
        >
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground">Help & Support</span>
        </button>
        <button className="flex items-center gap-3 w-full px-4 py-3.5 text-left" onClick={handleSignOut}>
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground">Log Out</span>
        </button>
      </div>

      {/* Privacy & Security Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy & Security
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Data Protection</h4>
              <p>Your trading data is encrypted and stored securely. Only you can access your trades, journals, and analytics.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Authentication</h4>
              <p>Your account is protected with industry-standard authentication. We never store your password in plain text.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Data Usage</h4>
              <p>We do not sell or share your personal data with third parties. Your trading data is used solely to power your analytics.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Contact Us</h4>
              <p>For privacy-related inquiries, reach out to us at:</p>
              <a
                href="mailto:traderdrprecision@gmail.com"
                className="text-primary inline-flex items-center gap-1 mt-1"
              >
                <Mail className="h-4 w-4" />
                traderdrprecision@gmail.com
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
