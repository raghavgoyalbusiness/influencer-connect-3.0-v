import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Zap,
  User
} from "lucide-react";

interface SaleEvent {
  id: string;
  tracking_code_id: string;
  campaign_id: string;
  creator_id: string;
  order_id: string | null;
  customer_email: string | null;
  sale_amount: number;
  commission_amount: number;
  product_name: string | null;
  created_at: string;
  creator?: {
    name: string;
    handle: string;
    avatar_url: string | null;
  };
  campaign?: {
    name: string;
  };
  tracking_code?: {
    code: string;
  };
}

interface LiveSalesFeedProps {
  campaignId?: string;
  creatorId?: string;
  limit?: number;
}

export function LiveSalesFeed({ campaignId, creatorId, limit = 20 }: LiveSalesFeedProps) {
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  const fetchSales = async () => {
    try {
      let query = supabase
        .from("sales_events")
        .select(`
          *,
          creator:creators(name, handle, avatar_url),
          campaign:campaigns(name),
          tracking_code:tracking_codes(code)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }
      if (creatorId) {
        query = query.eq("creator_id", creatorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();

    // Subscribe to real-time sales
    const channel = supabase
      .channel("live-sales-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sales_events",
        },
        async (payload) => {
          console.log("New sale event:", payload);
          
          // Fetch the full sale with relations
          const { data } = await supabase
            .from("sales_events")
            .select(`
              *,
              creator:creators(name, handle, avatar_url),
              campaign:campaigns(name),
              tracking_code:tracking_codes(code)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setSales(prev => [data, ...prev].slice(0, limit));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, creatorId, limit]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const totalSales = sales.reduce((sum, s) => sum + s.sale_amount, 0);
  const totalCommission = sales.reduce((sum, s) => sum + s.commission_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-neon-green" />
            Live Sales Feed
          </h3>
          {isLive && (
            <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-neon-green mr-1.5 animate-ping" />
              LIVE
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-neon-green/5 border border-neon-green/20">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-neon-green" />
            <span className="text-xs text-muted-foreground">Total Sales</span>
          </div>
          <p className="text-xl font-bold text-neon-green mt-1">
            ${totalSales.toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-views-blue/5 border border-views-blue/20">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-views-blue" />
            <span className="text-xs text-muted-foreground">Commission</span>
          </div>
          <p className="text-xl font-bold text-views-blue mt-1">
            ${totalCommission.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Sales List */}
      {sales.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No sales yet. Sales will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {sales.map((sale, index) => (
            <div
              key={sale.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                index === 0 
                  ? "bg-neon-green/10 border-neon-green/30 animate-pulse" 
                  : "bg-card/50 border-border/50 hover:border-neon-green/20"
              }`}
            >
              {/* Creator Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-green/20 to-views-blue/20 flex items-center justify-center overflow-hidden">
                {sale.creator?.avatar_url ? (
                  <img 
                    src={sale.creator.avatar_url} 
                    alt={sale.creator.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Sale Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {sale.creator?.name || "Unknown"}
                  </span>
                  <Badge variant="outline" className="text-xs px-1.5">
                    {sale.tracking_code?.code || "CODE"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {sale.product_name || sale.campaign?.name || "Product"}
                </p>
              </div>

              {/* Amounts */}
              <div className="text-right">
                <p className="font-bold text-neon-green">
                  +${sale.commission_amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${sale.sale_amount.toFixed(2)} sale
                </p>
              </div>

              {/* Time */}
              <div className="text-xs text-muted-foreground w-16 text-right">
                {formatTimeAgo(sale.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
