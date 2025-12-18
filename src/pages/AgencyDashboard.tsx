import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { CampaignTable } from '@/components/CampaignTable';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Bot, Plus, Search, Filter } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  total_budget: number;
  remaining_budget: number;
  status: string;
  created_at: string;
}

export default function AgencyDashboard() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && role && role !== 'agency') {
      navigate('/creator');
      return;
    }
  }, [user, loading, role, navigate]);

  useEffect(() => {
    if (user && role === 'agency') {
      fetchCampaigns();
    }
  }, [user, role]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('agency_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  // Calculate metrics
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.total_budget - c.remaining_budget), 0);
  const activeCampaigns = campaigns.filter(c => ['active', 'optimizing', 'scaling'].includes(c.status)).length;
  const aiPivots = 12; // Mock data - would come from ai_logs count

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
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
            <p className="text-muted-foreground">Manage your influencer campaigns in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
            <Button variant="glow" className="gap-2" onClick={() => navigate('/discovery')}>
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Total Managed Spend"
            value={`$${totalSpend.toLocaleString()}`}
            change={12.5}
            changeLabel="vs last month"
            icon={<DollarSign className="w-5 h-5 text-primary" />}
            variant="primary"
          />
          <MetricCard
            title="Real-Time Incrementality Lift"
            value="18.4%"
            change={3.2}
            changeLabel="vs baseline"
            icon={<TrendingUp className="w-5 h-5 text-success" />}
            variant="success"
          />
          <MetricCard
            title="Active AI Pivots"
            value={aiPivots}
            changeLabel="Optimizations today"
            icon={<Bot className="w-5 h-5 text-accent" />}
          />
        </div>

        {/* Campaign Table */}
        {isLoadingCampaigns ? (
          <div className="glass-card p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Campaigns Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by discovering creators and launching your first AI-powered campaign
            </p>
            <Button variant="glow" size="lg" onClick={() => navigate('/discovery')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Campaign
            </Button>
          </div>
        ) : (
          <CampaignTable campaigns={campaigns} />
        )}
      </main>
    </div>
  );
}
