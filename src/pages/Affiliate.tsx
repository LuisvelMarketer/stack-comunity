import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AffiliateDashboard } from '@/components/affiliate/AffiliateDashboard';

export default function Affiliate() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Programa de Afiliados</h1>
          <p className="text-muted-foreground">
            Gana comisiones invitando nuevos miembros a la plataforma
          </p>
        </div>

        <AffiliateDashboard />
      </div>
    </MainLayout>
  );
}