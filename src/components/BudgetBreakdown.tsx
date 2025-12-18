import { DollarSign, TrendingDown, Lock, CheckCircle } from 'lucide-react';

interface BudgetBreakdownProps {
  totalBudget: number;
  remainingBudget: number;
  lockedAmount: number;
  releasedAmount: number;
}

export function BudgetBreakdown({
  totalBudget,
  remainingBudget,
  lockedAmount,
  releasedAmount,
}: BudgetBreakdownProps) {
  const spentAmount = totalBudget - remainingBudget;
  const spentPercentage = totalBudget > 0 ? Math.round((spentAmount / totalBudget) * 100) : 0;
  const lockedPercentage = totalBudget > 0 ? Math.round((lockedAmount / totalBudget) * 100) : 0;
  const releasedPercentage = totalBudget > 0 ? Math.round((releasedAmount / totalBudget) * 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-foreground mb-4">Budget Overview</h3>

      {/* Main Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Total Budget</span>
          <span className="font-mono font-bold text-foreground">{formatCurrency(totalBudget)}</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden flex">
          {releasedPercentage > 0 && (
            <div
              className="h-full bg-success transition-all"
              style={{ width: `${releasedPercentage}%` }}
              title={`Released: ${formatCurrency(releasedAmount)}`}
            />
          )}
          {lockedPercentage > 0 && (
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${lockedPercentage}%` }}
              title={`Locked: ${formatCurrency(lockedAmount)}`}
            />
          )}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{spentPercentage}% allocated</span>
          <span>{formatCurrency(remainingBudget)} available</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
          <p className="font-mono font-bold text-foreground">{formatCurrency(remainingBudget)}</p>
        </div>
        
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Spent</span>
          </div>
          <p className="font-mono font-bold text-foreground">{formatCurrency(spentAmount)}</p>
        </div>

        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary">Locked in Escrow</span>
          </div>
          <p className="font-mono font-bold text-primary">{formatCurrency(lockedAmount)}</p>
        </div>

        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs text-success">Released</span>
          </div>
          <p className="font-mono font-bold text-success">{formatCurrency(releasedAmount)}</p>
        </div>
      </div>
    </div>
  );
}
