import { useState } from 'react';
import { Copy, Users, DollarSign, TrendingUp, Clock, CheckCircle2, Link2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAffiliate } from '@/hooks/useAffiliate';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AffiliateDashboard() {
  const {
    affiliate,
    referrals,
    commissions,
    loading,
    isAffiliate,
    createAffiliateAccount,
    getReferralLink,
    copyReferralLink
  } = useAffiliate();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAffiliate) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-full mb-6">
            <Share2 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Programa de Afiliados</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Gana comisiones del {affiliate?.commission_rate || 20}% por cada nuevo miembro que se suscriba 
            usando tu enlace de referido.
          </p>
          <ul className="text-sm text-left space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Obtén tu enlace único de referido
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Compártelo con tus contactos
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Gana comisiones por cada suscripción
            </li>
          </ul>
          <Button 
            onClick={createAffiliateAccount}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Activar Programa de Afiliados
          </Button>
        </CardContent>
      </Card>
    );
  }

  const referralLink = getReferralLink();

  return (
    <div className="space-y-6">
      {/* Referral Link Card */}
      <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-green-500" />
            Tu Enlace de Referido
          </CardTitle>
          <CardDescription>
            Comparte este enlace para ganar comisiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              value={referralLink || ''} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Código: <span className="font-mono font-bold">{affiliate?.referral_code}</span>
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Referidos</p>
                <p className="text-2xl font-bold">{affiliate?.total_referrals || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ganancias Totales</p>
                <p className="text-2xl font-bold text-green-500">
                  ${(affiliate?.total_earnings || 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendiente</p>
                <p className="text-2xl font-bold text-amber-500">
                  ${(affiliate?.pending_earnings || 0).toFixed(2)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comisión</p>
                <p className="text-2xl font-bold">{affiliate?.commission_rate || 20}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Referrals and Commissions */}
      <Tabs defaultValue="referrals">
        <TabsList>
          <TabsTrigger value="referrals">
            <Users className="h-4 w-4 mr-2" />
            Referidos ({referrals.length})
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <DollarSign className="h-4 w-4 mr-2" />
            Comisiones ({commissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {referrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aún no tienes referidos</p>
                  <p className="text-sm">¡Comparte tu enlace para empezar a ganar!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div 
                      key={referral.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">Usuario referido</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(referral.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                      <Badge variant={referral.status === 'converted' ? 'default' : 'secondary'}>
                        {referral.status === 'converted' ? 'Convertido' : 'Pendiente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {commissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aún no tienes comisiones</p>
                  <p className="text-sm">Las comisiones aparecerán cuando tus referidos se suscriban</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commissions.map((commission) => (
                    <div 
                      key={commission.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-green-500">
                          +${commission.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          De suscripción de ${commission.subscription_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(commission.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                      <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                        {commission.status === 'paid' ? 'Pagado' : 
                         commission.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
