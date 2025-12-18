import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  CreditCard, 
  Building2, 
  User, 
  ExternalLink,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Shield,
  Plus
} from 'lucide-react';

interface StripeConnectAccount {
  id: string;
  creatorName: string;
  creatorHandle: string;
  stripeAccountId: string;
  status: 'active' | 'pending' | 'restricted';
  escrowBalance: number;
  pendingPayout: number;
  totalPaid: number;
  lastPayoutDate: string | null;
}

// Mock Stripe Connect accounts
const mockConnectAccounts: StripeConnectAccount[] = [
  {
    id: '1',
    creatorName: 'Sophia Chen',
    creatorHandle: 'sophiaminimal',
    stripeAccountId: 'acct_1abc123xyz',
    status: 'active',
    escrowBalance: 12500,
    pendingPayout: 3200,
    totalPaid: 45600,
    lastPayoutDate: '2024-01-15'
  },
  {
    id: '2',
    creatorName: 'Marcus Rivera',
    creatorHandle: 'marcusvisuals',
    stripeAccountId: 'acct_2def456uvw',
    status: 'active',
    escrowBalance: 8750,
    pendingPayout: 0,
    totalPaid: 32100,
    lastPayoutDate: '2024-01-18'
  },
  {
    id: '3',
    creatorName: 'Aisha Patel',
    creatorHandle: 'aisha.creates',
    stripeAccountId: 'acct_3ghi789rst',
    status: 'pending',
    escrowBalance: 15000,
    pendingPayout: 15000,
    totalPaid: 0,
    lastPayoutDate: null
  },
  {
    id: '4',
    creatorName: 'Jake Thompson',
    creatorHandle: 'jakethompson',
    stripeAccountId: 'acct_4jkl012opq',
    status: 'restricted',
    escrowBalance: 5200,
    pendingPayout: 5200,
    totalPaid: 18900,
    lastPayoutDate: '2024-01-10'
  },
  {
    id: '5',
    creatorName: 'Luna Martinez',
    creatorHandle: 'lunacreative',
    stripeAccountId: 'acct_5mno345lmn',
    status: 'active',
    escrowBalance: 22000,
    pendingPayout: 8500,
    totalPaid: 67800,
    lastPayoutDate: '2024-01-19'
  }
];

export default function Payments() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [accounts] = useState<StripeConnectAccount[]>(mockConnectAccounts);

  const filteredAccounts = accounts.filter(account =>
    account.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.creatorHandle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEscrow = accounts.reduce((sum, a) => sum + a.escrowBalance, 0);
  const totalPending = accounts.reduce((sum, a) => sum + a.pendingPayout, 0);
  const totalPaid = accounts.reduce((sum, a) => sum + a.totalPaid, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="scaling">Active</Badge>;
      case 'pending':
        return <Badge variant="pending">Pending</Badge>;
      case 'restricted':
        return <Badge variant="halted">Restricted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'restricted':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <Header />

      <main className="relative p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Payments</h1>
                <Badge variant="secondary" className="gap-1">
                  <CreditCard className="w-3 h-3" />
                  Stripe Connect
                </Badge>
              </div>
              <p className="text-muted-foreground">Manage creator payouts and escrow accounts</p>
            </div>
          </div>
          <Button variant="glow" className="gap-2">
            <Plus className="w-4 h-4" />
            Invite Creator
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total in Escrow</p>
                <p className="text-2xl font-bold font-mono text-foreground">
                  ${totalEscrow.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Secured across {accounts.length} accounts</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                <p className="text-2xl font-bold font-mono text-foreground">
                  ${totalPending.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Processing for release</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid Out</p>
                <p className="text-2xl font-bold font-mono text-success">
                  ${totalPaid.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">All-time creator earnings</p>
          </div>
        </div>

        {/* Stripe Connect Accounts */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Stripe Connect Accounts
            </h3>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators..."
                className="pl-9 bg-muted border-border"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Creator</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Status</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Escrow Balance</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Payout</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Paid</th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{account.creatorName}</p>
                          <p className="text-xs text-muted-foreground">@{account.creatorHandle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(account.status)}
                        {getStatusBadge(account.status)}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {account.stripeAccountId}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono font-medium text-warning">
                        ${account.escrowBalance.toLocaleString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className={`font-mono font-medium ${
                        account.pendingPayout > 0 ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        ${account.pendingPayout.toLocaleString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono font-medium text-success">
                        ${account.totalPaid.toLocaleString()}
                      </p>
                      {account.lastPayoutDate && (
                        <p className="text-xs text-muted-foreground">
                          Last: {new Date(account.lastPayoutDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Stripe
                        </Button>
                        {account.pendingPayout > 0 && account.status === 'active' && (
                          <Button variant="success" size="sm">
                            Release
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAccounts.length === 0 && (
            <div className="p-8 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No accounts found matching your search</p>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="glass-card p-4 border-primary/30">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Secure Escrow with Stripe Connect</p>
              <p className="text-sm text-muted-foreground mt-1">
                All creator funds are held securely via Stripe Connect. Payouts are automatically 
                processed when campaign milestones are met, with full compliance and tax reporting.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
