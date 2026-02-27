import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import type { StationSession } from '@/types/station';

/**
 * JudgeScoringPanel — Mobile-first redirect
 * Valida la sesión de estación y redirige al flujo de scoring móvil.
 */
export default function JudgeScoringPanel() {
  const { fightId } = useParams<{ fightId: string }>();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const sessionStr = localStorage.getItem('station_session');

    if (!sessionStr) {
      toast.error('Sesión no válida. Por favor ingresa el PIN nuevamente.');
      navigate('/access-denied');
      return;
    }

    try {
      const session: StationSession = JSON.parse(sessionStr);

      // Validar que la sesión no sea muy antigua (>24 horas)
      const sessionAge = Date.now() - new Date(session.logged_in_at).getTime();
      if (sessionAge > 24 * 60 * 60 * 1000) {
        toast.error('Sesión expirada');
        localStorage.removeItem('station_session');
        navigate(`/estacion/${session.station_number}`);
        return;
      }

      // Redirigir al flujo de scoring móvil de la estación correspondiente
      navigate(`/estacion/${session.station_number}/scoring/${fightId}`, { replace: true });
    } catch (err) {
      console.error('Error parseando sesión:', err);
      navigate('/access-denied');
    } finally {
      setIsValidating(false);
    }
  }, [navigate, fightId]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return null;
}
