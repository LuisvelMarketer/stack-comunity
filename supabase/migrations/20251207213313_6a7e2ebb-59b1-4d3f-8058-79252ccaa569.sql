-- Add pricing fields to communities table
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS price_monthly INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- Create community subscriptions table to track paid memberships
CREATE TABLE public.community_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, community_id)
);

-- Enable RLS on community_subscriptions
ALTER TABLE public.community_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own community subscriptions"
ON public.community_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Community owners can view subscriptions for their communities
CREATE POLICY "Owners can view community subscriptions"
ON public.community_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_subscriptions.community_id
    AND cm.user_id = auth.uid()
    AND cm.is_owner = true
  )
);

-- Service role can manage subscriptions (for edge functions)
CREATE POLICY "Service role can manage community subscriptions"
ON public.community_subscriptions
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_community_subscriptions_updated_at
BEFORE UPDATE ON public.community_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();