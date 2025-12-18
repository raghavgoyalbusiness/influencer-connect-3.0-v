import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { CreatorGrid } from '@/components/CreatorGrid';
import { AILogFeed } from '@/components/AILogFeed';
import { ROIChart } from '@/components/ROIChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Play, Pause, Settings, RefreshCw } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  total_budget: number;
  remaining_budget: number;
  status: string;
  vibe_description: string | null;
}

interface Participant {
  id: string;
  creator_id: string;
  status: string;
  current_engagement_rate: number;
  real_time_sales_lift: number;
  creators: {
    id: string;
    name: string;
    handle: string;
    avatar_url: string | null;
    niche: string | null;
    aesthetic_score: number;
    base_rate: number;
  };
}

// Mock ROI data
const mockROIData = [
  { time: '00:00', baseline: 12000, influencer: 12500 },
  { time: '04:00', baseline: 11000, influencer: 14000 },
  { time: '08:00', baseline: 15000, influencer: 22000 },
  { time: '12:00', baseline: 18000, influencer: 28000 },
  { time: '16:00', baseline: 16000, influencer: 32000 },
  { time: '20:00', baseline: 14000, influencer: 35000 },
  { time: 'Now', baseline: 13500, influencer: 38000 },
];

export default function FlightControl() {
  const { campaignId } = useParams();
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    if (user && campaignId) {
      fetchCampaignData();
    }
  }, [user, campaignId]);

  const fetchCampaignData = async () => {
    try {
      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch participants with creator details
      const { data: participantData, error: participantError } = await supabase
        .from('campaign_participants')
        .select(`
          *,
          creators (*)
        `)
        .eq('campaign_id', campaignId);

      if (participantError) throw participantError;
      setParticipants(participantData || []);
    } catch (err) {
      console.error('Error fetching campaign:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const statusVariantMap: Record<string, 'scaling' | 'optimizing' | 'halted' | 'pending' | 'draft' | 'active'> = {
    scaling: 'scaling',
    optimizing: 'optimizing',
    halted: 'halted',
    pending: 'pending',
    draft: 'draft',
    active: 'active',
    completed: 'active',
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Campaign Not Found</h2>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <Header />

      <main className="relative p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
                <Badge variant={statusVariantMap[campaign.status] || 'default'}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Budget: ${campaign.total_budget.toLocaleString()} • 
                Remaining: ${campaign.remaining_budget.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            {campaign.status === 'active' || campaign.status === 'optimizing' ? (
              <Button variant="warning">
                <Pause className="w-4 h-4 mr-2" />
                Pause Campaign
              </Button>
            ) : (
              <Button variant="glow">
                <Play className="w-4 h-4 mr-2" />
                Start Campaign
              </Button>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Creator List & Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* ROI Chart */}
            <ROIChart data={mockROIData} />

            {/* Creator Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Campaign Creators</h2>
                <Button variant="outline" size="sm">
                  Add Creators
                </Button>
              </div>
              <CreatorGrid participants={participants} />
            </div>
          </div>

          {/* Right Column - AI Log */}
          <div className="lg:col-span-1">
            <div className="glass-card h-[600px] sticky top-24">
              <AILogFeed campaignId={campaign.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
