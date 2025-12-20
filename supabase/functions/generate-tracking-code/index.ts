import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-TRACKING-CODE] ${step}${detailsStr}`);
};

// Generate a unique, memorable coupon code
function generateCouponCode(creatorHandle: string, campaignName: string): string {
  const handlePart = creatorHandle.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${handlePart}${randomPart}`;
}

// Generate a tracking URL
function generateTrackingUrl(baseUrl: string, code: string): string {
  return `${baseUrl}/track/${code}`;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    const { campaign_id, creator_id, discount_percent = 0 } = await req.json();

    if (!campaign_id || !creator_id) {
      throw new Error("Missing campaign_id or creator_id");
    }

    logStep("Request params", { campaign_id, creator_id, discount_percent });

    // Verify user owns this campaign
    const { data: campaign, error: campaignError } = await supabaseClient
      .from("campaigns")
      .select("id, name, agency_user_id")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.agency_user_id !== user.id) {
      throw new Error("Not authorized to manage this campaign");
    }

    logStep("Campaign verified", { campaignName: campaign.name });

    // Get creator info
    const { data: creator, error: creatorError } = await supabaseClient
      .from("creators")
      .select("id, handle, name")
      .eq("id", creator_id)
      .single();

    if (creatorError || !creator) {
      throw new Error("Creator not found");
    }

    logStep("Creator found", { handle: creator.handle });

    // Check if tracking code already exists
    const { data: existingCode } = await supabaseClient
      .from("tracking_codes")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("creator_id", creator_id)
      .single();

    if (existingCode) {
      logStep("Returning existing tracking code", { code: existingCode.code });
      return new Response(JSON.stringify({ 
        tracking_code: existingCode,
        message: "Existing tracking code returned"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Generate unique code
    let code = generateCouponCode(creator.handle, campaign.name);
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code is unique
    while (attempts < maxAttempts) {
      const { data: existingByCode } = await supabaseClient
        .from("tracking_codes")
        .select("id")
        .eq("code", code)
        .single();

      if (!existingByCode) break;
      
      code = generateCouponCode(creator.handle, campaign.name);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Could not generate unique code");
    }

    const origin = req.headers.get("origin") || Deno.env.get("SUPABASE_URL");
    const trackingUrl = generateTrackingUrl(origin || "", code);

    logStep("Generated code", { code, trackingUrl });

    // Insert tracking code
    const { data: newCode, error: insertError } = await supabaseClient
      .from("tracking_codes")
      .insert({
        campaign_id,
        creator_id,
        code,
        discount_percent,
        tracking_url: trackingUrl,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create tracking code: ${insertError.message}`);
    }

    logStep("Tracking code created", { id: newCode.id });

    return new Response(JSON.stringify({ 
      tracking_code: newCode,
      message: "Tracking code generated successfully"
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
