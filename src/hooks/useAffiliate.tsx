import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface AffiliateData {
  id: string;
  referral_code: string;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  commission_rate: number;
}

interface Referral {
  id: string;
  referred_user_id: string;
  status: string;
  converted_at: string | null;
  created_at: string;
}

interface Commission {
  id: string;
  amount: number;
  subscription_amount: number;
  status: string;
  created_at: string;
}

export function useAffiliate() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAffiliateData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch affiliate data
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (affiliateError) throw affiliateError;

      if (affiliateData) {
        setAffiliate(affiliateData as unknown as AffiliateData);

        // Fetch referrals
        const { data: referralsData } = await supabase
          .from('referrals')
          .select('*')
          .eq('affiliate_id', affiliateData.id)
          .order('created_at', { ascending: false });

        setReferrals((referralsData || []) as unknown as Referral[]);

        // Fetch commissions
        const { data: commissionsData } = await supabase
          .from('commissions')
          .select('*')
          .eq('affiliate_id', affiliateData.id)
          .order('created_at', { ascending: false });

        setCommissions((commissionsData || []) as unknown as Commission[]);
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAffiliateData();
  }, [fetchAffiliateData]);

  const createAffiliateAccount = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    try {
      // Generate referral code using RPC
      const { data: referralCode, error: codeError } = await supabase
        .rpc('generate_referral_code');

      if (codeError) throw codeError;

      // Create affiliate record
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          referral_code: referralCode
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliate(data as unknown as AffiliateData);
      toast.success('¡Cuenta de afiliado creada!');
    } catch (error: any) {
      console.error('Error creating affiliate account:', error);
      toast.error('Error al crear cuenta de afiliado');
    }
  };

  const getReferralLink = () => {
    if (!affiliate) return null;
    return `${window.location.origin}/auth?ref=${affiliate.referral_code}`;
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    if (link) {
      await navigator.clipboard.writeText(link);
      toast.success('¡Enlace copiado al portapapeles!');
    }
  };

  return {
    affiliate,
    referrals,
    commissions,
    loading,
    isAffiliate: !!affiliate,
    createAffiliateAccount,
    getReferralLink,
    copyReferralLink,
    refetch: fetchAffiliateData
  };
}
