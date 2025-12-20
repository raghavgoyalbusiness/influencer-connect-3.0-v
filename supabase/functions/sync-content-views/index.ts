import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-CONTENT-VIEWS] ${step}${detailsStr}`);
};

// Mock social media API - simulates fetching view counts
function mockSocialMediaAPI(platform: string, contentUrl: string, currentViews: number): number {
  // Simulate organic growth with some randomness
  const growthRate = Math.random() * 0.15 + 0.02; // 2-17% growth
  const viralChance = Math.random();
  
  let newViews = currentViews;
  
  if (viralChance > 0.95) {
    // 5% chance of viral spike
    newViews = currentViews + Math.floor(Math.random() * 50000) + 10000;
    logStep("VIRAL SPIKE detected!", { platform, currentViews, newViews });
  } else {
    // Normal growth
    newViews = Math.floor(currentViews * (1 + growthRate)) + Math.floor(Math.random() * 500);
  }
  
  return newViews;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { campaign_id, content_performance_id } = await req.json();

    logStep("Request params", { campaign_id, content_performance_id });

    let query = supabaseClient
      .from("content_performance")
      .select(`
        *,
        campaign:campaigns(id, name, cpv_rate, locked_budget, is_cpv_campaign, viral_threshold),
        creator:creators(id, name, handle)
      `);

    if (content_performance_id) {
      query = query.eq("id", content_performance_id);
    } else if (campaign_id) {
      query = query.eq("campaign_id", campaign_id);
    }

    const { data: contentItems, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch content: ${fetchError.message}`);
    }

    if (!contentItems || contentItems.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No content to sync",
        updated: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep(`Found ${contentItems.length} content items to sync`);

    const results = [];

    for (const content of contentItems) {
      if (!content.campaign?.is_cpv_campaign) {
        logStep("Skipping non-CPV campaign", { contentId: content.id });
        continue;
      }

      // Mock API call to get new view count
      const newViewCount = mockSocialMediaAPI(
        content.platform, 
        content.content_url || "", 
        content.view_count
      );

      logStep("Fetched new view count", { 
        contentId: content.id, 
        oldViews: content.view_count, 
        newViews: newViewCount,
        delta: newViewCount - content.view_count
      });

      if (newViewCount > content.view_count) {
        // Calculate earnings using the database function
        const { data: earnings, error: earningsError } = await supabaseClient
          .rpc("calculate_cpv_earnings", {
            p_content_performance_id: content.id,
            p_new_view_count: newViewCount
          });

        if (earningsError) {
          logStep("Error calculating earnings", { error: earningsError.message });
        } else {
          logStep("Earnings calculated", { 
            contentId: content.id, 
            earnings,
            creator: content.creator?.name
          });
        }

        results.push({
          content_id: content.id,
          creator_name: content.creator?.name,
          platform: content.platform,
          old_views: content.view_count,
          new_views: newViewCount,
          views_delta: newViewCount - content.view_count,
          earnings_added: earnings || 0,
          is_viral: newViewCount >= (content.campaign?.viral_threshold || 100000)
        });
      }
    }

    logStep("Sync complete", { updatedCount: results.length });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Synced ${results.length} content items`,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
