import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useSnippet, useSnippets } from '@/hooks/useSnippets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/UserAvatar';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  ArrowLeft, 
  Copy, 
  Star, 
  Eye, 
  Code, 
  MessageSquare, 
  FileCode,
  Calendar,
  Check
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
      <MainLayout>
        <div className="container py-8 max-w-4xl">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!snippet) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Snippet no encontrado</h1>
            <p className="text-muted-foreground mb-4">El recurso que buscas no existe o ha sido eliminado.</p>
            <Button onClick={() => navigate('/library')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la biblioteca
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <Helmet>
         <title>{snippet.title} | Biblioteca - STACK</title>
        <meta name="description" content={snippet.description || `${typeLabels[snippet.type]} - ${snippet.title}`} />
      </Helmet>

      <MainLayout>
        <div className="container py-8 max-w-4xl">
          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => navigate('/library')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Biblioteca
          </Button>

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
            <Button onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            <Button
              variant={isFavorite ? "secondary" : "outline"}
              onClick={() => toggleFavorite(snippet.id)}
              className="gap-2"
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-yellow-400 text-yellow-400")} />
              {isFavorite ? 'Guardado' : 'Guardar'}
            </Button>
          </div>

          {/* Code Block */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <SyntaxHighlighter
                  language={languageMap[snippet.language || snippet.type] || 'text'}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    padding: '1.5rem',
                  }}
                  showLineNumbers={snippet.type === 'code'}
                  wrapLines
                  wrapLongLines
                >
                  {snippet.content}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </>
  );
}
