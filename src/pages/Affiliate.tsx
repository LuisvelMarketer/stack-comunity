import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AffiliateDashboard } from '@/components/affiliate/AffiliateDashboard';

export default function Affiliate() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Programa de Afiliados</h1>
          <p className="text-muted-foreground">
            Gana comisiones invitando nuevos miembros a la plataforma
          </p>
        </div>

        <AffiliateDashboard />
      </div>
    </div>
  );
}
