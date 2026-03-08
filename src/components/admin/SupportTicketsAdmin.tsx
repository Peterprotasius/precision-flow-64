import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, MessageSquare } from 'lucide-react';

interface Ticket {
  id: string;
  user_id: string;
  issue_description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  admin_notes: string | null;
}

export default function SupportTicketsAdmin() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'in_progress' | 'resolved'>('open');
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();
    if (editNotes[id]) updates.admin_notes = editNotes[id];

    const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
    if (error) toast.error('Failed to update');
    else { toast.success('Updated'); load(); }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="h-4 w-4" /> Support Tickets
      </h3>

      <div className="flex gap-2">
        {(['open', 'in_progress', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No {filter.replace('_', ' ')} tickets</p>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="glass-card p-4 animate-fade-in">
              <p className="text-sm text-foreground mb-1">{t.issue_description}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleString()} · User: {t.user_id.slice(0, 8)}...</p>
              {t.admin_notes && <p className="text-xs text-muted-foreground mt-1 italic">Note: {t.admin_notes}</p>}
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="Admin notes..."
                  value={editNotes[t.id] || ''}
                  onChange={e => setEditNotes(prev => ({ ...prev, [t.id]: e.target.value }))}
                  className="text-xs"
                />
                <div className="flex gap-2">
                  {filter !== 'in_progress' && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(t.id, 'in_progress')}>In Progress</Button>
                  )}
                  {filter !== 'resolved' && (
                    <Button size="sm" className="text-xs h-7 bg-success hover:bg-success/90 text-success-foreground" onClick={() => updateStatus(t.id, 'resolved')}>Resolve</Button>
                  )}
                  {filter !== 'open' && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(t.id, 'open')}>Reopen</Button>
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
