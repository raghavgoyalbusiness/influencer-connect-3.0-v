import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Eye, 
  TrendingUp, 
  Zap, 
  RefreshCw, 
  Play,
  Sparkles,
  DollarSign
} from "lucide-react";

interface ContentPerformance {
  id: string;
  campaign_id: string;
  creator_id: string;
  content_url: string | null;
  platform: string;
  view_count: number;
  is_viral: boolean;
  last_synced_at: string;
  creator?: {
    name: string;
    handle: string;
    avatar_url: string | null;
  };
}

interface LivePerformanceViewProps {
  campaignId: string;
  cpvRate: number;
  viralThreshold: number;
}

export function LivePerformanceView({ campaignId, cpvRate, viralThreshold }: LivePerformanceViewProps) {
  const [content, setContent] = useState<ContentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("content_performance")
        .select(`
          *,
          creator:creators(name, handle, avatar_url)
        `)
        .eq("campaign_id", campaignId)
        .order("view_count", { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("content-performance-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_performance",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          fetchContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(() => {
      handleSync();
    }, 10000); // Sync every 10 seconds

    return () => clearInterval(interval);
  }, [autoSync, campaignId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-content-views", {
        body: { campaign_id: campaignId },
      });

      if (error) throw error;

      if (data.results && data.results.length > 0) {
        const viralContent = data.results.filter((r: any) => r.is_viral);
        if (viralContent.length > 0) {
          toast.success(`🔥 ${viralContent.length} content went VIRAL!`);
        }
        
        const totalEarnings = data.results.reduce((sum: number, r: any) => sum + r.earnings_added, 0);
        if (totalEarnings > 0) {
          toast.success(`+$${totalEarnings.toFixed(2)} earnings distributed!`);
        }
      }

      fetchContent();
    } catch (error) {
      console.error("Error syncing views:", error);
      toast.error("Failed to sync view counts");
    } finally {
      setSyncing(false);
    }
  };

  const totalViews = content.reduce((sum, c) => sum + c.view_count, 0);
  const totalEarnings = (totalViews / 1000) * cpvRate;
  const viralCount = content.filter(c => c.is_viral).length;

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "tiktok": return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "instagram": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "youtube": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "twitter": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getViralProgress = (views: number) => {
    return Math.min((views / viralThreshold) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Live Performance
        </h2>
        <div className="flex items-center gap-3">
          <Button
            variant={autoSync ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoSync(!autoSync)}
          >
            <Play className={`h-4 w-4 mr-2 ${autoSync ? "animate-pulse" : ""}`} />
            {autoSync ? "Auto-Syncing" : "Auto-Sync"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">Earnings Distributed</p>
                <p className="text-2xl font-bold text-green-500">${totalEarnings.toFixed(2)}</p>
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
                <p className="text-sm text-muted-foreground">Viral Content</p>
                <p className="text-2xl font-bold text-amber-500">{viralCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPV Rate</p>
                <p className="text-2xl font-bold">${cpvRate}/1K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content List */}
      {content.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Content Tracked Yet</h3>
            <p className="text-muted-foreground">
              Add influencer content to start tracking views and earnings
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {content.map((item) => {
            const earnings = (item.view_count / 1000) * cpvRate;
            const viralProgress = getViralProgress(item.view_count);

            return (
              <Card 
                key={item.id} 
                className={`bg-card/50 border-border/50 transition-all ${
                  item.is_viral ? "border-amber-500/50 bg-amber-500/5" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Creator Info */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                          {item.creator?.avatar_url ? (
                            <img 
                              src={item.creator.avatar_url} 
                              alt={item.creator.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-primary">
                              {item.creator?.name?.charAt(0) || "?"}
                            </span>
                          )}
                        </div>
                        {item.is_viral && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.creator?.name || "Unknown"}</p>
                          <Badge className={getPlatformColor(item.platform)}>
                            {item.platform}
                          </Badge>
                          {item.is_viral && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 animate-pulse">
                              🔥 VIRAL
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{item.creator?.handle}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{item.view_count.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">${earnings.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Earned</p>
                      </div>
                    </div>

                    {/* Viral Progress */}
                    <div className="w-full lg:w-48">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Viral Progress</span>
                        <span className={item.is_viral ? "text-amber-500" : "text-muted-foreground"}>
                          {viralProgress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={viralProgress} 
                        className={`h-2 ${item.is_viral ? "[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" : ""}`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.is_viral ? "🎉 Viral!" : `${(viralThreshold - item.view_count).toLocaleString()} to go`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
