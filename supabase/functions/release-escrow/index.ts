import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RELEASE-ESCROW] ${step}${detailsStr}`);
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
    
    const { creatorId, stripeAccountId, amount } = await req.json();
    logStep("Request body", { creatorId, stripeAccountId, amount });

    if (!creatorId || !stripeAccountId || !amount) {
      throw new Error("Missing required fields: creatorId, stripeAccountId, amount");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    if (!userData.user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: userData.user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Verify the Stripe account exists and is enabled for payouts
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (!account.payouts_enabled) {
      throw new Error("Creator's Stripe account is not enabled for payouts");
    }
    logStep("Verified Stripe account", { accountId: stripeAccountId, payoutsEnabled: account.payouts_enabled });

    // Create a transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: stripeAccountId,
      metadata: {
        creator_id: creatorId,
        type: 'escrow_release',
      },
    });
    logStep("Created transfer", { transferId: transfer.id, amount: transfer.amount });

    // Update pending transactions to released in the database
    const { error: updateError } = await supabaseClient
      .from('transactions')
      .update({ 
        status: 'released',
        updated_at: new Date().toISOString()
      })
      .eq('creator_id', creatorId)
      .eq('status', 'pending');

    if (updateError) {
      logStep("Warning: Failed to update transaction status", { error: updateError.message });
    } else {
      logStep("Updated transaction status to released");
    }

    return new Response(JSON.stringify({ 
      success: true,
      transferId: transfer.id,
      amount: transfer.amount / 100
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
