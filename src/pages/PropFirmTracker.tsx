import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle,
  Target, Shield, DollarSign, BarChart3, Edit2,
} from 'lucide-react';
import { toast } from 'sonner';

interface PropAccount {
  id: string;
  user_id: string;
  firm_name: string;
  account_label: string;
  account_size: number;
  profit_target_pct: number;
  daily_loss_limit_pct: number;
  total_drawdown_pct: number;
  current_balance: number;
  current_pnl: number;
  daily_pnl: number;
  phase: string;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

function CircularGauge({ value, max, label, color, size = 80 }: {
  value: number; max: number; label: string; color: string; size?: number;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const danger = pct >= 75;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={6} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={danger ? 'hsl(var(--loss))' : color}
          strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className={`text-sm font-bold ${danger ? 'text-loss' : 'text-foreground'}`}>{pct.toFixed(0)}%</span>
      </div>
      <p className="text-[9px] text-muted-foreground mt-1 text-center">{label}</p>
    </div>
  );
}

function PassProbability({ account }: { account: PropAccount }) {
  const profitProgress = account.current_pnl / (account.account_size * account.profit_target_pct / 100);
  const dailyUsed = Math.abs(account.daily_pnl < 0 ? account.daily_pnl : 0) / (account.account_size * account.daily_loss_limit_pct / 100);
  const ddUsed = Math.abs(account.current_pnl < 0 ? account.current_pnl : 0) / (account.account_size * account.total_drawdown_pct / 100);

  let score = 50;
  score += profitProgress * 30;
  score -= dailyUsed * 20;
  score -= ddUsed * 25;

  const prob = score >= 65 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  const color = prob === 'High' ? 'text-success bg-success/10' : prob === 'Medium' ? 'text-chart-4 bg-chart-4/10' : 'text-loss bg-loss/10';

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      {prob} Pass Probability
    </span>
  );
}

const FIRMS = ['FTMO', 'MyForexFunds', 'The Funded Trader', 'True Forex Funds', 'E8 Funding', 'Funding Pips', 'TopStep', 'Other'];

