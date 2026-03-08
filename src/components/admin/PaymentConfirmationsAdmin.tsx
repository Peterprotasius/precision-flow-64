import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Loader2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PaymentConfirmation {
  id: string;
  user_id: string;
  payment_method: string;
  amount: number;
  reference: string;
  screenshot_url: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  notes: string | null;
  display_name?: string;
  email?: string;
}

export default function PaymentConfirmationsAdmin() {
  const [confirmations, setConfirmations] = useState<PaymentConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadConfirmations();
  }, [filter]);

  const loadConfirmations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_confirmations')
      .select('*')
      .eq('status', filter)
      .order('submitted_at', { ascending: false });

    if (error) {
      toast.error('Failed to load payment confirmations');
      setLoading(false);
      return;
    }

    setConfirmations(data || []);
    setLoading(false);
  };

  const handleApprove = async (conf: PaymentConfirmation) => {
    setActionLoading(conf.id);
    try {
      // Update payment confirmation status
      const { error: updateErr } = await supabase
        .from('payment_confirmations')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', conf.id);
      if (updateErr) throw updateErr;

      // Activate Pro via admin edge function
      const { error: proErr } = await supabase.functions.invoke('admin-manage-pro', {
        body: { action: 'activate', user_id: conf.user_id, months: 1 },
      });
      if (proErr) throw proErr;

      toast.success('Payment approved & Pro activated!');
      loadConfirmations();
    } catch {
      toast.error('Failed to approve payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setActionLoading(rejectId);
    try {
      const { error } = await supabase
        .from('payment_confirmations')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), notes: rejectReason || null })
        .eq('id', rejectId);
      if (error) throw error;

      // Send notification
      await supabase.from('notifications').insert({
        title: 'Payment Rejected',
        body: rejectReason || 'Your payment confirmation was rejected. Please contact support.',
        category: 'payment',
        importance: 'high',
      });

      toast.success('Payment rejected');
      setRejectId(null);
      setRejectReason('');
      loadConfirmations();
    } catch {
      toast.error('Failed to reject payment');
    } finally {
      setActionLoading(null);
    }
  };

  const viewScreenshot = async (path: string) => {
    const { data } = await supabase.storage.from('screenshots').createSignedUrl(path, 300);
    if (data?.signedUrl) {
      setScreenshotUrl(data.signedUrl);
      setScreenshotOpen(true);
    }
  };

  const pendingCount = confirmations.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-foreground">Payment Confirmations</h3>
        {filter === 'pending' && pendingCount > 0 && (
          <span className="text-[10px] bg-chart-4/20 text-chart-4 px-1.5 py-0.5 rounded-full font-bold">{pendingCount}</span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : confirmations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No {filter} payments</p>
      ) : (
        <div className="space-y-3">
          {confirmations.map(c => (
            <div key={c.id} className="glass-card p-4 animate-fade-in">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{c.payment_method}</p>
                  <p className="text-xs text-muted-foreground">Amount: <strong className="text-foreground">NAD {c.amount}</strong></p>
                  <p className="text-xs text-muted-foreground">Ref: <strong className="text-foreground">{c.reference}</strong></p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(c.submitted_at).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">User: {c.user_id.slice(0, 8)}...</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {c.screenshot_url && (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => viewScreenshot(c.screenshot_url!)}>
                      <Eye className="h-3 w-3" /> Proof
                    </Button>
                  )}
                  {filter === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1 bg-success hover:bg-success/90 text-success-foreground"
                        onClick={() => handleApprove(c)}
                        disabled={actionLoading === c.id}
                      >
                        {actionLoading === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs gap-1"
                        onClick={() => setRejectId(c.id)}
                        disabled={actionLoading === c.id}
                      >
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </>
                  )}
                  {c.notes && (
                    <p className="text-[10px] text-muted-foreground">{c.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot viewer */}
      <Dialog open={screenshotOpen} onOpenChange={setScreenshotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Proof of Payment</DialogTitle></DialogHeader>
          {screenshotUrl && <img src={screenshotUrl} alt="Proof" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Reject reason dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reject Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection (optional)" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectId(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleReject}>Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
