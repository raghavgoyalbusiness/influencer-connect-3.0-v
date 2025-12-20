import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Link, MousePointer, ShoppingCart, DollarSign, RefreshCw, Plus } from "lucide-react";

interface TrackingCode {
  id: string;
  campaign_id: string;
  creator_id: string;
  code: string;
  discount_percent: number;
  tracking_url: string;
  clicks: number;
  conversions: number;
  revenue_generated: number;
  is_active: boolean;
  created_at: string;
  creator?: {
    name: string;
    handle: string;
    avatar_url: string | null;
  };
  campaign?: {
    name: string;
  };
}

interface TrackingCodeDashboardProps {
  campaignId?: string;
  creatorId?: string;
  isCreatorView?: boolean;
}

export function TrackingCodeDashboard({ 
  campaignId, 
  creatorId, 
  isCreatorView = false 
}: TrackingCodeDashboardProps) {
  const [trackingCodes, setTrackingCodes] = useState<TrackingCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchTrackingCodes = async () => {
    try {
      let query = supabase
        .from("tracking_codes")
        .select(`
          *,
          creator:creators(name, handle, avatar_url),
          campaign:campaigns(name)
        `)
        .order("created_at", { ascending: false });

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }
      if (creatorId) {
        query = query.eq("creator_id", creatorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrackingCodes(data || []);
    } catch (error) {
      console.error("Error fetching tracking codes:", error);
      toast.error("Failed to load tracking codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingCodes();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("tracking-codes-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tracking_codes",
        },
        () => {
          fetchTrackingCodes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, creatorId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const generateCode = async (campaignId: string, creatorId: string) => {
    setGenerating(creatorId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to generate codes");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-tracking-code", {
        body: { campaign_id: campaignId, creator_id: creatorId, discount_percent: 10 },
      });

      if (error) throw error;

      toast.success("Tracking code generated!");
      fetchTrackingCodes();
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Failed to generate tracking code");
    } finally {
      setGenerating(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getConversionRate = (clicks: number, conversions: number) => {
    if (clicks === 0) return "0%";
    return `${((conversions / clicks) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isCreatorView ? "Your Tracking Codes" : "Tracking Codes & Links"}
        </h2>
        <Button variant="outline" size="sm" onClick={fetchTrackingCodes}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Link className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Codes</p>
                <p className="text-2xl font-bold">{trackingCodes.filter(c => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MousePointer className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">
                  {trackingCodes.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold">
                  {trackingCodes.reduce((sum, c) => sum + c.conversions, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue Generated</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(trackingCodes.reduce((sum, c) => sum + c.revenue_generated, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Codes List */}
      {trackingCodes.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Link className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tracking codes yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate unique coupon codes and tracking links for your influencers
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trackingCodes.map((tc) => (
            <Card key={tc.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Creator & Campaign Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      {tc.creator?.avatar_url ? (
                        <img 
                          src={tc.creator.avatar_url} 
                          alt={tc.creator.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {tc.creator?.name?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tc.creator?.name || "Unknown Creator"}</p>
                      <p className="text-sm text-muted-foreground">
                        @{tc.creator?.handle} • {tc.campaign?.name}
                      </p>
                    </div>
                  </div>

                  {/* Code & Link */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                        <span className="font-mono font-bold text-primary">{tc.code}</span>
                        {tc.discount_percent > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {tc.discount_percent}% OFF
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyToClipboard(tc.code, "Code")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {tc.tracking_url && (
                      <div className="flex items-center gap-2">
                        <Input 
                          value={tc.tracking_url} 
                          readOnly 
                          className="w-48 text-xs bg-muted/50"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(tc.tracking_url, "Tracking URL")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{tc.clicks.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-500">{tc.conversions.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Conversions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-500">
                        {getConversionRate(tc.clicks, tc.conversions)}
                      </p>
                      <p className="text-xs text-muted-foreground">CVR</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatCurrency(tc.revenue_generated)}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>

                  {/* Status */}
                  <Badge variant={tc.is_active ? "default" : "secondary"}>
                    {tc.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
