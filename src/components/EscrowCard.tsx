import { Shield, Lock, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

interface EscrowCardProps {
  transactions: Transaction[];
  canWithdraw: boolean;
}

export function EscrowCard({ transactions, canWithdraw }: EscrowCardProps) {
  const lockedAmount = transactions
    .filter((t) => t.status === 'locked')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = transactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const releasedAmount = transactions
    .filter((t) => t.status === 'released')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAmount = lockedAmount + pendingAmount + releasedAmount;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header with gradient */}
      <div className="p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Secured Funds</h2>
            <p className="text-sm text-muted-foreground">Protected by smart escrow</p>
          </div>
        </div>

        <div className="text-4xl font-bold font-mono text-foreground animate-count">
          ${totalAmount.toLocaleString()}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Total Campaign Earnings</p>
      </div>

      {/* Breakdown */}
      <div className="p-6 space-y-4">
        {/* Locked */}
        <div className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-warning" />
            <div>
              <p className="font-medium text-foreground">In Escrow</p>
              <p className="text-xs text-muted-foreground">Pending campaign completion</p>
            </div>
          </div>
          <p className="font-mono font-bold text-warning">${lockedAmount.toLocaleString()}</p>
        </div>

        {/* Pending */}
        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Pending Release</p>
              <p className="text-xs text-muted-foreground">Processing for payout</p>
            </div>
          </div>
          <p className="font-mono font-bold text-primary">${pendingAmount.toLocaleString()}</p>
        </div>

        {/* Released */}
        <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium text-foreground">Available</p>
              <p className="text-xs text-muted-foreground">Ready to withdraw</p>
            </div>
          </div>
          <p className="font-mono font-bold text-success">${releasedAmount.toLocaleString()}</p>
        </div>

        {/* Withdraw Button */}
        <Button 
          variant={canWithdraw && releasedAmount > 0 ? "glow" : "secondary"}
          className="w-full mt-4"
          size="lg"
          disabled={!canWithdraw || releasedAmount === 0}
        >
          {canWithdraw && releasedAmount > 0 
            ? `Withdraw $${releasedAmount.toLocaleString()}`
            : 'Withdraw (Campaign Active)'
          }
        </Button>

        {!canWithdraw && (
          <p className="text-xs text-center text-muted-foreground">
            Withdrawals available after campaign completion
          </p>
        )}
      </div>
    </div>
  );
}
