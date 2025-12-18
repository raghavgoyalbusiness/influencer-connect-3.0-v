import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WAITLIST-SIGNUP] ${step}${detailsStr}`);
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
    
    const { email, isPriority, stripeCustomerId, stripePaymentIntentId, referredBy } = await req.json();
    logStep("Request body", { email, isPriority, referredBy });

    if (!email) {
      throw new Error("Email is required");
    }

    // Check if email already exists
    const { data: existing } = await supabaseClient
      .from('waitlist')
      .select('id, email, is_priority, referral_code')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      // If already exists and trying to upgrade to priority
      if (isPriority && !existing.is_priority) {
        const { data: updated, error: updateError } = await supabaseClient
          .from('waitlist')
          .update({
            is_priority: true,
            stripe_customer_id: stripeCustomerId,
            stripe_payment_intent_id: stripePaymentIntentId,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;
        logStep("Upgraded existing entry to priority", { id: updated.id });
        return new Response(JSON.stringify({ 
          success: true, 
          entry: updated,
          upgraded: true 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("Email already exists", { id: existing.id });
      return new Response(JSON.stringify({ 
        success: true, 
        entry: existing,
        alreadyExists: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create new waitlist entry
    const { data: newEntry, error: insertError } = await supabaseClient
      .from('waitlist')
      .insert({
        email,
        is_priority: isPriority || false,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_intent_id: stripePaymentIntentId,
        referred_by: referredBy,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    logStep("Created new waitlist entry", { id: newEntry.id });

    // If referred, increment referrer's count
    if (referredBy) {
      const { error: referralError } = await supabaseClient
        .from('waitlist')
        .update({ referral_count: supabaseClient.rpc('referral_count + 1') })
        .eq('referral_code', referredBy);
      
      // Alternative: use raw increment
      await supabaseClient.rpc('increment_referral_count', { ref_code: referredBy });
      logStep("Incremented referral count", { referralCode: referredBy });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      entry: newEntry,
      isNew: true 
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
