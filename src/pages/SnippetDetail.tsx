import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useSnippet, useSnippets } from '@/hooks/useSnippets';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/UserAvatar';
import { 
  ArrowLeft, 
  Copy, 
  Star, 
  Eye, 
  Code, 
  MessageSquare, 
  FileCode,
  Calendar,
  Check,
  BookOpen
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const typeIcons = {
  code: Code,
  prompt: MessageSquare,
  template: FileCode,
};

const typeLabels = {
  code: 'Código',
  prompt: 'Prompt',
  template: 'Template',
};

const typeColors = {
  code: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  prompt: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  template: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function SnippetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { snippet, loading } = useSnippet(id);
  const { toggleFavorite, favorites, copyToClipboard } = useSnippets();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (snippet) {
      await copyToClipboard(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isFavorite = snippet ? favorites.has(snippet.id) : false;
  const TypeIcon = snippet ? typeIcons[snippet.type] : Code;

  const languageMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    react: 'jsx',
    html: 'html',
    css: 'css',
    sql: 'sql',
    prompt: 'markdown',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>
        <main className="container py-8 max-w-4xl">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Snippet no encontrado</h1>
          <p className="text-muted-foreground mb-4">El recurso que buscas no existe o ha sido eliminado.</p>
          <Button onClick={() => navigate('/library')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la biblioteca
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{snippet.title} | Biblioteca - Skoolify</title>
        <meta name="description" content={snippet.description || `${typeLabels[snippet.type]} - ${snippet.title}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/library')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Biblioteca
              </Button>
            </div>
            <UserMenu showAdminLink />
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-8 max-w-4xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="space-y-2">
                <Badge className={cn('gap-1', typeColors[snippet.type])}>
                  <TypeIcon className="h-3 w-3" />
                  {typeLabels[snippet.type]}
                </Badge>
                <h1 className="text-3xl font-bold">{snippet.title}</h1>
                {snippet.description && (
                  <p className="text-lg text-muted-foreground">{snippet.description}</p>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {snippet.creator && (
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={snippet.creator.avatar_url}
                    fallback={snippet.creator.full_name || 'U'}
                    className="h-6 w-6"
                  />
                  <span>{snippet.creator.full_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(snippet.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{snippet.usage_count} usos</span>
              </div>
            </div>

            {/* Tags */}
            {snippet.tags && snippet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {snippet.language && (
                  <Badge variant="outline">{snippet.language}</Badge>
                )}
                {snippet.category && (
                  <Badge variant="outline">{snippet.category}</Badge>
                )}
                {snippet.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mb-6">
            <Button size="lg" onClick={handleCopy} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-5 w-5" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  Copiar {typeLabels[snippet.type].toLowerCase()}
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => toggleFavorite(snippet.id)}
              className={cn('gap-2', isFavorite && 'text-yellow-500 border-yellow-500/50')}
            >
              <Star className={cn('h-5 w-5', isFavorite && 'fill-current')} />
              {isFavorite ? 'Guardado' : 'Guardar'}
            </Button>
          </div>

          {/* Code Block */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" />
                {snippet.language || 'Código'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-lg overflow-hidden">
                <SyntaxHighlighter
                  language={languageMap[snippet.language || 'javascript'] || 'javascript'}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.7',
                    borderRadius: 0,
                  }}
                  showLineNumbers
                  wrapLines
                  wrapLongLines
                >
                  {snippet.content}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
