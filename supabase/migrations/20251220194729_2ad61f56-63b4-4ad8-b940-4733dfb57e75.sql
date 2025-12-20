-- Create tracking_codes table for unique codes per influencer per campaign
CREATE TABLE public.tracking_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL UNIQUE,
  discount_percent numeric DEFAULT 0,
  tracking_url text,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue_generated numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, creator_id)
);

-- Create tracking_events table for individual events
CREATE TABLE public.tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code_id uuid REFERENCES public.tracking_codes(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('click', 'conversion', 'refund')),
  amount numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracking_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracking_codes
CREATE POLICY "Agencies can manage their campaign tracking codes"
ON public.tracking_codes FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.campaigns 
  WHERE campaigns.id = tracking_codes.campaign_id 
  AND campaigns.agency_user_id = auth.uid()
));

CREATE POLICY "Creators can view their own tracking codes"
ON public.tracking_codes FOR SELECT
USING (creator_id = public.get_creator_id(auth.uid()));

-- RLS Policies for tracking_events
CREATE POLICY "Agencies can view their campaign tracking events"
ON public.tracking_events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.tracking_codes tc
  JOIN public.campaigns c ON c.id = tc.campaign_id
  WHERE tc.id = tracking_events.tracking_code_id
  AND c.agency_user_id = auth.uid()
));

CREATE POLICY "Creators can view their own tracking events"
ON public.tracking_events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.tracking_codes tc
  WHERE tc.id = tracking_events.tracking_code_id
  AND tc.creator_id = public.get_creator_id(auth.uid())
));

CREATE POLICY "Public can insert tracking events"
ON public.tracking_events FOR INSERT
WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_events;

-- Create indexes for performance
CREATE INDEX idx_tracking_codes_campaign ON public.tracking_codes(campaign_id);
CREATE INDEX idx_tracking_codes_creator ON public.tracking_codes(creator_id);
CREATE INDEX idx_tracking_events_code ON public.tracking_events(tracking_code_id);
CREATE INDEX idx_tracking_events_created ON public.tracking_events(created_at DESC);

-- Trigger to update tracking_codes stats on new events
CREATE OR REPLACE FUNCTION public.update_tracking_code_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'click' THEN
    UPDATE public.tracking_codes 
    SET clicks = clicks + 1, updated_at = now()
    WHERE id = NEW.tracking_code_id;
  ELSIF NEW.event_type = 'conversion' THEN
    UPDATE public.tracking_codes 
    SET conversions = conversions + 1, 
        revenue_generated = revenue_generated + COALESCE(NEW.amount, 0),
        updated_at = now()
    WHERE id = NEW.tracking_code_id;
  ELSIF NEW.event_type = 'refund' THEN
    UPDATE public.tracking_codes 
    SET conversions = conversions - 1, 
        revenue_generated = revenue_generated - COALESCE(NEW.amount, 0),
        updated_at = now()
    WHERE id = NEW.tracking_code_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_tracking_event_insert
AFTER INSERT ON public.tracking_events
FOR EACH ROW EXECUTE FUNCTION public.update_tracking_code_stats();