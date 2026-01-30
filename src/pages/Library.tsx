import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { SnippetFilters } from '@/components/library/SnippetFilters';
import { SnippetGrid } from '@/components/library/SnippetGrid';
import { SnippetEditor } from '@/components/library/SnippetEditor';
import { useSnippets, SnippetFilters as Filters } from '@/hooks/useSnippets';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { MainLayout } from '@/components/layout/MainLayout';
import { Code, BookOpen } from 'lucide-react';

export default function Library() {
  const [filters, setFilters] = useState<Filters>({ type: 'all' });
  const { snippets, loading, favorites, toggleFavorite, copyToClipboard, createSnippet } = useSnippets(filters);
  const { isAdmin } = useIsAdmin();

  return (
    <>
      <Helmet>
        <title>Biblioteca de Códigos y Prompts | Skoolify</title>
        <meta name="description" content="Explora nuestra biblioteca de snippets de código, prompts de IA y templates listos para usar en tus proyectos." />
      </Helmet>

      <MainLayout showAdminLink={isAdmin}>
        <div className="container py-8">
          {/* Hero Section */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  Biblioteca de Recursos
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Códigos, prompts y templates listos para copiar y usar en tus proyectos
                </p>
              </div>
              
              {isAdmin && (
                <SnippetEditor onSave={createSnippet} />
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <SnippetFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Results count */}
          {!loading && (
            <p className="text-sm text-muted-foreground mb-4">
              {snippets.length} {snippets.length === 1 ? 'recurso encontrado' : 'recursos encontrados'}
            </p>
          )}

          {/* Grid */}
          <SnippetGrid
            snippets={snippets}
            loading={loading}
            favorites={favorites}
            onCopy={copyToClipboard}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      </MainLayout>
    </>
  );
}