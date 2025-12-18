import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CONNECT-ACCOUNTS] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch all creators from the database
    const { data: creators, error: creatorsError } = await supabaseClient
      .from('creators')
      .select('id, name, handle, user_id');
    
    if (creatorsError) throw new Error(`Failed to fetch creators: ${creatorsError.message}`);
    logStep("Fetched creators from database", { count: creators?.length });

    // Fetch transactions for escrow data
    const { data: transactions, error: txError } = await supabaseClient
      .from('transactions')
      .select('*');
    
    if (txError) throw new Error(`Failed to fetch transactions: ${txError.message}`);
    logStep("Fetched transactions", { count: transactions?.length });

    // Fetch Stripe Connect accounts (Standard or Express accounts)
    const accounts = await stripe.accounts.list({ limit: 100 });
    logStep("Fetched Stripe Connect accounts", { count: accounts.data.length });

    // Map creators with their Stripe accounts and escrow data
    const connectAccounts = creators?.map(creator => {
      // Find matching Stripe account by metadata or email
      const stripeAccount = accounts.data.find((acc: Stripe.Account) => 
        acc.metadata?.creator_id === creator.id ||
        acc.metadata?.lovable_creator === creator.id
      );

      // Calculate escrow amounts from transactions
      const creatorTransactions = transactions?.filter(t => t.creator_id === creator.id) || [];
      const escrowBalance = creatorTransactions
        .filter(t => t.status === 'locked')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const pendingPayout = creatorTransactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalPaid = creatorTransactions
        .filter(t => t.status === 'released')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Find last payout date
      const releasedTx = creatorTransactions
        .filter(t => t.status === 'released')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      const lastPayoutDate = releasedTx.length > 0 ? releasedTx[0].updated_at : null;

      return {
        id: creator.id,
        creatorName: creator.name,
        creatorHandle: creator.handle,
        stripeAccountId: stripeAccount?.id || null,
        status: stripeAccount 
          ? (stripeAccount.charges_enabled && stripeAccount.payouts_enabled 
              ? 'active' 
              : stripeAccount.details_submitted 
                ? 'pending' 
                : 'restricted')
          : 'not_connected',
        escrowBalance,
        pendingPayout,
        totalPaid,
        lastPayoutDate,
        chargesEnabled: stripeAccount?.charges_enabled || false,
        payoutsEnabled: stripeAccount?.payouts_enabled || false,
      };
    }) || [];

    logStep("Mapped connect accounts", { count: connectAccounts.length });

    return new Response(JSON.stringify({ accounts: connectAccounts }), {
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
