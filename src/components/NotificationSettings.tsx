import { Bell, BellOff, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationSettings = () => {
  const { isSupported, permission, isSubscribed, requestPermission } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Las notificaciones push no están disponibles en este navegador.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaciones Push
        </CardTitle>
        <CardDescription>
          Recibe alertas en tiempo real sobre nuevos mensajes, eventos y logros.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'granted' ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Notificaciones activadas</p>
              <p className="text-xs text-muted-foreground">
                Recibirás alertas cuando haya novedades importantes.
              </p>
            </div>
          </div>
        ) : permission === 'denied' ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <BellOff className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-sm">Notificaciones bloqueadas</p>
              <p className="text-xs text-muted-foreground">
                Has bloqueado las notificaciones. Puedes habilitarlas desde la configuración de tu navegador.
              </p>
            </div>
          </div>
        ) : (
          <Button onClick={requestPermission} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Activar notificaciones push
          </Button>
        )}

        {permission === 'granted' && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-messages" className="flex flex-col">
                <span>Nuevos mensajes</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Cuando recibes mensajes en comunidades
                </span>
              </Label>
              <Switch id="notify-messages" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-events" className="flex flex-col">
                <span>Eventos próximos</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Recordatorios de eventos y lives
                </span>
              </Label>
              <Switch id="notify-events" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-challenges" className="flex flex-col">
                <span>Desafíos completados</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Cuando completas un desafío semanal
                </span>
              </Label>
              <Switch id="notify-challenges" defaultChecked />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
