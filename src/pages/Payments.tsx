import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FundEscrowDialog } from '@/components/FundEscrowDialog';
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
  Plus,
  RefreshCw,
  Loader2,
  Link as LinkIcon,
  Wallet
} from 'lucide-react';

interface StripeConnectAccount {
  id: string;
  creatorName: string;
  creatorHandle: string;
  stripeAccountId: string | null;
  status: 'active' | 'pending' | 'restricted' | 'not_connected';
  escrowBalance: number;
  pendingPayout: number;
  totalPaid: number;
  lastPayoutDate: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

interface PlatformBalance {
  available: number;
  pending: number;
}

interface Campaign {
  id: string;
  name: string;
  total_budget: number;
  remaining_budget: number;
}

export default function Payments() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [accounts, setAccounts] = useState<StripeConnectAccount[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [platformBalance, setPlatformBalance] = useState<PlatformBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [releasingEscrow, setReleasingEscrow] = useState<string | null>(null);
  const [fundEscrowOpen, setFundEscrowOpen] = useState(false);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-accounts');
      if (error) throw error;
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Stripe Connect accounts',
        variant: 'destructive',
      });
    }
  };

  const fetchBalance = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-balance');
      if (error) throw error;
      setPlatformBalance({
        available: data.available || 0,
        pending: data.pending || 0,
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAccounts(), fetchBalance()]);
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Account data has been updated',
    });
  };

  const handleReleaseEscrow = async (account: StripeConnectAccount) => {
    if (!account.stripeAccountId || account.pendingPayout <= 0) return;
    
    setReleasingEscrow(account.id);
    try {
      const { data, error } = await supabase.functions.invoke('release-escrow', {
        body: {
          creatorId: account.id,
          stripeAccountId: account.stripeAccountId,
          amount: account.pendingPayout,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Payout Released',
        description: `Successfully released $${account.pendingPayout.toLocaleString()} to ${account.creatorName}`,
      });
      
      await fetchAccounts();
    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast({
        title: 'Release Failed',
        description: error instanceof Error ? error.message : 'Failed to release payout',
        variant: 'destructive',
      });
    } finally {
      setReleasingEscrow(null);
    }
  };

  const handleCreateConnectAccount = async (creator: { id: string; name: string; email?: string }) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: {
          creatorId: creator.id,
          creatorName: creator.name,
          creatorEmail: creator.email || `${creator.id}@placeholder.com`,
        },
      });
      
      if (error) throw error;
      
      if (data.onboardingUrl) {
        window.open(data.onboardingUrl, '_blank');
        toast({
          title: 'Onboarding Started',
          description: 'Creator has been redirected to complete Stripe Connect setup',
        });
      }
      
      await fetchAccounts();
    } catch (error) {
      console.error('Error creating connect account:', error);
      toast({
        title: 'Error',
        description: 'Failed to create Stripe Connect account',
        variant: 'destructive',
      });
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, total_budget, remaining_budget');
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  // Handle escrow payment success/cancel from URL params
  useEffect(() => {
    const escrowSuccess = searchParams.get('escrow_success');
    const escrowCancelled = searchParams.get('escrow_cancelled');
    const amount = searchParams.get('amount');
    const campaignId = searchParams.get('campaign');

    if (escrowSuccess === 'true') {
      toast({
        title: 'Escrow Funded Successfully',
        description: `$${amount || '0'} has been added to escrow`,
      });
      
      // Verify and record the payment
      if (campaignId && amount) {
        supabase.functions.invoke('verify-escrow-payment', {
          body: { campaignId, amount: parseFloat(amount) },
        }).then(() => {
          fetchAccounts();
          fetchCampaigns();
        });
      }
      
      // Clear URL params
      setSearchParams({});
    } else if (escrowCancelled === 'true') {
      toast({
        title: 'Checkout Cancelled',
        description: 'Escrow funding was cancelled',
        variant: 'destructive',
      });
      setSearchParams({});
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAccounts(), fetchBalance(), fetchCampaigns()]);
      setLoading(false);
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

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
      case 'not_connected':
        return <Badge variant="secondary">Not Connected</Badge>;
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
      case 'not_connected':
        return <LinkIcon className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading payment data...</p>
        </div>
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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="glow" 
              className="gap-2"
              onClick={() => setFundEscrowOpen(true)}
              disabled={campaigns.length === 0}
            >
              <Wallet className="w-4 h-4" />
              Fund Escrow
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <p className="text-xs text-muted-foreground">Ready for release</p>
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

          {platformBalance && (
            <div className="glass-card p-6 border-primary/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Platform Balance</p>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    ${platformBalance.available.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ${platformBalance.pending.toLocaleString()} pending
              </p>
            </div>
          )}
        </div>

        {/* Stripe Connect Accounts */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Stripe Connect Accounts
              <Badge variant="secondary">{accounts.length} creators</Badge>
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
                      {account.stripeAccountId ? (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {account.stripeAccountId}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          No Stripe account linked
                        </p>
                      )}
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
                        {account.stripeAccountId ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => window.open(`https://dashboard.stripe.com/connect/accounts/${account.stripeAccountId}`, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Stripe
                            </Button>
                            {account.pendingPayout > 0 && account.status === 'active' && (
                              <Button 
                                variant="success" 
                                size="sm"
                                disabled={releasingEscrow === account.id}
                                onClick={() => handleReleaseEscrow(account)}
                              >
                                {releasingEscrow === account.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Release'
                                )}
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => handleCreateConnectAccount({
                              id: account.id,
                              name: account.creatorName,
                            })}
                          >
                            <Plus className="w-3 h-3" />
                            Connect
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
              <p className="text-muted-foreground">
                {accounts.length === 0 
                  ? 'No creators in the system yet' 
                  : 'No accounts found matching your search'}
              </p>
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

      {/* Fund Escrow Dialog */}
      <FundEscrowDialog
        open={fundEscrowOpen}
        onOpenChange={setFundEscrowOpen}
        campaigns={campaigns}
        creators={accounts.map(a => ({ id: a.id, name: a.creatorName, handle: a.creatorHandle }))}
      />
    </div>
  );
}
