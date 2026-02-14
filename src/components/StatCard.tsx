import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export default function StatCard({ label, value, icon, trend, className = '' }: StatCardProps) {
  return (
    <div className={`glass-card p-4 animate-fade-in ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="stat-label">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className={`stat-value ${
        trend === 'up' ? 'text-success' : trend === 'down' ? 'text-loss' : 'text-foreground'
      }`}>
        {value}
      </p>
    </div>
  );
}
