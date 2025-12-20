import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLAIM-CREATOR-PAYOUT] ${step}${detailsStr}`);
};

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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    // Get creator ID for this user
    const { data: creatorIdData, error: creatorIdError } = await supabaseClient
      .rpc("get_creator_id", { _user_id: user.id });

    if (creatorIdError || !creatorIdData) {
      throw new Error("Creator profile not found");
    }
    const creatorId = creatorIdData;
    logStep("Creator found", { creatorId });

    // Get creator wallet
    const { data: wallet, error: walletError } = await supabaseClient
      .from("creator_wallets")
      .select("*")
      .eq("creator_id", creatorId)
      .single();

    if (walletError || !wallet) {
      throw new Error("Wallet not found");
    }

    logStep("Wallet retrieved", { 
      pendingEarnings: wallet.pending_earnings,
      minThreshold: wallet.min_payout_threshold 
    });

    // Check minimum threshold
    if (wallet.pending_earnings < wallet.min_payout_threshold) {
      return new Response(JSON.stringify({ 
        error: `Minimum payout threshold not met. You need at least $${wallet.min_payout_threshold} to claim. Current balance: $${wallet.pending_earnings.toFixed(2)}`,
        current_balance: wallet.pending_earnings,
        min_threshold: wallet.min_payout_threshold
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const payoutAmount = wallet.pending_earnings;
    logStep("Payout amount", { amount: payoutAmount });

    // Create payout request record
    const { data: payoutRequest, error: payoutRequestError } = await supabaseClient
      .from("payout_requests")
      .insert({
        creator_id: creatorId,
        amount: payoutAmount,
        status: "processing"
      })
      .select()
      .single();

    if (payoutRequestError) {
      throw new Error(`Failed to create payout request: ${payoutRequestError.message}`);
    }

    logStep("Payout request created", { requestId: payoutRequest.id });

    // Update wallet status
    await supabaseClient
      .from("creator_wallets")
      .update({ payout_status: "processing" })
      .eq("creator_id", creatorId);

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      // Mark as pending if no Stripe key - can be processed manually
      await supabaseClient
        .from("payout_requests")
        .update({ 
          status: "pending",
          error_message: "Stripe not configured - manual payout required"
        })
        .eq("id", payoutRequest.id);

      return new Response(JSON.stringify({ 
        success: true,
        message: "Payout request submitted. Manual processing required.",
        request_id: payoutRequest.id,
        amount: payoutAmount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if creator has Stripe Connect account
    if (!wallet.stripe_account_id) {
      await supabaseClient
        .from("payout_requests")
        .update({ 
          status: "pending",
          error_message: "No Stripe Connect account linked"
        })
        .eq("id", payoutRequest.id);

      return new Response(JSON.stringify({ 
        success: false,
        message: "Please link your Stripe account to receive payouts",
        request_id: payoutRequest.id,
        requires_stripe_connect: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    try {
      // Create Stripe transfer
      const transfer = await stripe.transfers.create({
        amount: Math.round(payoutAmount * 100), // Convert to cents
        currency: "usd",
        destination: wallet.stripe_account_id,
        description: `InfluencerConnect payout - ${new Date().toISOString().split('T')[0]}`,
      });

      logStep("Stripe transfer created", { transferId: transfer.id });

      // Update payout request with success
      await supabaseClient
        .from("payout_requests")
        .update({ 
          status: "completed",
          stripe_transfer_id: transfer.id,
          processed_at: new Date().toISOString()
        })
        .eq("id", payoutRequest.id);

      // Update wallet - reset pending, add to withdrawn
      await supabaseClient
        .from("creator_wallets")
        .update({ 
          pending_earnings: 0,
          total_withdrawn: wallet.total_withdrawn + payoutAmount,
          payout_status: "completed",
          last_payout_at: new Date().toISOString()
        })
        .eq("creator_id", creatorId);

      logStep("Payout completed successfully");

      return new Response(JSON.stringify({ 
        success: true,
        message: `Successfully transferred $${payoutAmount.toFixed(2)} to your account`,
        transfer_id: transfer.id,
        amount: payoutAmount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (stripeError: any) {
      logStep("Stripe error", { error: stripeError.message });

      await supabaseClient
        .from("payout_requests")
        .update({ 
          status: "failed",
          error_message: stripeError.message
        })
        .eq("id", payoutRequest.id);

      await supabaseClient
        .from("creator_wallets")
        .update({ payout_status: "failed" })
        .eq("creator_id", creatorId);

      return new Response(JSON.stringify({ 
        success: false,
        error: `Stripe transfer failed: ${stripeError.message}`,
        request_id: payoutRequest.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
