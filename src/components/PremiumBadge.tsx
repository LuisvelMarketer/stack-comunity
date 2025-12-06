import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 ${className}`}
    >
      <Crown className="h-3 w-3 mr-1" />
      Premium
    </Badge>
  );
}
