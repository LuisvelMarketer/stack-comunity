import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Target, Plus, Trash2, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeeklyChallengesManagerProps {
  communityId: string;
}

const CHALLENGE_TYPES = [
  { value: 'complete_modules', label: 'Completar módulos' },
  { value: 'send_messages', label: 'Enviar mensajes' },
  { value: 'attend_events', label: 'Asistir a eventos' },
  { value: 'post_content', label: 'Publicar contenido' },
];

export const WeeklyChallengesManager: React.FC<WeeklyChallengesManagerProps> = ({
  communityId,
}) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challenge_type: 'complete_modules',
    target_count: 5,
    points_reward: 100,
    duration_days: 7,
  });

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['weekly-challenges', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: async () => {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = addDays(new Date(), formData.duration_days).toISOString().split('T')[0];

      const { error } = await supabase.from('weekly_challenges').insert({
        community_id: communityId,
        title: formData.title,
        description: formData.description,
        challenge_type: formData.challenge_type,
        target_count: formData.target_count,
        points_reward: formData.points_reward,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Desafío creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['weekly-challenges', communityId] });
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        challenge_type: 'complete_modules',
        target_count: 5,
        points_reward: 100,
        duration_days: 7,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el desafío');
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from('weekly_challenges')
        .delete()
        .eq('id', challengeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Desafío eliminado');
      queryClient.invalidateQueries({ queryKey: ['weekly-challenges', communityId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el desafío');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('weekly_challenges')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-challenges', communityId] });
    },
  });

  const getChallengeTypeLabel = (type: string) => {
    return CHALLENGE_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Desafíos Semanales
            </CardTitle>
            <CardDescription>
              Crea desafíos para motivar a los miembros de tu comunidad
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Desafío
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Desafío</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Completa 5 módulos esta semana"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe el desafío..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de desafío</Label>
                    <Select
                      value={formData.challenge_type}
                      onValueChange={(value) => setFormData({ ...formData, challenge_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHALLENGE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Meta</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.target_count}
                      onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Puntos de recompensa</Label>
                    <Input
                      type="number"
                      min="10"
                      step="10"
                      value={formData.points_reward}
                      onChange={(e) => setFormData({ ...formData, points_reward: parseInt(e.target.value) || 10 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duración (días)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 7 })}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => createChallengeMutation.mutate()}
                  disabled={!formData.title || createChallengeMutation.isPending}
                >
                  {createChallengeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Crear Desafío
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : challenges && challenges.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Meta</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challenges.map((challenge) => {
                const isExpired = new Date(challenge.end_date) < new Date();
                
                return (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">{challenge.title}</TableCell>
                    <TableCell>{getChallengeTypeLabel(challenge.challenge_type)}</TableCell>
                    <TableCell>{challenge.target_count}</TableCell>
                    <TableCell>{challenge.points_reward}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(challenge.start_date), 'dd MMM', { locale: es })} - {format(new Date(challenge.end_date), 'dd MMM', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {isExpired ? (
                        <Badge variant="secondary">Finalizado</Badge>
                      ) : challenge.is_active ? (
                        <Badge variant="default">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Pausado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isExpired && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActiveMutation.mutate({
                              id: challenge.id,
                              is_active: !challenge.is_active,
                            })}
                          >
                            {challenge.is_active ? 'Pausar' : 'Activar'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteChallengeMutation.mutate(challenge.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay desafíos creados aún</p>
            <p className="text-sm">Crea tu primer desafío para motivar a tus miembros</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
