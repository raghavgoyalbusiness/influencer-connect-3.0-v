import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
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
    
    const { creatorId, creatorEmail, creatorName } = await req.json();
    logStep("Request body", { creatorId, creatorEmail, creatorName });

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

    // Create a Stripe Connect Express account for the creator
    const account = await stripe.accounts.create({
      type: 'express',
      email: creatorEmail,
      metadata: {
        creator_id: creatorId,
        lovable_creator: creatorId,
      },
      business_profile: {
        name: creatorName,
        product_description: 'Creator payouts for influencer marketing campaigns',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    logStep("Created Stripe Connect account", { accountId: account.id });

    // Create an account link for onboarding
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/payments?refresh=true`,
      return_url: `${origin}/payments?success=true`,
      type: 'account_onboarding',
    });
    logStep("Created account onboarding link", { url: accountLink.url });

    return new Response(JSON.stringify({ 
      accountId: account.id,
      onboardingUrl: accountLink.url 
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
