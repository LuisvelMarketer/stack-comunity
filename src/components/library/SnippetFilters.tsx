import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Code, MessageSquare, FileCode, Star, LayoutGrid } from 'lucide-react';
import { SnippetFilters as Filters } from '@/hooks/useSnippets';
import { cn } from '@/lib/utils';

interface SnippetFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const languages = [
  { value: 'all', label: 'Todos los lenguajes' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'react', label: 'React' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'prompt', label: 'Prompts IA' },
];

const categories = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'components', label: 'Componentes' },
  { value: 'hooks', label: 'Hooks' },
  { value: 'utils', label: 'Utilidades' },
  { value: 'api', label: 'API' },
  { value: 'database', label: 'Base de datos' },
  { value: 'auth', label: 'Autenticación' },
  { value: 'ai', label: 'Inteligencia Artificial' },
  { value: 'design', label: 'Diseño' },
];

export function SnippetFilters({ filters, onFiltersChange }: SnippetFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar snippets..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Type tabs */}
      <Tabs
        value={filters.type || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, type: value as Filters['type'] })}
      >
        <TabsList className="w-full grid grid-cols-5 h-auto p-1">
          <TabsTrigger value="all" className="gap-2 py-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Todos</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-2 py-2">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Código</span>
          </TabsTrigger>
          <TabsTrigger value="prompt" className="gap-2 py-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-2 py-2">
            <FileCode className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger 
            value="favorites" 
            className={cn("gap-2 py-2", filters.favoritesOnly && "text-yellow-500")}
            onClick={(e) => {
              e.preventDefault();
              onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly });
            }}
          >
            <Star className={cn("h-4 w-4", filters.favoritesOnly && "fill-current")} />
            <span className="hidden sm:inline">Favoritos</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Additional filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.language || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, language: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lenguaje" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, category: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(filters.search || filters.language || filters.category || filters.favoritesOnly) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({ type: filters.type })}
          >
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
