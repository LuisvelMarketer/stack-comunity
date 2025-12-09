import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTypingIndicator = (conversationId: string | undefined) => {
  const { user } = useAuth();
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  // Listen for other user's typing
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setIsOtherUserTyping(false);
            return;
          }
          
          const data = payload.new as { user_id: string; is_typing: boolean };
          if (data.user_id !== user.id) {
            setIsOtherUserTyping(data.is_typing);
            
            // Auto-clear after 5 seconds
            setTimeout(() => {
              setIsOtherUserTyping(false);
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  // Set typing indicator
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!conversationId || !user) return;

    // Throttle typing updates to every 2 seconds
    const now = Date.now();
    if (isTyping && now - lastTypingRef.current < 2000) {
      return;
    }
    lastTypingRef.current = now;

    try {
      if (isTyping) {
        await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: user.id,
            is_typing: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'conversation_id,user_id'
          });

        // Clear typing after 3 seconds of inactivity
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 3000);
      } else {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error updating typing indicator:', error);
    }
  }, [conversationId, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (conversationId && user) {
        supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    };
  }, [conversationId, user]);

  return { isOtherUserTyping, setTyping };
};
