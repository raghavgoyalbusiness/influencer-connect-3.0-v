import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { EscrowCard } from '@/components/EscrowCard';
import { BonusMeter } from '@/components/BonusMeter';
import { DoubleDonPopup } from '@/components/DoubleDonPopup';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, TrendingUp, Clock, Star, Bell } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

interface CampaignParticipation {
  id: string;
  status: string;
  escrow_amount: number;
  current_engagement_rate: number;
  real_time_sales_lift: number;
  campaigns: {
    id: string;
    name: string;
    status: string;
  };
}

export default function CreatorPortal() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && role && role !== 'creator') {
      navigate('/');
      return;
    }
  }, [user, loading, role, navigate]);

  useEffect(() => {
    if (user && role === 'creator') {
      fetchCreatorData();
    }
  }, [user, role]);

  const fetchCreatorData = async () => {
    try {
      // Get creator id
      const { data: creatorData } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!creatorData) {
        setIsLoading(false);
        return;
      }

      // Fetch transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('creator_id', creatorData.id)
        .order('created_at', { ascending: false });

      setTransactions(txData || []);

      // Fetch campaign participations
      const { data: partData } = await supabase
        .from('campaign_participants')
        .select(`
          *,
          campaigns (id, name, status)
        `)
        .eq('creator_id', creatorData.id);

      setParticipations(partData || []);

      // Show bonus popup after a delay (simulating real-time offer)
      setTimeout(() => setShowBonusPopup(true), 3000);
    } catch (err) {
      console.error('Error fetching creator data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate average engagement
  const avgEngagement = participations.length > 0
    ? participations.reduce((sum, p) => sum + p.current_engagement_rate, 0) / participations.length
    : 45; // Default for demo

  // Check if any campaign is completed for withdrawals
  const canWithdraw = participations.some(p => p.campaigns?.status === 'completed');

  if (loading || isLoading) {
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

      <main className="relative p-6 max-w-6xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Creator Hub</h1>
            <p className="text-muted-foreground">Track your earnings and campaign performance</p>
          </div>
          <Button variant="outline" className="gap-2 relative">
            <Bell className="w-4 h-4" />
            Notifications
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              2
            </span>
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Escrow Card */}
          <EscrowCard transactions={transactions} canWithdraw={canWithdraw} />

          {/* Bonus Meter */}
          <BonusMeter 
            currentEngagement={avgEngagement}
            threshold={75}
            bonusAmount={2500}
          />
        </div>

        {/* Active Campaigns */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Your Campaigns</h2>
            <Badge variant="secondary">{participations.length} Active</Badge>
          </div>

          {participations.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Active Campaigns</h3>
              <p className="text-sm text-muted-foreground">
                You'll see your campaign participations here once agencies invite you
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {participations.map((participation) => (
                <div 
                  key={participation.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {participation.campaigns?.name || 'Campaign'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Escrow: ${participation.escrow_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center hidden md:block">
                        <p className="text-xs text-muted-foreground">Engagement</p>
                        <p className="font-mono font-medium text-foreground">
                          {participation.current_engagement_rate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center hidden md:block">
                        <p className="text-xs text-muted-foreground">Sales Lift</p>
                        <p className={`font-mono font-medium ${
                          participation.real_time_sales_lift > 10 ? 'text-success' : 'text-foreground'
                        }`}>
                          +{participation.real_time_sales_lift.toFixed(1)}%
                        </p>
                      </div>
                      <Badge variant={participation.status === 'active' ? 'active' : 'pending'}>
                        {participation.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold font-mono text-foreground">{avgEngagement.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Avg Engagement</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Briefcase className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold font-mono text-foreground">{participations.length}</p>
            <p className="text-xs text-muted-foreground">Active Campaigns</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Star className="w-6 h-6 mx-auto text-warning mb-2" />
            <p className="text-2xl font-bold font-mono text-foreground">4.9</p>
            <p className="text-xs text-muted-foreground">Creator Rating</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-accent mb-2" />
            <p className="text-2xl font-bold font-mono text-foreground">12</p>
            <p className="text-xs text-muted-foreground">Days Active</p>
          </div>
        </div>
      </main>

      {/* Double-Down Popup */}
      <DoubleDonPopup
        isOpen={showBonusPopup}
        onClose={() => setShowBonusPopup(false)}
        bonusAmount={750}
        deadline="24 hours"
        contentType="1x Instagram Story + 1x TikTok Review"
      />
    </div>
  );
}
