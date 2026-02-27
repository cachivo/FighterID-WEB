import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { Clock } from 'lucide-react';
import type { StationSession } from '@/types/station';

export default function StationWaiting() {
  const { stationNumber } = useParams<{ stationNumber: string }>();
  const [sessionData, setSessionData] = useState<StationSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('station_session');
    if (!data) {
      navigate(`/estacion/${stationNumber}`);
      return;
    }

    try {
      const parsed: StationSession = JSON.parse(data);
      setSessionData(parsed);
    } catch (err) {
      console.error('Error parseando sesión:', err);
      navigate(`/estacion/${stationNumber}`);
    }
  }, [stationNumber, navigate]);

  useEffect(() => {
    if (!sessionData) return;

    // Check inicial para peleas existentes
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
          navigateToFight(fights[0].id);
        }
      } catch (err) {
        console.error('Error en check de peleas:', err);
      } finally {
        setIsChecking(false);
      }
    };

    checkForFight();

    // Realtime subscription en lugar de polling
    const channel = supabase
      .channel(`event-fights:${sessionData.event_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fights',
        filter: `event_id=eq.${sessionData.event_id}`,
      }, (payload) => {
        const newFight = payload.new as any;
        if (newFight && (newFight.status === 'in_progress' || newFight.status === 'scheduled')) {
          navigateToFight(newFight.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionData, navigate]);

  const navigateToFight = (fightId: string) => {
    if (!sessionData) return;
    const updatedSession = { ...sessionData, current_fight_id: fightId };
    localStorage.setItem('station_session', JSON.stringify(updatedSession));
    navigate(`/judge/fight/${fightId}`);
  };

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
