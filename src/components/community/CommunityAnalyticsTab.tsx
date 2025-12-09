import React from 'react';
import { CommunityAnalytics } from '@/components/analytics/CommunityAnalytics';

interface CommunityAnalyticsTabProps {
  communityId: string;
}

export const CommunityAnalyticsTab: React.FC<CommunityAnalyticsTabProps> = ({ communityId }) => {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Panel de Analytics</h2>
        <p className="text-muted-foreground">Métricas y estadísticas de tu comunidad</p>
      </div>
      <CommunityAnalytics communityId={communityId} />
    </div>
  );
};
