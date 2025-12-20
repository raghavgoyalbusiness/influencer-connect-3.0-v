import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { CPVCampaignForm } from "@/components/CPVCampaignForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { 
  Eye, 
  Plus, 
  Zap, 
  TrendingUp, 
  DollarSign,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface CPVCampaign {
  id: string;
  name: string;
  total_budget: number;
  remaining_budget: number;
  locked_budget: number;
  cpv_rate: number;
  viral_threshold: number;
  status: string;
  created_at: string;
}

export default function ContentRewards() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CPVCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("campaigns");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (!loading && role && role !== "agency") {
      navigate("/creator");
      return;
    }
  }, [user, loading, role, navigate]);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("is_cpv_campaign", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalBudget = campaigns.reduce((sum, c) => sum + c.total_budget, 0);
  const totalLocked = campaigns.reduce((sum, c) => sum + c.locked_budget, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  return (
    <div className="min-h-screen bg-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <Header />

      <main className="relative p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
              Content Rewards
            </h1>
            <p className="text-muted-foreground mt-1">
              Pay-per-view campaigns with real-time earnings tracking
            </p>
          </div>
          <Button variant="glow" onClick={() => setActiveTab("create")}>
            <Plus className="h-4 w-4 mr-2" />
            New CPV Campaign
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPV Campaigns</p>
                  <p className="text-2xl font-bold">{campaigns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Locked in Escrow</p>
                  <p className="text-2xl font-bold">${totalLocked.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-bold">{activeCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="campaigns" className="gap-2">
              <Eye className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            {campaigns.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="py-16 text-center">
                  <Zap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No CPV Campaigns Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first Cost-Per-View campaign to start paying influencers based on actual video performance
                  </p>
                  <Button variant="glow" onClick={() => setActiveTab("create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <Card 
                    key={campaign.id} 
                    className="bg-card/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/flight/${campaign.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-amber-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{campaign.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              ${campaign.cpv_rate}/1K views • {campaign.viral_threshold.toLocaleString()} viral threshold
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xl font-bold">${campaign.total_budget.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Budget</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-green-500">${campaign.locked_budget.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Locked</p>
                          </div>
                          <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create">
            <div className="max-w-2xl mx-auto">
              <CPVCampaignForm onSuccess={() => {
                fetchCampaigns();
                setActiveTab("campaigns");
              }} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
