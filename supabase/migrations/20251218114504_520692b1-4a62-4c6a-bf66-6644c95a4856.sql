-- Create portfolio_settings table
CREATE TABLE public.portfolio_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  headline TEXT,
  summary TEXT,
  contact_email TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  website_url TEXT,
  show_projects BOOLEAN DEFAULT true,
  show_certificates BOOLEAN DEFAULT true,
  show_achievements BOOLEAN DEFAULT true,
  featured_projects UUID[] DEFAULT '{}',
  theme TEXT DEFAULT 'default',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on slug for faster lookups
CREATE INDEX idx_portfolio_settings_slug ON public.portfolio_settings(slug);

-- Enable RLS
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own portfolio settings
CREATE POLICY "Users can view own portfolio settings"
ON public.portfolio_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own portfolio settings
CREATE POLICY "Users can create own portfolio settings"
ON public.portfolio_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own portfolio settings
CREATE POLICY "Users can update own portfolio settings"
ON public.portfolio_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own portfolio settings
CREATE POLICY "Users can delete own portfolio settings"
ON public.portfolio_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Anyone can view public portfolios by slug
CREATE POLICY "Anyone can view public portfolios"
ON public.portfolio_settings
FOR SELECT
USING (is_public = true);

-- Trigger for updated_at
CREATE TRIGGER update_portfolio_settings_updated_at
BEFORE UPDATE ON public.portfolio_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();