import { useNotifications, useMarkAsRead, useFetchNews } from '@/hooks/useNotifications';
import { Bell, RefreshCw, AlertTriangle, Lightbulb, Newspaper, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const categoryIcon = (cat: string) => {
  switch (cat) {
    case 'alert': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'tip': return <Lightbulb className="h-4 w-4 text-chart-4" />;
    default: return <Newspaper className="h-4 w-4 text-primary" />;
  }
};

const importanceBadge = (imp: string) => {
  const colors: Record<string, string> = {
    high: 'bg-destructive/15 text-destructive',
    medium: 'bg-chart-4/15 text-chart-4',
    low: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors[imp] ?? colors.low}`}>
      {imp}
    </span>
  );
};

export default function Notifications() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const fetchNews = useFetchNews();

  const handleRefresh = async () => {
    try {
      await fetchNews.mutateAsync();
      toast.success('Latest trading news fetched!');
    } catch {
      toast.error('Failed to fetch news. Try again later.');
    }
  };

  return (
    <div className="px-4 pt-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5" /> Notifications
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={fetchNews.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${fetchNews.isPending ? 'animate-spin' : ''}`} />
          {fetchNews.isPending ? 'Fetching...' : 'Refresh'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-8 text-center animate-fade-in">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No notifications yet.</p>
          <p className="text-muted-foreground text-xs mt-1">Tap Refresh to get the latest trading news & tips.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`glass-card p-4 animate-fade-in transition-opacity ${n.read ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{categoryIcon(n.category)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{n.title}</h3>
                    {importanceBadge(n.importance)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                    {!n.read && (
                      <button
                        onClick={() => markAsRead.mutate(n.id)}
                        className="text-[10px] text-primary flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
