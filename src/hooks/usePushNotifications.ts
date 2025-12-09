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
      // New notifications
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
      // New community messages
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
      // New achievements unlocked
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          showNotification('🏆 ¡Nuevo logro desbloqueado!', {
            body: 'Has obtenido un nuevo logro. ¡Revisa tu perfil para verlo!',
            tag: 'achievement',
          });
        }
      )
      // Level up via user_level_history
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_level_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const levelUp = payload.new as {
            from_level: number;
            to_level: number;
          };
          
          showNotification('⬆️ ¡Subiste de nivel!', {
            body: `Has pasado del nivel ${levelUp.from_level} al nivel ${levelUp.to_level}. ¡Sigue así!`,
            tag: 'level-up',
          });
        }
      )
      // Live sessions starting
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_sessions',
        },
        (payload) => {
          const session = payload.new as {
            status: string;
            title: string;
          };
          
          if (session.status === 'live') {
            showNotification('🔴 ¡En vivo ahora!', {
              body: `"${session.title}" acaba de comenzar. ¡Únete!`,
              tag: 'live-session',
            });
          }
        }
      )
      // Direct messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        async (payload) => {
          const message = payload.new as {
            sender_id: string;
            content: string;
            conversation_id: string;
          };
          
          if (message.sender_id !== user.id) {
            // Check if this conversation belongs to the user
            const { data: conv } = await supabase
              .from('conversations')
              .select('participant_1, participant_2')
              .eq('id', message.conversation_id)
              .single();
            
            if (conv && (conv.participant_1 === user.id || conv.participant_2 === user.id)) {
              showNotification('💬 Nuevo mensaje directo', {
                body: message.content.substring(0, 100),
                tag: 'dm',
                data: { link: `/messages/${message.conversation_id}` },
              });
            }
          }
        }
      )
      // Project feedback
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_feedback',
        },
        async (payload) => {
          const feedback = payload.new as {
            project_id: string;
            user_id: string;
            content: string;
          };
          
          if (feedback.user_id !== user.id) {
            // Check if user owns this project
            const { data: project } = await supabase
              .from('build_projects')
              .select('user_id, title')
              .eq('id', feedback.project_id)
              .single();
            
            if (project && project.user_id === user.id) {
              showNotification('📝 Nuevo feedback en tu proyecto', {
                body: `"${project.title}": ${feedback.content.substring(0, 80)}...`,
                tag: 'feedback',
                data: { link: `/project/${feedback.project_id}` },
              });
            }
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
