-- Create campaign_rewards table for rate/threshold configuration
CREATE TABLE public.campaign_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL UNIQUE,
  rate_per_1k_views numeric NOT NULL DEFAULT 5.00,
  budget_cap numeric NOT NULL DEFAULT 10000,
  min_view_threshold integer NOT NULL DEFAULT 1000,
  min_payout_threshold numeric NOT NULL DEFAULT 50.00,
  bonus_rate_viral numeric DEFAULT 10.00,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add min_payout_threshold and payout tracking to creator_wallets
ALTER TABLE public.creator_wallets
ADD COLUMN IF NOT EXISTS min_payout_threshold numeric DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS stripe_account_id text;

-- Create payout_requests table for tracking claim requests
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_transfer_id text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create sales_events table for tracking live sales
CREATE TABLE public.sales_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code_id uuid REFERENCES public.tracking_codes(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  order_id text,
  customer_email text,
  sale_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  product_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_events ENABLE ROW LEVEL SECURITY;

-- RLS for campaign_rewards
CREATE POLICY "Agencies can manage their campaign rewards"
ON public.campaign_rewards FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.campaigns 
  WHERE campaigns.id = campaign_rewards.campaign_id 
  AND campaigns.agency_user_id = auth.uid()
));

CREATE POLICY "Creators can view campaign rewards they participate in"
ON public.campaign_rewards FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.campaign_participants cp
  WHERE cp.campaign_id = campaign_rewards.campaign_id
  AND cp.creator_id = public.get_creator_id(auth.uid())
));

-- RLS for payout_requests
CREATE POLICY "Creators can view own payout requests"
ON public.payout_requests FOR SELECT
USING (creator_id = public.get_creator_id(auth.uid()));

CREATE POLICY "Creators can create payout requests"
ON public.payout_requests FOR INSERT
WITH CHECK (creator_id = public.get_creator_id(auth.uid()));

CREATE POLICY "Agencies can view payouts for their campaigns"
ON public.payout_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.creators c
  JOIN public.campaign_participants cp ON cp.creator_id = c.id
  JOIN public.campaigns camp ON camp.id = cp.campaign_id
  WHERE c.id = payout_requests.creator_id
  AND camp.agency_user_id = auth.uid()
));

-- RLS for sales_events
CREATE POLICY "Agencies can view their campaign sales"
ON public.sales_events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.campaigns 
  WHERE campaigns.id = sales_events.campaign_id 
  AND campaigns.agency_user_id = auth.uid()
));

CREATE POLICY "Creators can view own sales"
ON public.sales_events FOR SELECT
USING (creator_id = public.get_creator_id(auth.uid()));

CREATE POLICY "Public can insert sales events"
ON public.sales_events FOR INSERT
WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_requests;

-- Indexes
CREATE INDEX idx_campaign_rewards_campaign ON public.campaign_rewards(campaign_id);
CREATE INDEX idx_payout_requests_creator ON public.payout_requests(creator_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status);
CREATE INDEX idx_sales_events_campaign ON public.sales_events(campaign_id);
CREATE INDEX idx_sales_events_creator ON public.sales_events(creator_id);
CREATE INDEX idx_sales_events_created ON public.sales_events(created_at DESC);