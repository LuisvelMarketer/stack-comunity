import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationPrompt = () => {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('push-notification-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
    
    // Show after a delay
    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('push-notification-dismissed', 'true');
  };

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setDismissed(true);
    }
  };

  if (!isSupported || permission === 'granted' || permission === 'denied' || dismissed || !show) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
      <Card className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">
                Activa las notificaciones
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Recibe alertas de nuevos mensajes, eventos y cuando completes desafíos.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEnable}>
                  Activar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Ahora no
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
