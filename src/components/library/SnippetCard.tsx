import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Star, Eye, Code, MessageSquare, FileCode } from 'lucide-react';
import { CodeSnippet } from '@/hooks/useSnippets';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNavigate } from 'react-router-dom';

interface SnippetCardProps {
  snippet: CodeSnippet;
  onCopy: (snippet: CodeSnippet) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite?: boolean;
}

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

export function SnippetCard({ snippet, onCopy, onToggleFavorite, isFavorite }: SnippetCardProps) {
  const navigate = useNavigate();
  const TypeIcon = typeIcons[snippet.type];
  
  const previewContent = snippet.content.slice(0, 200);
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

  return (
    <Card 
      className="group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 overflow-hidden bg-card/50 backdrop-blur-sm"
      onClick={() => navigate(`/library/${snippet.id}`)}
    >
      {/* Preview del código */}
      <div className="relative h-40 overflow-hidden bg-muted/30 border-b border-border/50">
        <div className="absolute inset-0 p-3 text-xs">
          <SyntaxHighlighter
            language={languageMap[snippet.language || 'javascript'] || 'javascript'}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '0.5rem',
              background: 'transparent',
              fontSize: '0.65rem',
              lineHeight: '1.4',
              height: '100%',
              overflow: 'hidden',
            }}
            wrapLines={true}
            wrapLongLines={true}
          >
            {previewContent}
          </SyntaxHighlighter>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        
        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <Badge className={cn('gap-1', typeColors[snippet.type])}>
            <TypeIcon className="h-3 w-3" />
            {typeLabels[snippet.type]}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title and description */}
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {snippet.title}
          </h3>
          {snippet.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {snippet.description}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {snippet.language && (
            <Badge variant="outline" className="text-xs">
              {snippet.language}
            </Badge>
          )}
          {snippet.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {snippet.tags && snippet.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{snippet.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Eye className="h-4 w-4" />
          <span>{snippet.usage_count || 0}</span>
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(snippet.id)}
            className={cn(
              'h-8 w-8 p-0',
              isFavorite && 'text-yellow-500 hover:text-yellow-600'
            )}
          >
            <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onCopy(snippet)}
            className="h-8 gap-1"
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
