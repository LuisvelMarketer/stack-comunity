import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Clock,
  Send,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type LeadStatus = 'new' | 'thinking' | 'not_responding' | 'converted' | 'lost';
type CallStatus = 'scheduled' | 'completed' | 'no_show' | 'rescheduled';
type EmailType = 'thinking' | 'not_responding' | 'last_attempt' | 'welcome';

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  call_date: string | null;
  call_status: CallStatus;
  lead_status: LeadStatus;
  notes: string | null;
  objections: string[] | null;
  pain_points: string[] | null;
  follow_up_count: number;
  last_follow_up_at: string | null;
  next_follow_up_at: string | null;
  converted_at: string | null;
  amount_paid: number | null;
  created_at: string;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'Nuevo', color: 'bg-blue-500', icon: UserPlus },
  thinking: { label: 'Pensando', color: 'bg-yellow-500', icon: AlertCircle },
  not_responding: { label: 'No responde', color: 'bg-orange-500', icon: Clock },
  converted: { label: 'Convertido', color: 'bg-green-500', icon: CheckCircle },
  lost: { label: 'Perdido', color: 'bg-red-500', icon: XCircle },
};

const EMAIL_OPTIONS: { value: EmailType; label: string; description: string }[] = [
  { value: 'thinking', label: 'Lo voy a pensar', description: 'Para leads que dijeron que necesitan tiempo' },
  { value: 'not_responding', label: 'No responde', description: 'Para leads que dejaron de contestar' },
  { value: 'last_attempt', label: 'Último intento', description: 'Mensaje final antes de cerrar el lead' },
  { value: 'welcome', label: 'Bienvenida', description: 'Email de confirmación post-compra' },
];

export const SalesLeadsManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailDialogLead, setEmailDialogLead] = useState<Lead | null>(null);
  const [selectedEmailType, setSelectedEmailType] = useState<EmailType>('thinking');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    call_date: '',
    notes: '',
  });

  // Fetch leads
  const { data: leads, isLoading } = useQuery({
    queryKey: ['sales-leads', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('sales_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('lead_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Fetch email logs for selected lead
  const { data: emailLogs } = useQuery({
    queryKey: ['sales-email-logs', selectedLead?.id],
    queryFn: async () => {
      if (!selectedLead) return [];
      const { data, error } = await supabase
        .from('sales_email_logs')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedLead,
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('sales_leads').insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        call_date: data.call_date || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lead creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el lead');
    },
  });

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Lead> & { id: string }) => {
      const { error } = await supabase
        .from('sales_leads')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lead actualizado');
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar');
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ leadId, emailType }: { leadId: string; emailType: EmailType }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const response = await supabase.functions.invoke('send-sales-email', {
        body: { lead_id: leadId, email_type: emailType },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Email enviado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
      queryClient.invalidateQueries({ queryKey: ['sales-email-logs'] });
      setEmailDialogLead(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al enviar email');
    },
  });

  // Delete lead mutation
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lead eliminado');
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar');
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      call_date: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      toast.error('Nombre y email son requeridos');
      return;
    }
    createLeadMutation.mutate(formData);
  };

  const stats = {
    total: leads?.length || 0,
    new: leads?.filter(l => l.lead_status === 'new').length || 0,
    thinking: leads?.filter(l => l.lead_status === 'thinking').length || 0,
    converted: leads?.filter(l => l.lead_status === 'converted').length || 0,
    lost: leads?.filter(l => l.lead_status === 'lost').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Total Leads</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan-500" />
              <span className="text-2xl font-bold">{stats.new}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Nuevos</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.thinking}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Pensando</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.converted}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Convertidos</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{stats.lost}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Perdidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Leads
              </CardTitle>
              <CardDescription>
                Administra prospectos y envía emails de seguimiento
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Lead</DialogTitle>
                  <DialogDescription>
                    Ingresa los datos del prospecto después de la llamada
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan@ejemplo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+52 123 456 7890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="call_date">Fecha de Llamada</Label>
                    <Input
                      id="call_date"
                      type="datetime-local"
                      value={formData.call_date}
                      onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas de la Llamada</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Objeciones, puntos de dolor, intereses..."
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createLeadMutation.isPending}>
                      {createLeadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Guardar Lead
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <Label>Filtrar por estado:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Nuevos</SelectItem>
                <SelectItem value="thinking">Pensando</SelectItem>
                <SelectItem value="not_responding">No responde</SelectItem>
                <SelectItem value="converted">Convertidos</SelectItem>
                <SelectItem value="lost">Perdidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : leads && leads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Follow-ups</TableHead>
                  <TableHead>Último Contacto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const statusConfig = STATUS_CONFIG[lead.lead_status];
                  const StatusIcon = statusConfig.icon;
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.full_name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <StatusIcon className={`h-3 w-3 ${statusConfig.color.replace('bg-', 'text-')}`} />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.follow_up_count}</TableCell>
                      <TableCell>
                        {lead.last_follow_up_at ? (
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(lead.last_follow_up_at), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEmailDialogLead(lead)}
                            disabled={lead.lead_status === 'converted'}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay leads registrados</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer lead
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={!!emailDialogLead} onOpenChange={() => setEmailDialogLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email de Seguimiento</DialogTitle>
            <DialogDescription>
              Enviando a: {emailDialogLead?.full_name} ({emailDialogLead?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Email</Label>
              <Select value={selectedEmailType} onValueChange={(v) => setSelectedEmailType(v as EmailType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogLead(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (emailDialogLead) {
                  sendEmailMutation.mutate({
                    leadId: emailDialogLead.id,
                    emailType: selectedEmailType,
                  });
                }
              }}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="emails">Historial de Emails</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nombre</Label>
                    <p className="font-medium">{selectedLead.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedLead.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium">{selectedLead.phone || 'No registrado'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <div className="mt-1">
                      <Select
                        value={selectedLead.lead_status}
                        onValueChange={(value) => {
                          updateLeadMutation.mutate({
                            id: selectedLead.id,
                            lead_status: value as LeadStatus,
                          });
                          setSelectedLead({ ...selectedLead, lead_status: value as LeadStatus });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Nuevo</SelectItem>
                          <SelectItem value="thinking">Pensando</SelectItem>
                          <SelectItem value="not_responding">No responde</SelectItem>
                          <SelectItem value="converted">Convertido</SelectItem>
                          <SelectItem value="lost">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {selectedLead.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notas</Label>
                    <p className="mt-1 p-3 bg-muted rounded-md text-sm">{selectedLead.notes}</p>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => deleteLeadMutation.mutate(selectedLead.id)}
                    disabled={deleteLeadMutation.isPending}
                  >
                    {deleteLeadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="emails" className="mt-4">
                {emailLogs && emailLogs.length > 0 ? (
                  <div className="space-y-3">
                    {emailLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{log.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.sent_at), 'dd MMM yyyy HH:mm', { locale: es })}
                          </p>
                        </div>
                        <Badge variant="outline">{log.email_type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No se han enviado emails a este lead</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
