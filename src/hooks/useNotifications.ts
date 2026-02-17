import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  importance: string;
  source_url: string | null;
  created_at: string;
  read: boolean;
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch notifications and user's read status
      const { data: notifs, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      const { data: reads } = await supabase
        .from('notification_reads')
        .select('notification_id');

      const readIds = new Set((reads ?? []).map((r: any) => r.notification_id));

      return (notifs ?? []).map((n: any) => ({
        ...n,
        read: readIds.has(n.id),
      })) as Notification[];
    },
    refetchInterval: 5 * 60 * 1000, // every 5 min
  });
}

export function useUnreadCount() {
  const { data: notifications } = useNotifications();
  return notifications?.filter(n => !n.read).length ?? 0;
}

export function useMarkAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notification_reads')
        .upsert({ user_id: user.id, notification_id: notificationId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useFetchNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-trading-news');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
