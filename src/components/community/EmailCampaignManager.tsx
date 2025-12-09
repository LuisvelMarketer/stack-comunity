import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mail, Send, Clock, Users, FileText, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface EmailCampaignManagerProps {
  communityId: string;
  communityName: string;
}

type CampaignType = 'welcome' | 'event_reminder' | 'course_update' | 'custom';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: CampaignType;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Bienvenida',
    subject: '¡Bienvenido a {{community_name}}!',
    content: `Hola {{user_name}},

¡Gracias por unirte a {{community_name}}!

Estamos emocionados de tenerte como parte de nuestra comunidad. Aquí encontrarás:
- Cursos exclusivos
- Una comunidad activa
- Eventos y lives en vivo
- Y mucho más

¡Comienza explorando ahora!

Saludos,
El equipo de {{community_name}}`,
    type: 'welcome',
  },
  {
    id: 'event_reminder',
    name: 'Recordatorio de Evento',
    subject: 'Recordatorio: {{event_name}} comienza pronto',
    content: `Hola {{user_name}},

Te recordamos que el evento "{{event_name}}" comenzará pronto.

No te lo pierdas, ¡te esperamos!

Saludos,
El equipo de {{community_name}}`,
    type: 'event_reminder',
  },
  {
    id: 'course_update',
    name: 'Nuevo Contenido',
    subject: 'Nuevo contenido disponible en {{community_name}}',
    content: `Hola {{user_name}},

Hemos añadido nuevo contenido a la comunidad que no querrás perderte.

¡Ingresa ahora y descúbrelo!

Saludos,
El equipo de {{community_name}}`,
    type: 'course_update',
  },
];

export const EmailCampaignManager: React.FC<EmailCampaignManagerProps> = ({
  communityId,
  communityName,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [sending, setSending] = useState(false);

  // Fetch member count for estimation
  const { data: memberStats } = useQuery({
    queryKey: ['email-recipients', communityId, segmentFilter],
    queryFn: async () => {
      let query = supabase
        .from('community_members')
        .select('user_id, joined_at', { count: 'exact' })
        .eq('community_id', communityId);

      if (segmentFilter === 'last_7_days') {
        query = query.gte('joined_at', subDays(new Date(), 7).toISOString());
      } else if (segmentFilter === 'last_30_days') {
        query = query.gte('joined_at', subDays(new Date(), 30).toISOString());
      }

      const { count } = await query;
      return { recipientCount: count || 0 };
    },
  });

  // Fetch email campaigns history (using broadcast_notifications table for simplicity)
  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['email-campaigns', communityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('broadcast_notifications')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(20);

      return data || [];
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject.replace('{{community_name}}', communityName));
      setContent(template.content.replace(/{{community_name}}/g, communityName));
    }
  };

  const handleSendCampaign = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Por favor completa el asunto y contenido del email');
      return;
    }

    setSending(true);

    try {
      // For now, we'll use the broadcast notification system
      // In production, this would connect to an email service like Resend
      const { error } = await supabase
        .from('broadcast_notifications')
        .insert({
          community_id: communityId,
          sender_id: user?.id,
          title: `[Email] ${subject}`,
          content: content,
          recipients_count: memberStats?.recipientCount || 0,
          status: 'sent',
          level_filter: segmentFilter === 'all' ? null : segmentFilter,
        });

      if (error) throw error;

      toast.success(`Campaña enviada a ${memberStats?.recipientCount || 0} miembros`);
      setSubject('');
      setContent('');
      setSelectedTemplate('');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', communityId] });
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar la campaña');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <Mail className="h-4 w-4" />
            Componer
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Nueva Campaña de Email
              </CardTitle>
              <CardDescription>
                Envía emails personalizados a los miembros de tu comunidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plantilla predefinida</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una plantilla (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_TEMPLATES.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Segmentar audiencia</Label>
                  <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los miembros</SelectItem>
                      <SelectItem value="last_7_days">Últimos 7 días</SelectItem>
                      <SelectItem value="last_30_days">Últimos 30 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto del email..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe el contenido del email..."
                  className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  Variables disponibles: {"{{user_name}}"}, {"{{community_name}}"}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    Se enviará a <strong>{memberStats?.recipientCount || 0}</strong> miembros
                  </span>
                </div>
                <Button onClick={handleSendCampaign} disabled={sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Campaña
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Email</CardTitle>
              <CardDescription>
                Plantillas predefinidas para diferentes tipos de campañas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {DEFAULT_TEMPLATES.map((template) => (
                  <Card key={template.id} className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Asunto: {template.subject}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
                        {template.content}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        Usar plantilla
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Campañas</CardTitle>
              <CardDescription>
                Todas las campañas enviadas a tu comunidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : campaigns && campaigns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asunto</TableHead>
                      <TableHead>Destinatarios</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          {campaign.title.replace('[Email] ', '')}
                        </TableCell>
                        <TableCell>{campaign.recipients_count}</TableCell>
                        <TableCell>
                          <Badge
                            variant={campaign.status === 'sent' ? 'default' : 'secondary'}
                          >
                            {campaign.status === 'sent' ? 'Enviado' : campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(campaign.created_at), 'dd MMM yyyy HH:mm', {
                            locale: es,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay campañas enviadas aún</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
