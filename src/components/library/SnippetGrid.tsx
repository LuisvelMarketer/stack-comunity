import { CodeSnippet } from '@/hooks/useSnippets';
import { SnippetCard } from './SnippetCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Code, FileCode, Search } from 'lucide-react';

interface SnippetGridProps {
  snippets: CodeSnippet[];
  loading: boolean;
  favorites: Set<string>;
  onCopy: (snippet: CodeSnippet) => void;
  onToggleFavorite: (id: string) => void;
}

export function SnippetGrid({ snippets, loading, favorites, onCopy, onToggleFavorite }: SnippetGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-40 w-full rounded-t-lg" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (snippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No se encontraron snippets</h3>
        <p className="text-muted-foreground max-w-md">
          Intenta ajustar los filtros o buscar con otros términos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {snippets.map((snippet) => (
        <SnippetCard
          key={snippet.id}
          snippet={snippet}
          onCopy={onCopy}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favorites.has(snippet.id)}
        />
      ))}
    </div>
  );
}
