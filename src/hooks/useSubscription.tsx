import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// DEPRECATED: Global premium subscription has been disabled
// Each community now manages its own subscription independently
// Use useCommunitySubscription hook for community-specific subscriptions

// Legacy product configuration - kept for reference only
export const PREMIUM_PRODUCT = {
  product_id: "prod_TZgd1fKmbpcWYM",
  price_id: "price_1ScXGPPj8vjAHltscNz2jo9R",
  name: "Skoolify Premium",
  price: 29.99,
};

interface SubscriptionState {
  isSubscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

// This hook is now deprecated - global subscription is disabled
// Communities are either free or have their own subscription via useCommunitySubscription
export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    productId: null,
    subscriptionEnd: null,
    loading: false, // No loading needed as global subscription is disabled
  });

  // Global subscription check is disabled
  // Always returns not subscribed since we don't have global premium anymore
  const checkSubscription = useCallback(async () => {
    setState({
      isSubscribed: false,
      productId: null,
      subscriptionEnd: null,
      loading: false,
    });
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Deprecated: createCheckout for global subscription
  const createCheckout = async () => {
    throw new Error('La suscripción global ha sido desactivada. Por favor suscríbete a una comunidad específica.');
  };

  // openCustomerPortal still works for managing existing community subscriptions
  const openCustomerPortal = async () => {
    const { session } = useAuth();
    if (!session?.access_token) {
      throw new Error('Debes iniciar sesión');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  return {
    ...state,
    isPremium: false, // Always false since global subscription is disabled
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
