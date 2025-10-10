import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Eye, Play, Pause, Square, Users, Clock, Trophy, Activity, Settings } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useFights } from '@/hooks/useEvents';
import { useFightOfficials, useFightControl } from '@/hooks/useFightControl';
import { useFightRealtime } from '@/hooks/useFightRealtime';
import { useJudges } from '@/hooks/useJudges';
import { useToast } from '@/hooks/use-toast';
import { RoundControlPanel } from '@/components/admin/RoundControlPanel';
import { PrepareFightDialog } from '@/components/admin/PrepareFightDialog';
import { supabase } from '@/integrations/supabase/client';

export default function LiveEventsControl() {
  const { events, loading: eventsLoading } = useEvents();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedFight, setSelectedFight] = useState<string>('');
  
  const liveEvents = events.filter(event => event.state === 'live' || event.state === 'scheduled');
  const { fights, loading: fightsLoading } = useFights(selectedEvent);
  const { judges, getActiveJudges } = useJudges();

  const FightCard = ({ fight }: { fight: any }) => {
    const { officials, assignOfficial, removeOfficial } = useFightOfficials(fight.id);
    const { realtimeData, getFightStatus } = useFightRealtime(fight.id);
    
    const status = getFightStatus();
    const assignedJudges = officials.filter(o => o.role.startsWith('JUDGE_'));
    const assignedReferee = officials.find(o => o.role === 'REFEREE');
    
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ACTIVE': return 'bg-green-500 text-white';
        case 'PAUSED': return 'bg-yellow-500 text-white';
        case 'FINISHED': return 'bg-gray-500 text-white';
        default: return 'bg-blue-500 text-white';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'ACTIVE': return <Play className="h-3 w-3" />;
        case 'PAUSED': return <Pause className="h-3 w-3" />;
        case 'FINISHED': return <Square className="h-3 w-3" />;
        default: return <Clock className="h-3 w-3" />;
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
              <PrepareFightDialog 
                fight={fight} 
                availableJudges={getActiveJudges()} 
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedFight(fight.id)}
              >
                <Eye className="mr-2 h-3 w-3" />
                Ver
              </Button>
            </div>
          </div>

          <CardTitle className="text-lg flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {fight.fighterA?.first_name} {fight.fighterA?.last_name} 
              <span className="mx-2 text-primary">VS</span> 
              {fight.fighterB?.first_name} {fight.fighterB?.last_name}
            </span>
          </CardTitle>
          
          <CardDescription>
            {fight.weight_class} • {fight.fight_type} • 
            {fight.scheduled_time && new Date(fight.scheduled_time).toLocaleTimeString()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Officials Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2 flex items-center">
                <Users className="mr-2 h-3 w-3" />
                Jueces ({assignedJudges.length}/3)
              </p>
              <div className="space-y-1">
                {assignedJudges.map((official, index) => (
                  <div key={official.id} className="flex items-center justify-between text-xs">
                    <span>{official.judges?.first_name} {official.judges?.last_name}</span>
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
                  />
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Referee</p>
              {assignedReferee ? (
                <div className="flex items-center justify-between text-xs">
                  <span>{assignedReferee.judges?.first_name} {assignedReferee.judges?.last_name}</span>
                  <Badge variant={assignedReferee.confirmed ? 'default' : 'secondary'} className="text-xs">
                    {assignedReferee.confirmed ? 'Confirmado' : 'Pendiente'}
                  </Badge>
                </div>
              ) : (
                <AssignOfficialDialog 
                  fightId={fight.id} 
                  role="REFEREE"
                  onAssign={assignOfficial}
                />
              )}
            </div>
          </div>

          {/* Round Control Panel */}
          <RoundControlPanel fightId={fight.id} />

          {/* Real-time Stats */}
          {realtimeData.scorecards.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2 flex items-center">
                <Activity className="mr-2 h-3 w-3" />
                Scoring en Vivo
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {Array.from({length: 3}, (_, i) => {
                  const judgeScores = realtimeData.scorecards.filter(sc => sc.judge_id === assignedJudges[i]?.judges?.id);
                  const totalA = judgeScores.reduce((sum, sc) => sum + sc.fighter_a_score, 0);
                  const totalB = judgeScores.reduce((sum, sc) => sum + sc.fighter_b_score, 0);
                  
                  return (
                    <div key={i} className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">Juez {i + 1}</div>
                      <div className="text-primary">{totalA} - {totalB}</div>
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

  const AssignOfficialDialog = ({ fightId, role, onAssign }: { 
    fightId: string; 
    role: string; 
    onAssign: (officialId: string, role: string) => void; 
  }) => {
    const [selectedJudgeId, setSelectedJudgeId] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    
    const availableJudges = getActiveJudges().filter(judge => 
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
            <DialogDescription>
              Selecciona un oficial disponible para esta pelea
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar oficial..." />
              </SelectTrigger>
              <SelectContent>
                {availableJudges.map(judge => (
                  <SelectItem key={judge.id} value={judge.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{judge.first_name} {judge.last_name}</span>
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Control de Eventos en Vivo</h1>
        <p className="text-muted-foreground">
          Monitoreo y control en tiempo real de peleas activas
        </p>
      </div>

      {/* Event Selection */}
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
              {liveEvents.map(event => (
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

      {/* Event Stats */}
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
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {fights.filter(f => f.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programadas</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {fights.filter(f => f.status === 'scheduled').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
              <Square className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {fights.filter(f => f.status === 'finished').length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fights List */}
      {selectedEvent && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Card de Peleas</h2>
          
          {fightsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : fights.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fights.map(fight => (
                <FightCard key={fight.id} fight={fight} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay peleas programadas</h3>
                  <p className="text-muted-foreground">
                    Este evento aún no tiene peleas asignadas
                  </p>
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
              <p className="text-muted-foreground mb-4">
                No hay eventos en vivo o programados en este momento
              </p>
              <Button onClick={() => window.location.href = '/admin/eventos-pelea'}>
                Crear Nuevo Evento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente de debugging para diagnosticar eventos
const DebugEventButton = ({ eventId }: { eventId: string }) => {
  const { toast } = useToast();
  
  const diagnose = async () => {
    try {
      const { data: fights, error } = await supabase
        .from('fights')
        .select(`
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
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      console.group('🔍 Event Diagnostic Report');
      console.log('Event ID:', eventId);
      console.log('Total Fights:', fights?.length || 0);
      console.table(
        fights?.map(f => ({
          'Fight #': f.fight_number,
          'Status': f.status,
          'Weight': f.weight_class,
          'Rounds': f.fight_rounds?.length || 0,
          'Officials': f.fight_officials?.length || 0
        }))
      );
      
      // Detalles de rounds
      fights?.forEach(f => {
        if (f.fight_rounds && f.fight_rounds.length > 0) {
          console.log(`\nRounds for Fight #${f.fight_number}:`, f.fight_rounds);
        }
      });

      // Detalles de officials
      fights?.forEach(f => {
        if (f.fight_officials && f.fight_officials.length > 0) {
          console.log(`\nOfficials for Fight #${f.fight_number}:`, f.fight_officials);
        }
      });
      
      console.groupEnd();

      toast({
        title: '✅ Diagnóstico completado',
        description: `${fights?.length || 0} peleas analizadas. Ver consola para detalles.`
      });
    } catch (error: any) {
      console.error('Diagnostic error:', error);
      toast({
        title: 'Error en diagnóstico',
        description: error.message,
        variant: 'destructive'
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