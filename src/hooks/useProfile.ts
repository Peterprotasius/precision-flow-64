import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  subscriptionStatus: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;

      // Generate signed URL for avatar if stored as a path
      let avatarUrl = data.avatar_url;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        const { data: signedData } = await supabase.storage
          .from('avatars')
          .createSignedUrl(avatarUrl, 60 * 60); // 1 hour
        avatarUrl = signedData?.signedUrl ?? null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        displayName: data.display_name,
        avatarUrl,
        subscriptionStatus: data.subscription_status,
      } as Profile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ displayName, avatarUrl }: { displayName?: string; avatarUrl?: string }) => {
      const updates: Record<string, string> = {};
      if (displayName !== undefined) updates.display_name = displayName;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated!');
    },
    onError: () => {
      toast.error('Failed to update profile.');
    },
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop();
      const path = `${user!.id}/avatar.${ext}`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (error) throw error;

      // Return signed URL (bucket is now private)
      const { data: signedData, error: signError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
      if (signError) throw signError;
      return signedData.signedUrl;
    },
  });
}
