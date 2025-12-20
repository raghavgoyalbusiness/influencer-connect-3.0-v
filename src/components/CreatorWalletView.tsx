import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  ArrowUpRight,
  Sparkles,
  DollarSign,
  RefreshCw
} from "lucide-react";

interface CreatorWallet {
  id: string;
  creator_id: string;
  pending_earnings: number;
  total_earned: number;
  total_withdrawn: number;
  last_payout_at: string | null;
}

interface EarningsEntry {
  id: string;
  campaign_id: string;
  views_earned: number;
  amount_earned: number;
  cpv_rate: number;
  created_at: string;
  campaign?: {
    name: string;
  };
}

interface CreatorWalletViewProps {
  creatorId?: string;
}

export function CreatorWalletView({ creatorId }: CreatorWalletViewProps) {
  const [wallet, setWallet] = useState<CreatorWallet | null>(null);
  const [earnings, setEarnings] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    try {
      let query = supabase.from("creator_wallets").select("*");
      
      if (creatorId) {
        query = query.eq("creator_id", creatorId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      setWallet(data);

      // Fetch earnings history
      if (data) {
        const { data: earningsData, error: earningsError } = await supabase
          .from("earnings_history")
          .select(`
            *,
            campaign:campaigns(name)
          `)
          .eq("creator_id", data.creator_id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (earningsError) throw earningsError;
        setEarnings(earningsData || []);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("creator-wallet-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "creator_wallets",
        },
        () => {
          fetchWallet();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "earnings_history",
        },
        (payload) => {
          // Show toast for new earnings
          const newEarning = payload.new as EarningsEntry;
          toast.success(`+$${newEarning.amount_earned.toFixed(2)} earned!`, {
            description: `${newEarning.views_earned.toLocaleString()} new views`,
          });
          fetchWallet();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorId]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12 text-center">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Wallet Found</h3>
          <p className="text-muted-foreground">
            Start participating in CPV campaigns to earn rewards
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Earnings - Main Card */}
        <Card className="md:col-span-1 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Earnings
                </p>
                <p className="text-4xl font-bold text-green-500 mt-2">
                  ${wallet.pending_earnings.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Available for withdrawal
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-green-500/30 text-green-500 hover:bg-green-500/10">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">${wallet.total_earned.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Withdrawn */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                <p className="text-2xl font-bold">${wallet.total_withdrawn.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Recent Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No earnings yet. Start creating content to earn!
            </p>
          ) : (
            <div className="space-y-3">
              {earnings.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">{entry.campaign?.name || "Campaign"}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.views_earned.toLocaleString()} views × ${entry.cpv_rate}/1K
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-500">+${entry.amount_earned.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(entry.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
