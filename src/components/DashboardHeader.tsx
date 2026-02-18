import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Crown } from 'lucide-react';

export default function DashboardHeader() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { user, subscribed } = useAuth();

  const initials = (profile?.displayName || user?.email || 'T')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your trading overview</p>
      </div>
      <button
        onClick={() => navigate('/profile')}
        className="relative flex items-center gap-2"
      >
        {subscribed && (
          <div className="flex items-center gap-1 bg-chart-4/20 text-chart-4 text-[10px] font-bold px-2 py-0.5 rounded-full border border-chart-4/30">
            <Crown className="h-3 w-3" />
            PRO
          </div>
        )}
        <div className="relative">
          <Avatar className="h-9 w-9 ring-2 ring-primary/30">
            {profile?.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt="Avatar" />
            ) : null}
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-background" />
        </div>
      </button>
    </div>
  );
}
