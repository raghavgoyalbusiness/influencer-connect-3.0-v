import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-EVENT] ${step}${detailsStr}`);
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

    const { code, event_type, amount, metadata } = await req.json();

    if (!code || !event_type) {
      throw new Error("Missing code or event_type");
    }

    if (!['click', 'conversion', 'refund'].includes(event_type)) {
      throw new Error("Invalid event_type. Must be 'click', 'conversion', or 'refund'");
    }

    logStep("Request params", { code, event_type, amount });

    // Find tracking code
    const { data: trackingCode, error: codeError } = await supabaseClient
      .from("tracking_codes")
      .select("id, is_active, campaign_id, creator_id")
      .eq("code", code)
      .single();

    if (codeError || !trackingCode) {
      throw new Error("Tracking code not found");
    }

    if (!trackingCode.is_active) {
      throw new Error("Tracking code is inactive");
    }

    logStep("Tracking code found", { id: trackingCode.id });

    // Get IP and user agent for analytics
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                      req.headers.get("x-real-ip") || 
                      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Insert tracking event
    const { data: event, error: eventError } = await supabaseClient
      .from("tracking_events")
      .insert({
        tracking_code_id: trackingCode.id,
        event_type,
        amount: amount || 0,
        metadata: metadata || {},
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (eventError) {
      throw new Error(`Failed to record event: ${eventError.message}`);
    }

    logStep("Event recorded", { eventId: event.id, event_type });

    // If it's a conversion, potentially trigger payout logic
    if (event_type === 'conversion' && amount > 0) {
      logStep("Conversion recorded - payout trigger available", { 
        creatorId: trackingCode.creator_id,
        campaignId: trackingCode.campaign_id,
        amount
      });
      // Future: Auto-release escrow based on conversion
    }

    return new Response(JSON.stringify({ 
      success: true,
      event_id: event.id,
      message: `${event_type} event recorded successfully`
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
