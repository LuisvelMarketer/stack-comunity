import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bug, 
  Lightbulb, 
  Palette,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  X
} from 'lucide-react';

interface FeedbackFiltersProps {
  statusFilter: string;
  categoryFilter: string;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  feedbackCount: number;
  filteredCount: number;
}

const categories = [
  { value: 'all', label: 'Todas', icon: Filter },
  { value: 'bug', label: 'Bugs', icon: Bug },
  { value: 'improvement', label: 'Mejoras', icon: Lightbulb },
  { value: 'design', label: 'Diseño', icon: Palette },
  { value: 'general', label: 'General', icon: MessageSquare },
];

const statuses = [
  { value: 'all', label: 'Todos', icon: Filter },
  { value: 'open', label: 'Abiertos', icon: AlertCircle, color: 'text-red-500' },
  { value: 'in_progress', label: 'En progreso', icon: Clock, color: 'text-yellow-500' },
  { value: 'resolved', label: 'Resueltos', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'wont_fix', label: 'No se hará', icon: XCircle, color: 'text-muted-foreground' },
];

export function FeedbackFilters({
  statusFilter,
  categoryFilter,
  onStatusChange,
  onCategoryChange,
  onClearFilters,
  feedbackCount,
  filteredCount,
}: FeedbackFiltersProps) {
  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => {
              const Icon = status.icon;
              return (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${status.color || ''}`} />
                    {status.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="h-9 gap-1"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}

        {/* Results count */}
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredCount === feedbackCount ? (
            `${feedbackCount} tickets`
          ) : (
            `${filteredCount} de ${feedbackCount} tickets`
          )}
        </span>
      </div>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {categoryFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {categories.find(c => c.value === categoryFilter)?.label}
              <button onClick={() => onCategoryChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {statuses.find(s => s.value === statusFilter)?.label}
              <button onClick={() => onStatusChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
