import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Las notificaciones no están soportadas en este navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setIsSubscribed(true);
        toast.success('¡Notificaciones activadas!');
        return true;
      } else if (result === 'denied') {
        toast.error('Has denegado los permisos de notificación');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Error al solicitar permisos de notificación');
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, [permission]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const channel = supabase
      .channel('push-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as {
            title: string;
            content: string;
            link?: string;
            type: string;
          };
          
          showNotification(notification.title, {
            body: notification.content,
            tag: notification.type,
            data: { link: notification.link },
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          const message = payload.new as {
            content: string;
            user_id: string;
            community_id: string;
          };
          
          if (message.user_id !== user.id) {
            showNotification('Nuevo mensaje', {
              body: message.content.substring(0, 100),
              tag: 'message',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification]);

  return {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    showNotification,
  };
};
