import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOlympicTimer } from '@/hooks/useOlympicTimer';
import { useStrikeCounter } from '@/hooks/useStrikeCounter';
import { RoundTimerDisplay } from '@/components/station/RoundTimerDisplay';
import { AggressionButton } from '@/components/station/AggressionButton';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock, CircleDot, Coffee, Timer, CheckCircle } from 'lucide-react';
import { formatRoundTime } from '@/lib/scoring-utils';

export default function Station3RoundControl() {
  const { fightId } = useParams<{ fightId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [fighters, setFighters] = useState<{ red: string; blue: string }>({ red: '', blue: '' });
  const [customDuration, setCustomDuration] = useState(300);

  // Validar sesión
  useEffect(() => {
    const sessionData = localStorage.getItem('station_session');
    if (!sessionData) {
      navigate('/estacion/3');
      return;
    }

    const parsed = JSON.parse(sessionData);
    if (parsed.stationNumber !== 3) {
      navigate(`/estacion/${parsed.stationNumber}/control/${fightId}`);
      return;
    }

    setSession(parsed);
  }, [fightId, navigate]);

  const {
    timeMs,
    isRunning,
    isPaused,
    isRestPeriod,
    restTimeMs,
    currentRound,
    rounds,
    nextRound,
    startRound,
    pauseRound,
    resumeRound,
    endRound,
  } = useOlympicTimer(fightId || '');

  // Hooks para IAg de ambos peleadores (solo lectura)
  const redCounter = useStrikeCounter(fightId || '', 'red', 'system');
  const blueCounter = useStrikeCounter(fightId || '', 'blue', 'system');

  // Obtener nombres de peleadores
  useEffect(() => {
    if (!fightId) return;

    const fetchFighters = async () => {
      const { data: fight } = await supabase
        .from('fights')
        .select(`
          fighter_profiles_red:fighter_a_id (first_name, last_name, nickname),
          fighter_profiles_blue:fighter_b_id (first_name, last_name, nickname)
        `)
        .eq('id', fightId)
        .single();

      if (fight) {
        const red = fight.fighter_profiles_red as any;
        const blue = fight.fighter_profiles_blue as any;

        setFighters({
          red: red?.nickname ? `${red.first_name} "${red.nickname}" ${red.last_name}` : `${red?.first_name} ${red?.last_name}`,
          blue: blue?.nickname ? `${blue.first_name} "${blue.nickname}" ${blue.last_name}` : `${blue?.first_name} ${blue?.last_name}`,
        });
      }
    };

    fetchFighters();
  }, [fightId]);

  const handleStart = () => {
    if (nextRound) {
      startRound(nextRound.id);
    }
  };

  const getRoundStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-green-500 flex items-center gap-1"><Play className="h-3 w-3" /> En Curso</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500 flex items-center gap-1"><Pause className="h-3 w-3" /> Pausado</Badge>;
      case 'ended':
        return <Badge className="bg-gray-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Finalizado</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!session || !fightId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Timer className="h-8 w-8" />
          Control de Rounds - Estación 3
        </h1>
        <p className="text-muted-foreground">Cronómetro oficial • {session.judge_name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Cronómetro */}
        <div className="lg:col-span-2 space-y-6">
          {/* Periodo de descanso */}
          {isRestPeriod && (
            <Card className="border-orange-500 bg-orange-500/10">
              <CardHeader>
                <CardTitle className="text-orange-600 flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Periodo de Descanso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-mono font-bold text-orange-600 text-center">
                  {formatRoundTime(restTimeMs)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cronómetro Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cronómetro del Round</span>
                {currentRound && (
                  <Badge variant="outline" className="text-lg">
                    Round {currentRound.number} de {rounds.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentRound ? (
                <RoundTimerDisplay
                  timeMs={timeMs}
                  durationSeconds={currentRound.duration_seconds}
                  isRunning={isRunning}
                  isPaused={isPaused}
                />
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Selecciona un round para comenzar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controles */}
          <Card>
            <CardHeader>
              <CardTitle>Controles del Round</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                {!isRunning && !isPaused && (
                  <AggressionButton
                    variant="neutral"
                    size="lg"
                    onClick={handleStart}
                    disabled={!nextRound || isRestPeriod}
                    className="flex-1"
                  >
                    <Play className="mr-2 w-5 h-5" />
                    Iniciar Round
                  </AggressionButton>
                )}

                {isRunning && !isPaused && (
                  <AggressionButton
                    variant="neutral"
                    size="lg"
                    onClick={pauseRound}
                    className="flex-1"
                  >
                    <Pause className="mr-2 w-5 h-5" />
                    Pausar
                  </AggressionButton>
                )}

                {isPaused && (
                  <AggressionButton
                    variant="neutral"
                    size="lg"
                    onClick={resumeRound}
                    className="flex-1"
                  >
                    <Play className="mr-2 w-5 h-5" />
                    Reanudar
                  </AggressionButton>
                )}

                {(isRunning || isPaused) && (
                  <AggressionButton
                    variant="neutral"
                    size="lg"
                    onClick={endRound}
                    className="flex-1"
                  >
                    <Square className="mr-2 w-5 h-5" />
                    Finalizar Round
                  </AggressionButton>
                )}
              </div>

              {/* Selector de duración */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium whitespace-nowrap">Duración:</label>
                <Select
                  value={customDuration.toString()}
                  onValueChange={(v) => setCustomDuration(parseInt(v))}
                  disabled={isRunning || isPaused}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="180">3 minutos</SelectItem>
                    <SelectItem value="300">5 minutos</SelectItem>
                    <SelectItem value="420">7 minutos</SelectItem>
                    <SelectItem value="600">10 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Info de Peleadores e IAg */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Pelea</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Peleador Rojo */}
                <div className="bg-red-500/10 border-2 border-red-500 rounded-lg p-4">
                  <div className="text-red-600 font-bold text-lg mb-2 flex items-center gap-2">
                    <CircleDot className="h-5 w-5" />
                    Esquina Roja
                  </div>
                  <div className="font-semibold text-lg mb-3">{fighters.red}</div>
                  <div className="text-sm text-muted-foreground">IAg (10s):</div>
                  <div className="text-3xl font-mono font-bold text-red-600">
                    {redCounter.iag}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Total: {redCounter.strikeCount} golpes
                  </div>
                </div>

                {/* Peleador Azul */}
                <div className="bg-blue-500/10 border-2 border-blue-500 rounded-lg p-4">
                  <div className="text-blue-600 font-bold text-lg mb-2 flex items-center gap-2">
                    <CircleDot className="h-5 w-5" />
                    Esquina Azul
                  </div>
                  <div className="font-semibold text-lg mb-3">{fighters.blue}</div>
                  <div className="text-sm text-muted-foreground">IAg (10s):</div>
                  <div className="text-3xl font-mono font-bold text-blue-600">
                    {blueCounter.iag}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Total: {blueCounter.strikeCount} golpes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Lista de Rounds */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Rounds de la Pelea</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rounds.map((round) => (
                  <div
                    key={round.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      round.id === currentRound?.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Round {round.number}</span>
                      {getRoundStatusBadge(round.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatRoundTime(round.duration_seconds * 1000)}
                    </div>
                    {round.starts_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Inicio: {new Date(round.starts_at).toLocaleTimeString()}
                      </div>
                    )}
                    {round.ends_at && (
                      <div className="text-xs text-muted-foreground">
                        Fin: {new Date(round.ends_at).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
