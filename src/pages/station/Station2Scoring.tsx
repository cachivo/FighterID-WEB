import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStrikeCounter } from '@/hooks/useStrikeCounter';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Station2Scoring() {
  const { fightId } = useParams<{ fightId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [fighterName, setFighterName] = useState('Peleador Azul');
  const [flashActive, setFlashActive] = useState(false);

  // Validar sesión
  useEffect(() => {
    const sessionData = localStorage.getItem('station_session');
    if (!sessionData) {
      navigate('/estacion/2');
      return;
    }

    const parsed = JSON.parse(sessionData);
    if (parsed.stationNumber !== 2) {
      navigate(`/estacion/${parsed.stationNumber}/scoring/${fightId}`);
      return;
    }

    setSession(parsed);
  }, [fightId, navigate]);

  const { strikeCount, iag, registerStrike, isConnected, currentRoundId } = useStrikeCounter(
    fightId || '',
    'blue',
    session?.judge_name || 'Juez 2'
  );

  // Obtener info del peleador azul
  useEffect(() => {
    if (!fightId) return;

    const fetchFighter = async () => {
      const { data: fight } = await supabase
        .from('fights')
        .select(`
          fighter_b_id,
          fighter_profiles:fighter_b_id (
            first_name,
            last_name,
            nickname
          )
        `)
        .eq('id', fightId)
        .single();

      if (fight?.fighter_profiles) {
        const fighter = fight.fighter_profiles as any;
        const name = fighter.nickname 
          ? `${fighter.first_name} "${fighter.nickname}" ${fighter.last_name}`
          : `${fighter.first_name} ${fighter.last_name}`;
        setFighterName(name);
      }
    };

    fetchFighter();
  }, [fightId]);

  const handleClick = () => {
    if (!currentRoundId) return;
    
    registerStrike();
    
    // Flash visual
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);

    // Feedback háptico (si está disponible)
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  if (!session || !fightId) {
    return null;
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950',
        'cursor-pointer select-none relative overflow-hidden',
        'transition-all duration-150',
        flashActive && 'bg-blue-500'
      )}
      onClick={handleClick}
    >
      {/* Flash overlay */}
      {flashActive && (
        <div className="absolute inset-0 bg-blue-400 opacity-50 pointer-events-none" />
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-3 h-3 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-yellow-500'
          )} />
          {isConnected ? (
            <Wifi className="w-6 h-6" />
          ) : (
            <WifiOff className="w-6 h-6" />
          )}
        </div>
        
        <div className="text-2xl font-bold">
          🔵 ESTACIÓN 2 - ESQUINA AZUL
        </div>

        <div className="flex items-center gap-2 text-lg">
          {session.judge_name}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-12">
        {/* Nombre del peleador */}
        <div className="text-white text-4xl font-bold mb-8 text-center px-8">
          {fighterName}
        </div>

        {/* Contador principal */}
        <div className="bg-black/40 rounded-3xl p-12 mb-8 backdrop-blur-sm border-4 border-blue-500">
          <div className="text-white text-[12rem] font-mono font-black leading-none text-center">
            {strikeCount}
          </div>
          <div className="text-blue-300 text-3xl font-semibold text-center mt-4">
            GOLPES CONECTADOS
          </div>
        </div>

        {/* IAg Display */}
        <div className="bg-black/30 rounded-2xl px-8 py-4 backdrop-blur-sm border-2 border-blue-400">
          <div className="flex items-center gap-4">
            <Activity className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-blue-300 text-sm font-medium">
                Índice de Agresividad (10s)
              </div>
              <div className="text-white text-5xl font-bold font-mono">
                {iag}
              </div>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        {!currentRoundId ? (
          <div className="mt-12 text-white/60 text-2xl text-center animate-pulse">
            ⏳ Esperando inicio del round...
          </div>
        ) : (
          <div className="mt-12 text-white/60 text-2xl text-center">
            👆 Toca la pantalla para registrar golpes
          </div>
        )}
      </div>
    </div>
  );
}
