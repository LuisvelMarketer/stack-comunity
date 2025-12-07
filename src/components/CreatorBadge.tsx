import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CreatorBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

const iconSizes = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function CreatorBadge({ className = '', size = 'md' }: CreatorBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white border-0 font-semibold shadow-lg shadow-purple-500/25 animate-pulse",
        sizeClasses[size],
        className
      )}
    >
      <Sparkles className={cn(iconSizes[size], "mr-1")} />
      Creador
    </Badge>
  );
}
