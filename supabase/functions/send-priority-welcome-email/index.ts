import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-priority-welcome-email function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName }: WelcomeEmailRequest = await req.json();
    console.log("Sending welcome email to:", email);

    const displayName = firstName || "Founding Member";

    const emailResponse = await resend.emails.send({
      from: "Influencer Connect AI <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to the 1% | Your Influencer Connect AI Priority Access",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: #fafafa;
    }
    .container {
      background: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    h1 {
      color: #6366f1;
      font-size: 24px;
      margin-bottom: 24px;
    }
    .highlight {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 700;
    }
    .section {
      margin: 24px 0;
      padding: 20px;
      background: #f8f9ff;
      border-radius: 8px;
      border-left: 4px solid #6366f1;
    }
    .section-title {
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 8px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .signature {
      margin-top: 24px;
    }
    .signature-name {
      font-weight: 700;
      color: #1a1a1a;
    }
    .signature-title {
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <p style="font-size: 18px; margin-bottom: 24px;">Hi ${displayName},</p>
    
    <h1><span class="highlight">Success.</span> You've officially skipped the queue.</h1>
    
    <p>While 5,000+ others are waiting for the public rollout, you've secured your spot as a <strong>Founding Member</strong> of Influencer Connect AI. We've verified your payment and updated your status to <strong>Priority Access</strong>.</p>
    
    <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 16px;">Here's what happens next:</h2>
    
    <div class="section">
      <div class="section-title">🚀 Skip the Line</div>
      <p style="margin: 0;">You are now in the first group being onboarded. You'll receive your login credentials <strong>2 weeks before</strong> the general public.</p>
    </div>
    
    <div class="section">
      <div class="section-title">💎 The "Founding Member" Credit</div>
      <p style="margin: 0;">Your $49 has been converted into <strong>3 months of Influencer Connect Pro</strong> (valued at $147). This will be automatically applied to your account at launch.</p>
    </div>
    
    <div class="section">
      <div class="section-title">🎯 Direct Access</div>
      <p style="margin: 0;">As a Founder, you have a direct line to our product team. We'll be reaching out shortly to schedule your <strong>1-on-1 strategy call</strong>. We want to build Flux around your agency's specific workflow.</p>
    </div>
    
    <div class="section">
      <div class="section-title">🎁 Your Exclusive Bonus</div>
      <p style="margin: 0;">Because we value speed, we've unlocked a <strong>"Vibe-Check" credit</strong> for you early. Reply to this email with your agency's website or a recent campaign mood board, and I'll personally run it through our Claude 3.5 Aesthetic Engine and send you a manual preview of what Flux sees.</p>
    </div>
    
    <p style="margin-top: 32px; font-size: 18px; font-weight: 600;">Welcome to the future of the creator economy. Let's build something massive.</p>
    
    <div class="signature">
      <p class="signature-name">Raghav Goyal</p>
      <p class="signature-title">Founder, Influencer Connect AI</p>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because you purchased Priority Access to Influencer Connect AI.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
