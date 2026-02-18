import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, List, BarChart3, Bell, Brain, Bot } from 'lucide-react';
import { useUnreadCount } from '@/hooks/useNotifications';

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/trades', icon: List, label: 'Trades' },
  { path: '/add-trade', icon: PlusCircle, label: 'Add' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/coach', icon: Bot, label: 'Coach' },
];

export default function BottomTabs() {
  const location = useLocation();
  const unreadCount = useUnreadCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          const isAdd = path === '/add-trade';
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors relative"
            >
              {isAdd ? (
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${isActive ? 'bg-primary glow-primary' : 'bg-primary/80'}`}>
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
