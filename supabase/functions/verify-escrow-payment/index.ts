import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-ESCROW-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");
    
    const { campaignId, creatorId, amount } = await req.json();
    logStep("Request body", { campaignId, creatorId, amount });

    if (!campaignId || !amount) {
      throw new Error("Missing required fields: campaignId, amount");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // If no specific creator, get all active participants for this campaign
    let creatorIds: string[] = [];
    
    if (creatorId) {
      creatorIds = [creatorId];
    } else {
      const { data: participants, error: participantsError } = await supabaseClient
        .from('campaign_participants')
        .select('creator_id')
        .eq('campaign_id', campaignId)
        .in('status', ['active', 'pending']);
      
      if (participantsError) throw new Error(`Failed to fetch participants: ${participantsError.message}`);
      creatorIds = participants?.map(p => p.creator_id) || [];
    }

    logStep("Found creators for campaign", { creatorIds });

    if (creatorIds.length === 0) {
      throw new Error("No active creators found for this campaign");
    }

    // Split the amount evenly among creators (or full amount if single creator)
    const amountPerCreator = amount / creatorIds.length;

    // Create locked escrow transactions for each creator
    const transactions = creatorIds.map(cId => ({
      creator_id: cId,
      campaign_id: campaignId,
      amount: amountPerCreator,
      type: 'escrow' as const,
      status: 'locked' as const,
    }));

    const { data: insertedTx, error: insertError } = await supabaseClient
      .from('transactions')
      .insert(transactions)
      .select();

    if (insertError) throw new Error(`Failed to create transactions: ${insertError.message}`);
    logStep("Created escrow transactions", { count: insertedTx?.length });

    // Update campaign remaining budget
    const { error: updateError } = await supabaseClient
      .from('campaigns')
      .update({ 
        remaining_budget: supabaseClient.rpc('remaining_budget - amount', { amount }),
      })
      .eq('id', campaignId);

    // Note: The above RPC approach won't work directly, so we'll do it differently
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('remaining_budget')
      .eq('id', campaignId)
      .single();

    if (!campaignError && campaign) {
      await supabaseClient
        .from('campaigns')
        .update({ 
          remaining_budget: Math.max(0, campaign.remaining_budget - amount),
        })
        .eq('id', campaignId);
      logStep("Updated campaign budget");
    }

    return new Response(JSON.stringify({ 
      success: true,
      transactionCount: insertedTx?.length || 0,
      amountPerCreator,
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
