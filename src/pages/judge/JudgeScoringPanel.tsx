import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DesktopJudgePanel } from '@/components/judge/DesktopJudgePanel';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

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
  const [round, setRound] = useState<ScoringRound | null>(null);
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [fightData, setFightData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!fightId) return;

    const loadData = async () => {
      try {
        // Obtener usuario actual y su judge_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('No autenticado');
          return;
        }

        // Obtener judge_id del usuario actual usando email
        const judgeQuery = await supabase
          .from('judges')
          .select('id')
          .eq('email', user.email)
          .limit(1);

        if (!judgeQuery.data || judgeQuery.data.length === 0) {
          toast.error('No tienes perfil de juez');
          return;
        }

        const currentJudgeId = judgeQuery.data[0].id;
        setJudgeId(currentJudgeId);

        // Verificar asignación a esta pelea
        const assignmentQuery = await supabase
          .from('fight_officials')
          .select('id')
          .eq('fight_id', fightId)
          .eq('official_id', currentJudgeId)
          .limit(1);

        if (!assignmentQuery.data || assignmentQuery.data.length === 0) {
          toast.error('No estás asignado a esta pelea');
          return;
        }

        // Obtener datos de la pelea
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

        // Obtener round activo
        const roundQuery = await supabase
          .from('fight_rounds')
          .select('id, fight_id, number, starts_at, status, duration_seconds')
          .eq('fight_id', fightId)
          .eq('status', 'live')
          .limit(1);

        if (roundQuery.data && roundQuery.data.length > 0) {
          setRound(roundQuery.data[0] as ScoringRound);
        } else {
          // Buscar round 1 como fallback
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
  }, [fightId]);

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
