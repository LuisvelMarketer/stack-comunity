-- Create affiliates table for tracking referral codes
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  pending_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00, -- 20% default commission
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table for tracking who referred whom
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, converted, expired
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commissions table for tracking earnings
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, paid
  subscription_amount DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliates
CREATE POLICY "Users can view own affiliate data" 
ON public.affiliates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own affiliate account" 
ON public.affiliates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate data" 
ON public.affiliates FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Affiliates can view own referrals" 
ON public.referrals FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE affiliates.id = referrals.affiliate_id 
  AND affiliates.user_id = auth.uid()
));

-- RLS Policies for commissions
CREATE POLICY "Affiliates can view own commissions" 
ON public.commissions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE affiliates.id = commissions.affiliate_id 
  AND affiliates.user_id = auth.uid()
));

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(gen_random_uuid()::text) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE referral_code = code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Trigger to update affiliate stats when referral converts
CREATE OR REPLACE FUNCTION public.update_affiliate_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'converted' AND (OLD.status IS NULL OR OLD.status != 'converted') THEN
    UPDATE affiliates 
    SET total_referrals = total_referrals + 1,
        updated_at = now()
    WHERE id = NEW.affiliate_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_referral_converted
AFTER INSERT OR UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_affiliate_stats();

-- Trigger to update affiliate earnings
CREATE OR REPLACE FUNCTION public.update_affiliate_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE affiliates 
    SET pending_earnings = pending_earnings + NEW.amount,
        updated_at = now()
    WHERE id = NEW.affiliate_id;
  ELSIF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE affiliates 
    SET pending_earnings = pending_earnings - NEW.amount,
        total_earnings = total_earnings + NEW.amount,
        updated_at = now()
    WHERE id = NEW.affiliate_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_commission_change
AFTER INSERT OR UPDATE ON public.commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_affiliate_earnings();

-- Index for faster lookups
CREATE INDEX idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX idx_referrals_referred_user ON public.referrals(referred_user_id);
CREATE INDEX idx_referrals_affiliate ON public.referrals(affiliate_id);