-- Create update function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create waitlist table for free and priority signups
CREATE TABLE public.waitlist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_priority BOOLEAN NOT NULL DEFAULT false,
    stripe_customer_id TEXT,
    stripe_payment_intent_id TEXT,
    referral_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
    referred_by TEXT,
    referral_count INTEGER NOT NULL DEFAULT 0,
    waitlist_position INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for public waitlist signup)
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
WITH CHECK (true);

-- Users can view their own entry by email (for referral tracking)
CREATE POLICY "Anyone can read waitlist entries"
ON public.waitlist
FOR SELECT
USING (true);

-- Function to get waitlist position (priority users get positions 1-50)
CREATE OR REPLACE FUNCTION public.calculate_waitlist_position(waitlist_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    entry_record RECORD;
    position INTEGER;
BEGIN
    SELECT * INTO entry_record FROM public.waitlist WHERE id = waitlist_id;
    
    IF entry_record.is_priority THEN
        -- Priority users get positions 1-50
        SELECT COUNT(*) + 1 INTO position 
        FROM public.waitlist 
        WHERE is_priority = true AND created_at < entry_record.created_at;
        RETURN LEAST(position, 50);
    ELSE
        -- Free users get positions after priority users
        SELECT COUNT(*) + 51 INTO position 
        FROM public.waitlist 
        WHERE is_priority = false AND created_at < entry_record.created_at;
        RETURN position;
    END IF;
END;
$$;

-- Create index for faster queries
CREATE INDEX idx_waitlist_is_priority ON public.waitlist(is_priority DESC, created_at ASC);
CREATE INDEX idx_waitlist_referral_code ON public.waitlist(referral_code);
CREATE INDEX idx_waitlist_email ON public.waitlist(email);

-- Add trigger for updated_at
CREATE TRIGGER update_waitlist_updated_at
BEFORE UPDATE ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();