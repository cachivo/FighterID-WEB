import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DesktopJudgePanel } from '@/components/judge/DesktopJudgePanel';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface StationSession {
  session_id: string;
  station_number: number;
  event_id: string;
  event_name: string;
  current_fight_id: string | null;
  judge_name: string;
  logged_in_at: string;
}

interface ScoringRound {
  id: string;
  fight_id: string;
  number: number;
  starts_at?: string;
  status: string;
  duration_seconds: number;
}

export default function JudgeScoringPanel() {
  const { fightId } = useParams<{ fightId: string }>();
  const navigate = useNavigate();
  const [round, setRound] = useState<ScoringRound | null>(null);
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [fightData, setFightData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stationNumber, setStationNumber] = useState<number | null>(null);
  const [sessionData, setSessionData] = useState<StationSession | null>(null);

  // VALIDACIÓN DE SESIÓN DE ESTACIÓN
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
        navigate(`/estacion${session.station_number}`);
        return;
      }

      setSessionData(session);
      setStationNumber(session.station_number);
      
      // Generar un ID temporal para este juez (basado en sesión)
      setJudgeId(`station-${session.session_id}`);
      
    } catch (err) {
      console.error('Error parseando sesión:', err);
      navigate('/access-denied');
    }
  }, [navigate]);

  useEffect(() => {
    if (!fightId || !sessionData) return;

    const loadData = async () => {
      try {

        // Cargar datos de la pelea
        const { data: fight } = await supabase
          .from('fights')
          .select(`
            id,
            fighter_a_id,
            fighter_b_id,
            red_fighter:fighter_a_id(first_name, last_name, nickname, avatar_url),
            blue_fighter:fighter_b_id(first_name, last_name, nickname, avatar_url)
          `)
          .eq('id', fightId)
          .single();

        if (fight) setFightData(fight);

        const roundQuery = await supabase
          .from('fight_rounds')
          .select('id, fight_id, number, starts_at, status, duration_seconds')
          .eq('fight_id', fightId)
          .eq('status', 'live')
          .limit(1);

        if (roundQuery.data && roundQuery.data.length > 0) {
          setRound(roundQuery.data[0] as ScoringRound);
        } else {
          const round1Query = await supabase
            .from('fight_rounds')
            .select('id, fight_id, number, starts_at, status, duration_seconds')
            .eq('fight_id', fightId)
            .eq('number', 1)
            .limit(1);

          if (round1Query.data && round1Query.data.length > 0) {
            setRound(round1Query.data[0] as ScoringRound);
          } else {
            toast.error('No hay round disponible para esta pelea');
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar datos de la pelea');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fightId, sessionData]);

  // TRACKING DE PRESENCIA EN TIEMPO REAL - BASADO EN SESIÓN DE ESTACIÓN
  useEffect(() => {
    if (!fightId || !sessionData) return;

    const setupPresence = async () => {
      try {
        console.log('[PRESENCE] Configurando presencia para estación:', sessionData.station_number);

        const presenceChannel = supabase.channel(`station_presence:${sessionData.event_id}`, {
          config: { presence: { key: sessionData.session_id } }
        });

        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            console.log('[PRESENCE] Estado sincronizado');
          })
          .on('presence', { event: 'join' }, ({ key }) => {
            console.log('[PRESENCE] Usuario se unió:', key);
          })
          .on('presence', { event: 'leave' }, ({ key }) => {
            console.log('[PRESENCE] Usuario salió:', key);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              console.log('[PRESENCE] Suscrito, anunciando presencia...');
              
              await presenceChannel.track({
                session_id: sessionData.session_id,
                station_number: sessionData.station_number,
                judge_name: sessionData.judge_name,
                connected_at: new Date().toISOString(),
                fight_id: fightId,
              });

              console.log('[PRESENCE] Presencia anunciada');
            }
          });

        return () => {
          console.log('[PRESENCE] Limpiando presencia y registrando desconexión');
          
          // Registrar desconexión en el log
          updateDisconnectTime(sessionData.session_id);
          
          presenceChannel.untrack();
          supabase.removeChannel(presenceChannel);
        };
      } catch (error) {
        console.error('[PRESENCE] Error en setup:', error);
      }
    };

    const cleanup = setupPresence();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [fightId, sessionData]);

  const updateDisconnectTime = async (sessionId: string) => {
    try {
      // Buscar último acceso exitoso sin desconexión registrada
      const { data: lastAccess } = await supabase
        .from('station_access_log')
        .select('id')
        .eq('session_id', sessionId)
        .eq('success', true)
        .is('disconnected_at', null)
        .order('accessed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastAccess) {
        await supabase
          .from('station_access_log')
          .update({ disconnected_at: new Date().toISOString() })
          .eq('id', lastAccess.id);
        
        console.log('[PRESENCE] Desconexión registrada');
      }
    } catch (error) {
      console.error('[PRESENCE] Error registrando desconexión:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!round || !judgeId || !fightData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">No se puede cargar el panel</h1>
          <p className="text-muted-foreground">Verifica que la pelea exista y que estés asignado como juez.</p>
        </div>
      </div>
    );
  }

  const redFighterName = fightData.red_fighter 
    ? `${fightData.red_fighter.first_name} ${fightData.red_fighter.last_name}` 
    : 'Peleador Rojo';
  
  const blueFighterName = fightData.blue_fighter 
    ? `${fightData.blue_fighter.first_name} ${fightData.blue_fighter.last_name}` 
    : 'Peleador Azul';

  return (
    <DesktopJudgePanel
      roundId={round.id}
      fightId={fightId!}
      judgeId={judgeId}
      redFighter={{ name: redFighterName, avatar: fightData.red_fighter?.avatar_url }}
      blueFighter={{ name: blueFighterName, avatar: fightData.blue_fighter?.avatar_url }}
      startsAt={round.starts_at}
    />
  );
}
