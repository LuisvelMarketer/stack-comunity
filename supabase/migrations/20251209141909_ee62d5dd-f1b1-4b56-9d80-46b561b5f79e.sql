-- Table for projects submitted to the incubator
CREATE TABLE public.incubator_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.build_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  pitch TEXT NOT NULL,
  funding_goal NUMERIC NOT NULL DEFAULT 0,
  funding_received NUMERIC NOT NULL DEFAULT 0,
  equity_offered NUMERIC CHECK (equity_offered >= 0 AND equity_offered <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'funded', 'closed')),
  business_model TEXT,
  target_market TEXT,
  revenue_projection TEXT,
  team_size INTEGER DEFAULT 1,
  video_pitch_url TEXT,
  deck_url TEXT,
  featured_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for investor profiles
CREATE TABLE public.investor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bio TEXT,
  investment_range_min NUMERIC DEFAULT 100,
  investment_range_max NUMERIC DEFAULT 5000,
  interests TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  portfolio_companies TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  total_investments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for investment interests/connections
CREATE TABLE public.investment_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incubator_project_id UUID NOT NULL REFERENCES public.incubator_projects(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
  amount NUMERIC,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'in_talks', 'committed', 'invested', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(incubator_project_id, investor_id)
);

-- Enable RLS
ALTER TABLE public.incubator_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incubator_projects
CREATE POLICY "Anyone can view approved incubator projects"
ON public.incubator_projects FOR SELECT
USING (status IN ('approved', 'funded'));

CREATE POLICY "Users can view own incubator projects"
ON public.incubator_projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own incubator projects"
ON public.incubator_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incubator projects"
ON public.incubator_projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending projects"
ON public.incubator_projects FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all incubator projects"
ON public.incubator_projects FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for investor_profiles
CREATE POLICY "Anyone can view investor profiles"
ON public.investor_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can create own investor profile"
ON public.investor_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investor profile"
ON public.investor_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investor profile"
ON public.investor_profiles FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for investment_interests
CREATE POLICY "Project owners can view interests in their projects"
ON public.investment_interests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.incubator_projects ip
  WHERE ip.id = incubator_project_id AND ip.user_id = auth.uid()
));

CREATE POLICY "Investors can view own interests"
ON public.investment_interests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.investor_profiles ivp
  WHERE ivp.id = investor_id AND ivp.user_id = auth.uid()
));

CREATE POLICY "Investors can create interests"
ON public.investment_interests FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.investor_profiles ivp
  WHERE ivp.id = investor_id AND ivp.user_id = auth.uid()
));

CREATE POLICY "Investors can update own interests"
ON public.investment_interests FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.investor_profiles ivp
  WHERE ivp.id = investor_id AND ivp.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_incubator_projects_updated_at
BEFORE UPDATE ON public.incubator_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investor_profiles_updated_at
BEFORE UPDATE ON public.investor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_interests_updated_at
BEFORE UPDATE ON public.investment_interests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for investment interests
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_interests;