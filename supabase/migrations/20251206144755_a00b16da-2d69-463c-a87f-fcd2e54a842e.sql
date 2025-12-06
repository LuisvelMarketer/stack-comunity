-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'paused');

-- Create membership tiers table
CREATE TABLE public.membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly integer NOT NULL DEFAULT 0, -- in cents
  price_yearly integer, -- in cents (optional yearly pricing)
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  stripe_product_id text,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id uuid REFERENCES public.membership_tiers(id),
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  status subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create payment history table
CREATE TABLE public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.user_subscriptions(id),
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  amount integer NOT NULL, -- in cents
  currency text DEFAULT 'usd',
  status text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for membership_tiers (public read, admin write)
CREATE POLICY "Anyone can view active tiers"
  ON public.membership_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage tiers"
  ON public.membership_tiers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for payment_history
CREATE POLICY "Users can view own payments"
  ON public.payment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.payment_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_membership_tiers_updated_at
  BEFORE UPDATE ON public.membership_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;