import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { UserMenu } from '@/components/UserMenu';
import { SnippetFilters } from '@/components/library/SnippetFilters';
import { SnippetGrid } from '@/components/library/SnippetGrid';
import { SnippetEditor } from '@/components/library/SnippetEditor';
import { useSnippets, SnippetFilters as Filters } from '@/hooks/useSnippets';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Code, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

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

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2">
                <img 
                  src="/images/codigo-cero-logo.png" 
                  alt="Codigo Cero" 
                  className="h-8 w-auto"
                />
              </Link>
              <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">Biblioteca</span>
              </div>
            </div>
            <UserMenu showAdminLink />
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-8">
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
        </main>
      </div>
    </>
  );
}
