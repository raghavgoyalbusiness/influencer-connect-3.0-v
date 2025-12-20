import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  ArrowUpRight,
  Sparkles,
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface CreatorWallet {
  id: string;
  creator_id: string;
  pending_earnings: number;
  total_earned: number;
  total_withdrawn: number;
  min_payout_threshold: number;
  payout_status: string;
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

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}

interface CreatorWalletViewProps {
  creatorId?: string;
}

export function CreatorWalletView({ creatorId }: CreatorWalletViewProps) {
  const [wallet, setWallet] = useState<CreatorWallet | null>(null);
  const [earnings, setEarnings] = useState<EarningsEntry[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

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
        const [earningsResult, payoutsResult] = await Promise.all([
          supabase
            .from("earnings_history")
            .select(`*, campaign:campaigns(name)`)
            .eq("creator_id", data.creator_id)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("payout_requests")
            .select("*")
            .eq("creator_id", data.creator_id)
            .order("created_at", { ascending: false })
            .limit(5)
        ]);

        if (!earningsResult.error) setEarnings(earningsResult.data || []);
        if (!payoutsResult.error) setPayoutRequests(payoutsResult.data || []);
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
        { event: "*", schema: "public", table: "creator_wallets" },
        () => fetchWallet()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "earnings_history" },
        (payload) => {
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

  const handleClaimFunds = async () => {
    if (!wallet) return;
    
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-creator-payout", {});

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        fetchWallet();
      } else if (data.requires_stripe_connect) {
        toast.error("Please link your Stripe account", {
          description: "You need a Stripe Connect account to receive payouts",
        });
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error: any) {
      console.error("Error claiming funds:", error);
      toast.error(error.message || "Failed to claim funds");
    } finally {
      setClaiming(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getPayoutProgress = () => {
    if (!wallet) return 0;
    return Math.min((wallet.pending_earnings / wallet.min_payout_threshold) * 100, 100);
  };

  const canClaim = wallet && wallet.pending_earnings >= wallet.min_payout_threshold;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-neon-green" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <Card className="glass-card border-border/50">
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
      {/* Main Wallet Card */}
      <Card className="glass-card border-neon-green/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent pointer-events-none" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-neon-green" />
              Creator Wallet
            </CardTitle>
            <Badge 
              className={
                wallet.payout_status === "completed" 
                  ? "bg-neon-green/20 text-neon-green border-neon-green/30" 
                  : wallet.payout_status === "processing"
                  ? "bg-warning/20 text-warning border-warning/30"
                  : "bg-muted text-muted-foreground"
              }
            >
              {wallet.payout_status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending Earnings - Hero */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">Pending Earnings</p>
            <p className="text-5xl font-bold text-neon-green font-mono">
              ${wallet.pending_earnings.toFixed(2)}
            </p>
            
            {/* Payout Progress */}
            <div className="mt-4 max-w-xs mx-auto">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Min. Payout: ${wallet.min_payout_threshold}</span>
                <span>{getPayoutProgress().toFixed(0)}%</span>
              </div>
              <Progress 
                value={getPayoutProgress()} 
                className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-neon-green [&>div]:to-emerald-400"
              />
            </div>
          </div>

          {/* Claim Button */}
          <Button 
            onClick={handleClaimFunds}
            disabled={!canClaim || claiming}
            className={`w-full h-12 text-lg font-semibold transition-all ${
              canClaim 
                ? "bg-gradient-to-r from-neon-green to-emerald-500 text-black hover:shadow-neon" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            {claiming ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : canClaim ? (
              <>
                <ArrowUpRight className="h-5 w-5 mr-2" />
                Claim ${wallet.pending_earnings.toFixed(2)}
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 mr-2" />
                ${(wallet.min_payout_threshold - wallet.pending_earnings).toFixed(2)} more to claim
              </>
            )}
          </Button>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4 text-neon-green" />
                Total Earned
              </div>
              <p className="text-2xl font-bold font-mono text-neon-green">
                ${wallet.total_earned.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4 text-views-blue" />
                Withdrawn
              </div>
              <p className="text-2xl font-bold font-mono text-views-blue">
                ${wallet.total_withdrawn.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payout Requests */}
      {payoutRequests.length > 0 && (
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payoutRequests.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {payout.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-neon-green" />
                  ) : payout.status === "failed" ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Clock className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <p className="font-medium">${payout.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(payout.created_at)}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  payout.status === "completed" ? "default" : 
                  payout.status === "failed" ? "destructive" : "secondary"
                }>
                  {payout.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Earnings */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neon-green" />
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
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-neon-green/10 hover:border-neon-green/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-neon-green" />
                    </div>
                    <div>
                      <p className="font-medium">{entry.campaign?.name || "Campaign"}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="text-views-blue">{entry.views_earned.toLocaleString()} views</span>
                        {" × "}
                        <span className="text-neon-green">${entry.cpv_rate}/1K</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neon-green font-mono">
                      +${entry.amount_earned.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(entry.created_at)}
                    </p>
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
