import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { Clock } from 'lucide-react';

interface SessionData {
  session_id: string;
  station_number: number;
  event_id: string;
  event_name: string;
  current_fight_id: string | null;
  judge_name: string;
  logged_in_at: string;
}

export default function StationWaiting() {
  const { stationNumber } = useParams<{ stationNumber: string }>();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('station_session');
    if (!data) {
      navigate(`/estacion${stationNumber}`);
      return;
    }

    try {
      const parsed = JSON.parse(data);
      setSessionData(parsed);
    } catch (err) {
      console.error('Error parseando sesión:', err);
      navigate(`/estacion${stationNumber}`);
    }
  }, [stationNumber, navigate]);

  useEffect(() => {
    if (!sessionData) return;

    // Polling cada 10 segundos para detectar nueva pelea
    const checkForFight = async () => {
      try {
        const { data: fights, error } = await supabase
          .from('fights')
          .select('id, status')
          .eq('event_id', sessionData.event_id)
          .in('status', ['scheduled', 'in_progress'])
          .order('fight_number')
          .limit(1);

        if (error) {
          console.error('Error checking for fights:', error);
          return;
        }

        if (fights && fights.length > 0) {
          const fightId = fights[0].id;
          
          // Actualizar sessionData con el nuevo fight_id
          const updatedSession = { ...sessionData, current_fight_id: fightId };
          localStorage.setItem('station_session', JSON.stringify(updatedSession));
          
          // Redirigir al panel de scoring
          navigate(`/judge/fight/${fightId}`);
        }
      } catch (err) {
        console.error('Error en polling de peleas:', err);
      } finally {
        setIsChecking(false);
      }
    };

    // Check inmediato
    checkForFight();

    // Polling cada 10 segundos
    const interval = setInterval(checkForFight, 10000);

    return () => clearInterval(interval);
  }, [sessionData, navigate]);

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            ⏳ Esperando Pelea
          </CardTitle>
          <CardDescription>
            Estación #{stationNumber} - {sessionData.event_name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              No hay peleas activas en este momento.
            </p>
            <p className="text-sm text-muted-foreground">
              El panel se activará automáticamente cuando comience la siguiente pelea.
            </p>
          </div>

          {isChecking && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4">
                <LoadingSpinner />
              </div>
              <span>Verificando peleas disponibles...</span>
            </div>
          )}

          <div className="pt-4 border-t space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Juez: {sessionData.judge_name}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Conectado: {new Date(sessionData.logged_in_at).toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}