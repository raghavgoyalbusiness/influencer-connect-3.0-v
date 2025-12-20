-- Add CPV-related columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN cpv_rate numeric DEFAULT 0,
ADD COLUMN locked_budget numeric DEFAULT 0,
ADD COLUMN is_cpv_campaign boolean DEFAULT false,
ADD COLUMN viral_threshold integer DEFAULT 100000;

-- Create content_performance table for tracking views
CREATE TABLE public.content_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  content_url text,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'twitter')),
  view_count integer DEFAULT 0,
  previous_view_count integer DEFAULT 0,
  is_viral boolean DEFAULT false,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, creator_id, content_url)
);

-- Create creator_wallets table for pending earnings
CREATE TABLE public.creator_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL UNIQUE,
  pending_earnings numeric DEFAULT 0,
  total_earned numeric DEFAULT 0,
  total_withdrawn numeric DEFAULT 0,
  last_payout_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create earnings_history for detailed tracking
CREATE TABLE public.earnings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  content_performance_id uuid REFERENCES public.content_performance(id) ON DELETE CASCADE,
  views_earned integer NOT NULL,
  amount_earned numeric NOT NULL,
  cpv_rate numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_history ENABLE ROW LEVEL SECURITY;

-- RLS for content_performance
CREATE POLICY "Agencies can manage their campaign content"
ON public.content_performance FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.campaigns 
  WHERE campaigns.id = content_performance.campaign_id 
  AND campaigns.agency_user_id = auth.uid()
));

CREATE POLICY "Creators can view their own content"
ON public.content_performance FOR SELECT
USING (creator_id = public.get_creator_id(auth.uid()));

-- RLS for creator_wallets
CREATE POLICY "Creators can view own wallet"
ON public.creator_wallets FOR SELECT
USING (creator_id = public.get_creator_id(auth.uid()));

CREATE POLICY "System can manage wallets"
ON public.creator_wallets FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.creators c
  JOIN public.campaign_participants cp ON cp.creator_id = c.id
  JOIN public.campaigns camp ON camp.id = cp.campaign_id
  WHERE c.id = creator_wallets.creator_id
  AND camp.agency_user_id = auth.uid()
));

-- RLS for earnings_history
CREATE POLICY "Creators can view own earnings"
ON public.earnings_history FOR SELECT
USING (creator_id = public.get_creator_id(auth.uid()));

CREATE POLICY "Agencies can view campaign earnings"
ON public.earnings_history FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.campaigns 
  WHERE campaigns.id = earnings_history.campaign_id 
  AND campaigns.agency_user_id = auth.uid()
));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_performance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_wallets;

-- Create indexes
CREATE INDEX idx_content_performance_campaign ON public.content_performance(campaign_id);
CREATE INDEX idx_content_performance_creator ON public.content_performance(creator_id);
CREATE INDEX idx_creator_wallets_creator ON public.creator_wallets(creator_id);
CREATE INDEX idx_earnings_history_creator ON public.earnings_history(creator_id);

-- Function to calculate and update earnings
CREATE OR REPLACE FUNCTION public.calculate_cpv_earnings(
  p_content_performance_id uuid,
  p_new_view_count integer
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content content_performance%ROWTYPE;
  v_campaign campaigns%ROWTYPE;
  v_views_delta integer;
  v_earnings numeric;
  v_wallet_id uuid;
BEGIN
  -- Get content performance record
  SELECT * INTO v_content FROM content_performance WHERE id = p_content_performance_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content performance not found';
  END IF;

  -- Get campaign
  SELECT * INTO v_campaign FROM campaigns WHERE id = v_content.campaign_id;
  IF NOT FOUND OR NOT v_campaign.is_cpv_campaign THEN
    RETURN 0;
  END IF;

  -- Calculate views delta
  v_views_delta := p_new_view_count - v_content.previous_view_count;
  IF v_views_delta <= 0 THEN
    RETURN 0;
  END IF;

  -- Calculate earnings (CPV rate is per 1000 views)
  v_earnings := (v_views_delta::numeric / 1000) * v_campaign.cpv_rate;

  -- Check if we have enough locked budget
  IF v_earnings > v_campaign.locked_budget THEN
    v_earnings := v_campaign.locked_budget;
  END IF;

  -- Update content performance
  UPDATE content_performance 
  SET view_count = p_new_view_count,
      previous_view_count = p_new_view_count,
      is_viral = p_new_view_count >= v_campaign.viral_threshold,
      last_synced_at = now(),
      updated_at = now()
  WHERE id = p_content_performance_id;

  -- Update campaign locked budget
  UPDATE campaigns
  SET locked_budget = locked_budget - v_earnings,
      remaining_budget = remaining_budget - v_earnings,
      updated_at = now()
  WHERE id = v_campaign.id;

  -- Ensure wallet exists
  INSERT INTO creator_wallets (creator_id, pending_earnings)
  VALUES (v_content.creator_id, 0)
  ON CONFLICT (creator_id) DO NOTHING;

  -- Update creator wallet
  UPDATE creator_wallets
  SET pending_earnings = pending_earnings + v_earnings,
      total_earned = total_earned + v_earnings,
      updated_at = now()
  WHERE creator_id = v_content.creator_id;

  -- Record earnings history
  INSERT INTO earnings_history (creator_id, campaign_id, content_performance_id, views_earned, amount_earned, cpv_rate)
  VALUES (v_content.creator_id, v_campaign.id, p_content_performance_id, v_views_delta, v_earnings, v_campaign.cpv_rate);

  RETURN v_earnings;
END;
$$;