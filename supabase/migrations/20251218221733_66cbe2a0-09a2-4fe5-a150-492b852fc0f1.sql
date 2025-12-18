-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('agency', 'creator');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign status enum
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'optimizing', 'scaling', 'halted', 'completed');

-- Campaigns table
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    remaining_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    status campaign_status NOT NULL DEFAULT 'draft',
    vibe_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Creators table
CREATE TABLE public.creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    niche TEXT,
    aesthetic_score DECIMAL(3,2) DEFAULT 0.50,
    base_rate DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Participant status enum
CREATE TYPE public.participant_status AS ENUM ('pending', 'active', 'paused', 'completed');

-- Campaign participants table
CREATE TABLE public.campaign_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
    status participant_status NOT NULL DEFAULT 'pending',
    escrow_amount DECIMAL(12,2) DEFAULT 0,
    current_engagement_rate DECIMAL(5,2) DEFAULT 0,
    real_time_sales_lift DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(campaign_id, creator_id)
);

-- AI logs table
CREATE TABLE public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    action_taken TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transaction types and status enums
CREATE TYPE public.transaction_type AS ENUM ('escrow', 'bonus', 'payout');
CREATE TYPE public.transaction_status AS ENUM ('locked', 'pending', 'released');

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type transaction_type NOT NULL,
    status transaction_status NOT NULL DEFAULT 'locked',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Get user's creator id
CREATE OR REPLACE FUNCTION public.get_creator_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.creators WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Campaigns policies
CREATE POLICY "Agencies can view own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = agency_user_id);
CREATE POLICY "Agencies can create campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = agency_user_id AND public.has_role(auth.uid(), 'agency'));
CREATE POLICY "Agencies can update own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = agency_user_id);
CREATE POLICY "Agencies can delete own campaigns" ON public.campaigns FOR DELETE USING (auth.uid() = agency_user_id);

-- Creators policies (creators can view themselves, agencies can view all)
CREATE POLICY "Anyone authenticated can view creators" ON public.creators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can update own record" ON public.creators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Creators can insert own record" ON public.creators FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Campaign participants policies
CREATE POLICY "Agencies can view their campaign participants" ON public.campaign_participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND agency_user_id = auth.uid())
);
CREATE POLICY "Creators can view their participations" ON public.campaign_participants FOR SELECT USING (
    creator_id = public.get_creator_id(auth.uid())
);
CREATE POLICY "Agencies can manage participants" ON public.campaign_participants FOR ALL USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND agency_user_id = auth.uid())
);

-- AI logs policies
CREATE POLICY "Agencies can view their campaign logs" ON public.ai_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND agency_user_id = auth.uid())
);
CREATE POLICY "System can insert logs" ON public.ai_logs FOR INSERT WITH CHECK (true);

-- Transactions policies
CREATE POLICY "Creators can view own transactions" ON public.transactions FOR SELECT USING (
    creator_id = public.get_creator_id(auth.uid())
);
CREATE POLICY "Agencies can view campaign transactions" ON public.transactions FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE agency_user_id = auth.uid())
);

-- Trigger for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for ai_logs and campaign_participants
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_participants;