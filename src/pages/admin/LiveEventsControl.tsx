import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Eye, Play, Pause, Square, Users, Clock, Trophy, Activity, Settings, Zap, TrendingUp, Target, Monitor } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useFights } from '@/hooks/useEvents';
import { useFightOfficials, useFightControl } from '@/hooks/useFightControl';
import { useFightRealtime } from '@/hooks/useFightRealtime';
import { useJudges, type Judge } from '@/hooks/useJudges';
import { useToast } from '@/hooks/use-toast';
import { useAIStrikeEvents } from '@/hooks/useAIStrikeEvents';
import { useAIInferenceSessions } from '@/hooks/useAIInferenceSessions';
import { RoundControlPanel } from '@/components/admin/RoundControlPanel';
import { PrepareFightDialog } from '@/components/admin/PrepareFightDialog';
import VisionMetricsPanel from '@/components/admin/VisionMetricsPanel';
import { supabase } from '@/integrations/supabase/client';

// =====================================================================
// FIX C3: Extracted from parent component to prevent remount-on-render.
// Previously these were defined inside LiveEventsControl, which caused
// React to treat them as new component types each render — destroying
// internal state (open dialogs, selected values) every parent update.
// =====================================================================

const AssignOfficialDialog = ({
  role,
  onAssign,
  availableJudges,
}: {
  fightId: string;
  role: string;
  onAssign: (officialId: string, role: string) => void;
  availableJudges: Judge[];
}) => {
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredJudges = availableJudges.filter((judge) =>
    role === 'REFEREE'
      ? judge.specialization.includes('Referee') || judge.specialization.includes('MMA')
      : true
  );

  const handleAssign = () => {
    if (selectedJudgeId) {
      onAssign(selectedJudgeId, role);
      setIsOpen(false);
      setSelectedJudgeId('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full text-xs">
          + Asignar {role === 'REFEREE' ? 'Referee' : 'Juez'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar {role === 'REFEREE' ? 'Referee' : 'Juez'}</DialogTitle>
          <DialogDescription>Selecciona un oficial disponible para esta pelea</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar oficial..." />
            </SelectTrigger>
            <SelectContent>
              {filteredJudges.map((judge) => (
                <SelectItem key={judge.id} value={judge.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {judge.first_name} {judge.last_name}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {judge.certification_level}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={!selectedJudgeId}>
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AIStatsDialog = ({
  fight,
  events,
  stats,
  session,
  currentRound,
}: {
  fight: any;
  events: any[];
  stats: any[];
  session: any;
  currentRound?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statsA = stats.find((s) => s.fighter === 'A') || {
    attempted_count: 0,
    connected_count: 0,
    accuracy: 0,
    last_strike_ms: 0,
  };

  const statsB = stats.find((s) => s.fighter === 'B') || {
    attempted_count: 0,
    connected_count: 0,
    accuracy: 0,
    last_strike_ms: 0,
  };

  const recentEvents = events.slice(0, 10);
  const totalEvents = events.length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="cyber">
          <Activity className="mr-2 h-3 w-3" />
          Live AI Stats
          {totalEvents > 0 && (
            <Badge variant="glow" className="ml-2">
              {totalEvents}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Estadísticas IA en Tiempo Real
          </DialogTitle>
          <DialogDescription>
            Pelea #{fight.fight_number} • {fight.fighter_a_name || 'TBD'} vs {fight.fighter_b_name || 'TBD'}
            {currentRound && ` • Round ${currentRound}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {session && (
            <Card variant="cyber">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Estado</p>
                    <Badge variant={session.status === 'running' ? 'neon' : 'secondary'}>
                      {session.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">FPS Promedio</p>
                    <p className="font-mono font-semibold">{session.avg_fps?.toFixed(1) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Latencia</p>
                    <p className="font-mono font-semibold">{session.avg_latency_ms?.toFixed(0) || 'N/A'}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="neon">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>🔴 {fight.fighter_a_name || 'Fighter A'}</span>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Intentados</span>
                  <span className="font-mono font-semibold">{statsA.attempted_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conectados</span>
                  <span className="font-mono font-semibold text-fighter-success">{statsA.connected_count}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precisión</span>
                  <span className="font-mono font-bold text-primary">{statsA.accuracy}%</span>
                </div>
              </CardContent>
            </Card>

            <Card variant="neon">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>🔵 {fight.fighter_b_name || 'Fighter B'}</span>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Intentados</span>
                  <span className="font-mono font-semibold">{statsB.attempted_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conectados</span>
                  <span className="font-mono font-semibold text-fighter-success">{statsB.connected_count}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precisión</span>
                  <span className="font-mono font-bold text-primary">{statsB.accuracy}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Comparación de Golpes Conectados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Fighter A</span>
                    <span className="font-mono">{statsA.connected_count}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                      style={{
                        width: `${
                          statsA.connected_count > 0
                            ? (statsA.connected_count / Math.max(statsA.connected_count + statsB.connected_count, 1)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Fighter B</span>
                    <span className="font-mono">{statsB.connected_count}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fighter-info to-fighter-info/80 transition-all duration-300"
                      style={{
                        width: `${
                          statsB.connected_count > 0
                            ? (statsB.connected_count / Math.max(statsA.connected_count + statsB.connected_count, 1)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Últimos Eventos Detectados</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {recentEvents.length > 0 ? (
                  <div className="space-y-2">
                    {recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs border-l-2 border-primary/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={event.fighter === 'A' ? 'destructive' : 'default'} className="text-xs">
                            {event.fighter === 'A' ? '🔴' : '🔵'} Fighter {event.fighter}
                          </Badge>
                          <span className="font-medium">
                            {event.event_type === 'strike_connected' ? '✓ Conectado' : '○ Intentado'}
                          </span>
                          {event.strike_type && (
                            <Badge variant="outline" className="text-xs">
                              {event.strike_type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-mono">{(event.confidence * 100).toFixed(0)}%</span>
                          <span className="font-mono">{(event.timestamp_ms / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay eventos detectados aún</p>
                    <p className="text-xs mt-1">El sistema de IA comenzará a detectar golpes cuando la pelea esté activa</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cerrar
          </Button>
          <Button variant="neon" asChild>
            <Link to={`/admin/ai-strike-monitor?fightId=${fight.id}`}>
              <Activity className="mr-2 h-4 w-4" />
              Ver Monitor Completo
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FightCard = ({
  fight,
  availableJudges,
  onView,
}: {
  fight: any;
  availableJudges: Array<{
    id: string;
    first_name: string;
    last_name: string;
    certification_level: string;
    specialization: string[];
  }>;
  onView: (fightId: string) => void;
}) => {
  const { officials, assignOfficial } = useFightOfficials(fight.id);
  const { realtimeData, getFightStatus, getCurrentRound } = useFightRealtime(fight.id);
  const { activeSessions, hasActiveSession } = useAIInferenceSessions(fight.id);
  const { events, stats } = useAIStrikeEvents(fight.id);

  const status = getFightStatus();
  const assignedJudges = officials.filter((o) => o.role.startsWith('JUDGE_'));
  const assignedReferee = officials.find((o) => o.role === 'REFEREE');

  const aiSessionActive = hasActiveSession(fight.id);
  const activeSession = activeSessions.find((s) => s.fight_id === fight.id);
  const currentRound = getCurrentRound();

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE':
        return 'bg-fighter-success text-white';
      case 'PAUSED':
        return 'bg-fighter-warning text-white';
      case 'FINISHED':
        return 'bg-muted text-white';
      default:
        return 'bg-fighter-info text-white';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'ACTIVE':
        return <Play className="h-3 w-3" />;
      case 'PAUSED':
        return <Pause className="h-3 w-3" />;
      case 'FINISHED':
        return <Square className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                #{fight.fight_number}
              </Badge>
              <Badge className={getStatusColor(status)}>
                {getStatusIcon(status)}
                <span className="ml-1">{status}</span>
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            {aiSessionActive && (
              <Badge variant="neon" className="animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                AI Active
              </Badge>
            )}

            <PrepareFightDialog fight={fight} availableJudges={availableJudges} />

            {aiSessionActive && (
              <AIStatsDialog
                fight={fight}
                events={events}
                stats={stats}
                session={activeSession}
                currentRound={currentRound}
              />
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('https://www.fighter-id.org/vision3d', '_blank')}
            >
              <Monitor className="mr-2 h-3 w-3" />
              HUD
            </Button>
            <Button size="sm" variant="outline" onClick={() => onView(fight.id)}>
              <Eye className="mr-2 h-3 w-3" />
              Ver
            </Button>
          </div>
        </div>

        <CardTitle className="text-lg flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {fight.fighter_a_name || 'TBD'}
            <span className="mx-2 text-primary">VS</span>
            {fight.fighter_b_name || 'TBD'}
          </span>
        </CardTitle>

        <CardDescription>
          {fight.weight_class} • {fight.fight_type} •
          {fight.scheduled_time && new Date(fight.scheduled_time).toLocaleTimeString()}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2 flex items-center">
              <Users className="mr-2 h-3 w-3" />
              Jueces ({assignedJudges.length}/3)
            </p>
            <div className="space-y-1">
              {assignedJudges.map((official) => (
                <div key={official.id} className="flex items-center justify-between text-xs">
                  <span>
                    {official.judges?.first_name} {official.judges?.last_name}
                  </span>
                  <Badge variant={official.confirmed ? 'default' : 'secondary'} className="text-xs">
                    {official.confirmed ? 'Confirmado' : 'Pendiente'}
                  </Badge>
                </div>
              ))}
              {assignedJudges.length < 3 && (
                <AssignOfficialDialog
                  fightId={fight.id}
                  role={`JUDGE_${assignedJudges.length + 1}`}
                  onAssign={assignOfficial}
                  availableJudges={availableJudges}
                />
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Referee</p>
            {assignedReferee ? (
              <div className="flex items-center justify-between text-xs">
                <span>
                  {assignedReferee.judges?.first_name} {assignedReferee.judges?.last_name}
                </span>
                <Badge variant={assignedReferee.confirmed ? 'default' : 'secondary'} className="text-xs">
                  {assignedReferee.confirmed ? 'Confirmado' : 'Pendiente'}
                </Badge>
              </div>
            ) : (
              <AssignOfficialDialog
                fightId={fight.id}
                role="REFEREE"
                onAssign={assignOfficial}
                availableJudges={availableJudges}
              />
            )}
          </div>
        </div>

        <RoundControlPanel fightId={fight.id} />

        <VisionMetricsPanel fightId={fight.id} />

        {realtimeData.scorecards.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2 flex items-center">
              <Activity className="mr-2 h-3 w-3" />
              Scoring en Vivo
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              {Array.from({ length: 3 }, (_, i) => {
                const judgeScores = realtimeData.scorecards.filter(
                  (sc) => sc.judge_id === assignedJudges[i]?.judges?.id
                );
                const totalA = judgeScores.reduce((sum, sc) => sum + sc.fighter_a_score, 0);
                const totalB = judgeScores.reduce((sum, sc) => sum + sc.fighter_b_score, 0);

                return (
                  <div key={i} className="text-center p-2 bg-muted rounded">
                    <div className="font-medium">Juez {i + 1}</div>
                    <div className="text-primary">
                      {totalA} - {totalB}
                    </div>
                    <div className="text-muted-foreground">R{judgeScores.length}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function LiveEventsControl() {
  const { events, loading: eventsLoading } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedFight, setSelectedFight] = useState<string>('');

  const liveEvents = events.filter((event) => event.state === 'live' || event.state === 'scheduled');
  const { fights, loading: fightsLoading } = useFights(selectedEvent);
  const { getActiveJudges } = useJudges();
  const availableJudges = getActiveJudges();

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Control de Eventos en Vivo</h1>
        <p className="text-muted-foreground">Monitoreo y control en tiempo real de peleas activas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Seleccionar Evento
            </div>
            {selectedEvent && <DebugEventButton eventId={selectedEvent} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un evento activo..." />
            </SelectTrigger>
            <SelectContent>
              {liveEvents.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{event.name}</span>
                    <Badge variant={event.state === 'live' ? 'default' : 'secondary'} className="ml-2">
                      {event.state === 'live' ? 'EN VIVO' : 'PROGRAMADO'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEvent && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peleas Totales</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fights.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Vivo</CardTitle>
              <Play className="h-4 w-4 text-fighter-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-fighter-success">
                {fights.filter((f) => f.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programadas</CardTitle>
              <Clock className="h-4 w-4 text-fighter-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-fighter-info">
                {fights.filter((f) => f.status === 'scheduled').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
              <Square className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {fights.filter((f) => f.status === 'finished').length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedEvent && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Card de Peleas</h2>

          {fightsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : fights.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fights.map((fight) => (
                <FightCard
                  key={fight.id}
                  fight={fight}
                  availableJudges={availableJudges}
                  onView={setSelectedFight}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay peleas programadas</h3>
                  <p className="text-muted-foreground">Este evento aún no tiene peleas asignadas</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {liveEvents.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay eventos activos</h3>
              <p className="text-muted-foreground mb-4">No hay eventos en vivo o programados en este momento</p>
              <Button onClick={() => (window.location.href = '/admin/eventos-pelea')}>
                Crear Nuevo Evento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const DebugEventButton = ({ eventId }: { eventId: string }) => {
  const { toast } = useToast();

  const diagnose = async () => {
    try {
      const { data: fights, error } = await supabase
        .from('fights')
        .select(
          `
          id,
          fight_number,
          status,
          fighter_a_id,
          fighter_b_id,
          weight_class,
          fight_rounds (
            id,
            number,
            status,
            duration_seconds
          ),
          fight_officials (
            id,
            role,
            confirmed,
            judges (
              first_name,
              last_name
            )
          )
        `
        )
        .eq('event_id', eventId);

      if (error) throw error;

      console.group('🔍 Event Diagnostic Report');
      console.info('Event ID:', eventId);
      console.info('Total Fights:', fights?.length || 0);
      console.table(
        fights?.map((f) => ({
          'Fight #': f.fight_number,
          Status: f.status,
          Weight: f.weight_class,
          Rounds: f.fight_rounds?.length || 0,
          Officials: f.fight_officials?.length || 0,
        }))
      );

      fights?.forEach((f) => {
        if (f.fight_rounds && f.fight_rounds.length > 0) {
          console.info(`Rounds for Fight #${f.fight_number}:`, f.fight_rounds);
        }
      });

      fights?.forEach((f) => {
        if (f.fight_officials && f.fight_officials.length > 0) {
          console.info(`Officials for Fight #${f.fight_number}:`, f.fight_officials);
        }
      });

      console.groupEnd();

      toast({
        title: 'Diagnóstico completado',
        description: `${fights?.length || 0} peleas analizadas. Ver consola para detalles.`,
      });
    } catch (error: any) {
      console.error('Diagnostic error:', error);
      toast({
        title: 'Error en diagnóstico',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={diagnose}>
      <Settings className="mr-2 h-3 w-3" />
      Diagnosticar
    </Button>
  );
};