export default function PropFirmTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<PropAccount | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);

  // Form state
  const [firmName, setFirmName] = useState('FTMO');
  const [accountLabel, setAccountLabel] = useState('Phase 1');
  const [accountSize, setAccountSize] = useState('100000');
  const [profitTarget, setProfitTarget] = useState('8');
  const [dailyLossLimit, setDailyLossLimit] = useState('5');
  const [totalDrawdown, setTotalDrawdown] = useState('10');

  // Update P/L form
  const [updatePnl, setUpdatePnl] = useState('');
  const [updateDailyPnl, setUpdateDailyPnl] = useState('');

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['prop-accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prop_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PropAccount[];
    },
    enabled: !!user,
  });

  const addAccount = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('prop_accounts').insert({
        user_id: user!.id,
        firm_name: firmName,
        account_label: accountLabel,
        account_size: parseFloat(accountSize),
        profit_target_pct: parseFloat(profitTarget),
        daily_loss_limit_pct: parseFloat(dailyLossLimit),
        total_drawdown_pct: parseFloat(totalDrawdown),
        current_balance: parseFloat(accountSize),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prop-accounts'] });
      setAddOpen(false);
      toast.success('Prop account added!');
    },
    onError: () => toast.error('Failed to add account'),
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, pnl, dailyPnl }: { id: string; pnl: number; dailyPnl: number }) => {
      const acc = accounts.find(a => a.id === id);
      if (!acc) return;
      const newBalance = acc.account_size + pnl;
      const { error } = await supabase.from('prop_accounts').update({
        current_pnl: pnl,
        daily_pnl: dailyPnl,
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prop-accounts'] });
      setUpdateOpen(false);
      setEditAccount(null);
      toast.success('Account updated!');
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prop_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prop-accounts'] });
      toast.success('Account removed');
    },
  });

  // Combined stats
  const combined = useMemo(() => {
    const active = accounts.filter(a => a.status === 'active');
    const totalPnl = active.reduce((s, a) => s + a.current_pnl, 0);
    const totalSize = active.reduce((s, a) => s + a.account_size, 0);
    return { active: active.length, totalPnl: Math.round(totalPnl * 100) / 100, totalSize };
  }, [accounts]);

  if (isLoading) return <div className="px-4 pt-6"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="px-4 pt-6 pb-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Prop Accounts</h1>
          <p className="text-sm text-muted-foreground">Track your funded challenges</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} disabled={accounts.length >= 10}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* Combined Summary */}
      {accounts.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="stat-label mb-2">Combined Summary</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-primary">{combined.active}</p>
              <p className="text-[9px] text-muted-foreground">Active</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${combined.totalPnl >= 0 ? 'text-success' : 'text-loss'}`}>
                {combined.totalPnl >= 0 ? '+' : ''}${combined.totalPnl}
              </p>
              <p className="text-[9px] text-muted-foreground">Total P/L</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">${(combined.totalSize / 1000).toFixed(0)}k</p>
              <p className="text-[9px] text-muted-foreground">Total Capital</p>
            </div>
          </div>
        </div>
      )}

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">No Prop Accounts</p>
          <p className="text-xs text-muted-foreground mb-4">Add your prop firm challenges to track progress</p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Account
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map(acc => {
            const profitTargetAmt = acc.account_size * acc.profit_target_pct / 100;
            const dailyLimitAmt = acc.account_size * acc.daily_loss_limit_pct / 100;
            const totalDDAmt = acc.account_size * acc.total_drawdown_pct / 100;
            const profitProgress = Math.max(0, acc.current_pnl);
            const dailyUsed = Math.abs(Math.min(0, acc.daily_pnl));
            const ddUsed = Math.abs(Math.min(0, acc.current_pnl));

            // Danger alerts
            const dailyPct = dailyLimitAmt > 0 ? (dailyUsed / dailyLimitAmt) * 100 : 0;
            const showDailyWarning = dailyPct >= 50;

            return (
              <div key={acc.id} className={`glass-card p-4 space-y-3 ${acc.status !== 'active' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{acc.firm_name}</h3>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {acc.phase}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{acc.account_label} • ${acc.account_size.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditAccount(acc); setUpdatePnl(acc.current_pnl.toString()); setUpdateDailyPnl(acc.daily_pnl.toString()); setUpdateOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this account?')) deleteAccount.mutate(acc.id); }}
                      className="p-1.5 rounded-lg hover:bg-loss/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Gauges */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative flex justify-center">
                    <CircularGauge
                      value={profitProgress}
                      max={profitTargetAmt}
                      label="Profit Target"
                      color="hsl(var(--success))"
                    />
                  </div>
                  <div className="relative flex justify-center">
                    <CircularGauge
                      value={dailyUsed}
                      max={dailyLimitAmt}
                      label="Daily Loss"
                      color="hsl(var(--chart-4))"
                    />
                  </div>
                  <div className="relative flex justify-center">
                    <CircularGauge
                      value={ddUsed}
                      max={totalDDAmt}
                      label="Total DD"
                      color="hsl(var(--chart-5))"
                    />
                  </div>
                </div>

                {/* Balance & P/L */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <p className={`text-sm font-bold ${acc.current_pnl >= 0 ? 'text-success' : 'text-loss'}`}>
                      {acc.current_pnl >= 0 ? '+' : ''}${acc.current_pnl.toFixed(0)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Total P/L</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <p className={`text-sm font-bold ${acc.daily_pnl >= 0 ? 'text-success' : 'text-loss'}`}>
                      {acc.daily_pnl >= 0 ? '+' : ''}${acc.daily_pnl.toFixed(0)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Today P/L</p>
                  </div>
                </div>

                <PassProbability account={acc} />

                {/* Daily loss warning */}
                {showDailyWarning && (
                  <div className="flex items-start gap-2 bg-chart-4/10 border border-chart-4/20 rounded-lg p-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-chart-4 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-chart-4">
                      {dailyPct >= 90 ? '🚨 CRITICAL: ' : dailyPct >= 75 ? '⚠️ Warning: ' : ''}
                      Daily loss at {dailyPct.toFixed(0)}% of limit. {dailyPct >= 75 ? 'Stop trading for today!' : 'Trade with caution.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Prop Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Firm</label>
              <div className="flex flex-wrap gap-2">
                {FIRMS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFirmName(f)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      firmName === f ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Phase</label>
                <Input value={accountLabel} onChange={e => setAccountLabel(e.target.value)} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Account Size ($)</label>
                <Input type="number" value={accountSize} onChange={e => setAccountSize(e.target.value)} className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Profit Target %</label>
                <Input type="number" value={profitTarget} onChange={e => setProfitTarget(e.target.value)} className="bg-secondary/50" step="0.5" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Daily Loss %</label>
                <Input type="number" value={dailyLossLimit} onChange={e => setDailyLossLimit(e.target.value)} className="bg-secondary/50" step="0.5" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Max DD %</label>
                <Input type="number" value={totalDrawdown} onChange={e => setTotalDrawdown(e.target.value)} className="bg-secondary/50" step="0.5" />
              </div>
            </div>
            <Button className="w-full" onClick={() => addAccount.mutate()} disabled={addAccount.isPending}>
              {addAccount.isPending ? 'Adding...' : 'Add Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update P/L Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update P/L — {editAccount?.firm_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Total P/L ($)</label>
              <Input type="number" value={updatePnl} onChange={e => setUpdatePnl(e.target.value)} className="bg-secondary/50" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Today's P/L ($)</label>
              <Input type="number" value={updateDailyPnl} onChange={e => setUpdateDailyPnl(e.target.value)} className="bg-secondary/50" />
            </div>
            <Button
              className="w-full"
              onClick={() => editAccount && updateAccount.mutate({
                id: editAccount.id,
                pnl: parseFloat(updatePnl) || 0,
                dailyPnl: parseFloat(updateDailyPnl) || 0,
              })}
              disabled={updateAccount.isPending}
            >
              {updateAccount.isPending ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
