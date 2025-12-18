import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, Gift, Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'escrow' | 'bonus' | 'payout';
  status: 'locked' | 'pending' | 'released';
  created_at: string;
  creators?: {
    name: string;
    handle: string;
  };
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'escrow':
        return <ArrowDownLeft className="w-4 h-4 text-primary" />;
      case 'bonus':
        return <Gift className="w-4 h-4 text-success" />;
      case 'payout':
        return <ArrowUpRight className="w-4 h-4 text-accent" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'locked':
        return 'secondary';
      case 'pending':
        return 'optimizing';
      case 'released':
        return 'active';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
              {getTypeIcon(transaction.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm capitalize">
                  {transaction.type}
                </span>
                <Badge variant={getStatusVariant(transaction.status) as any} className="text-[10px]">
                  {transaction.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {transaction.creators?.name || 'Unknown'} • {formatDate(transaction.created_at)}
              </p>
            </div>
          </div>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(transaction.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
