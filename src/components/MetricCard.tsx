import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function MetricCard({ title, value, change, changeLabel, icon, variant = 'default' }: MetricCardProps) {
  const getTrendIcon = () => {
    if (!change) return <Minus className="w-3 h-3" />;
    return change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!change) return 'text-muted-foreground';
    return change > 0 ? 'text-success' : 'text-destructive';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'border-primary/30 hover:border-primary/50';
      case 'success':
        return 'border-success/30 hover:border-success/50';
      case 'warning':
        return 'border-warning/30 hover:border-warning/50';
      default:
        return 'border-border hover:border-primary/50';
    }
  };

  return (
    <div className={`metric-card group ${getVariantStyles()}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon && (
          <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
            {icon}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-3xl font-bold font-mono text-foreground animate-count">{value}</p>
        
        {(change !== undefined || changeLabel) && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="font-medium">
              {change !== undefined && `${change > 0 ? '+' : ''}${change}%`}
            </span>
            {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
