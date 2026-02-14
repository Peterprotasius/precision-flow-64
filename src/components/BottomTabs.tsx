import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, List, Lightbulb, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/trades', icon: List, label: 'Trades' },
  { path: '/add-trade', icon: PlusCircle, label: 'Add' },
  { path: '/insights', icon: Lightbulb, label: 'Insights' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomTabs() {
  const location = useLocation();

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
              className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors"
            >
              {isAdd ? (
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${isActive ? 'bg-primary glow-primary' : 'bg-primary/80'}`}>
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
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
