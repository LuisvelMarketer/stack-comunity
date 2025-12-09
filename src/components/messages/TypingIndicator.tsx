import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

export const TypingIndicator = ({ userName, className }: TypingIndicatorProps) => {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <div className="flex items-center gap-1">
        <div className="flex space-x-1">
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
        </div>
      </div>
      <span className="text-xs">
        {userName ? `${userName} está escribiendo...` : 'Escribiendo...'}
      </span>
    </div>
  );
};
