import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Shield, Crown, ArrowLeft, Search, UserCheck, UserX, Clock, Loader2, CreditCard, DollarSign, MessageSquare, TrendingUp } from 'lucide-react';
import PaymentConfirmationsAdmin from '@/components/admin/PaymentConfirmationsAdmin';
import SubscriptionPricingAdmin from '@/components/admin/SubscriptionPricingAdmin';
import SupportTicketsAdmin from '@/components/admin/SupportTicketsAdmin';
import MarketAnalysisSettingsAdmin from '@/components/admin/MarketAnalysisSettingsAdmin';

interface UserProfile {
  user_id: string;
  display_name: string | null;
  email: string;
  is_pro: boolean;
  pro_expires_at: string | null;
  subscription_status: string;
  created_at: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'users' | 'payments' | 'pricing' | 'tickets' | 'market'>('users');

  // Check if current user is admin
  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
      if (data) loadUsers();
      else setLoading(false);
    };
    checkAdmin();
  }, [user]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-pro', {
        body: { action: 'list' },
      });
      if (error) throw error;
      setUsers(data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'activate' | 'deactivate' | 'extend', months = 1) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-pro', {
        body: { action, user_id: userId, months },
      });
      if (error) throw error;
      toast.success(
        action === 'activate' ? 'Pro activated!' :
        action === 'deactivate' ? 'Pro deactivated' :
        'Pro extended!'
      );
      await loadUsers();
    } catch {
      toast.error(`Failed to ${action} Pro`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin && !loading) {
    return (
      <div className="px-4 pt-6 pb-24 space-y-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="glass-card p-6 text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-1">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  const filtered = users.filter(u =>
    (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 pt-6 pb-24 space-y-5 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        Admin — User Management
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{filtered.length} user(s)</p>
          {filtered.map(u => (
            <div key={u.user_id} className="glass-card p-4 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-foreground text-sm truncate">{u.display_name || 'Unnamed'}</p>
                    {u.is_pro && (
                      <span className="text-[10px] bg-chart-4/20 text-chart-4 px-1.5 py-0.5 rounded-full font-bold shrink-0">PRO</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  {u.is_pro && u.pro_expires_at && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires: {new Date(u.pro_expires_at).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Joined: {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {u.is_pro ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleAction(u.user_id, 'extend')}
                        disabled={actionLoading === u.user_id}
                      >
                        <Clock className="h-3 w-3" />
                        +1 Month
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleAction(u.user_id, 'deactivate')}
                        disabled={actionLoading === u.user_id}
                      >
                        <UserX className="h-3 w-3" />
                        Deactivate
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1 bg-chart-4 hover:bg-chart-4/90 text-background"
                      onClick={() => handleAction(u.user_id, 'activate')}
                      disabled={actionLoading === u.user_id}
                    >
                      {actionLoading === u.user_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserCheck className="h-3 w-3" />
                      )}
                      Activate Pro
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
