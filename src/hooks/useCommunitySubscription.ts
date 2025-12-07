import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CommunitySubscriptionState {
  isSubscribed: boolean;
  isFree: boolean;
  loading: boolean;
  error: string | null;
}

export const useCommunitySubscription = (communityId: string | undefined) => {
  const { user } = useAuth();
  const [state, setState] = useState<CommunitySubscriptionState>({
    isSubscribed: false,
    isFree: true,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user || !communityId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.functions.invoke('check-community-subscription', {
        body: { community_id: communityId }
      });

      if (error) throw error;

      setState({
        isSubscribed: data.subscribed,
        isFree: data.is_free,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error checking community subscription:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, [user, communityId]);

  const subscribe = async () => {
    if (!user || !communityId) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-community-checkout', {
        body: { community_id: communityId }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    ...state,
    subscribe,
    checkSubscription,
  };
};
