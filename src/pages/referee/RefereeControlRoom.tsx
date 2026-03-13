import { useState, useEffect } from 'react';
import { getWeightClassLabel } from '@/lib/constants/disciplines';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Play, Pause, Square, Clock, Flag, AlertTriangle, Trophy, Timer, Zap } from 'lucide-react';
import { useFightRealtime } from '@/hooks/useFightRealtime';
import { useCurrentJudge } from '@/hooks/useJudges';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function RefereeControlRoom() {
  const { fightId } = useParams<{ fightId: string }>();
  const { toast } = useToast();
  const { currentJudge } = useCurrentJudge();
  const { realtimeData, getCurrentRound, getFightStatus, broadcastControlEvent } = useFightRealtime(fightId!);
  
  const [fight, setFight] = useState<any>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [selectedFighter, setSelectedFighter] = useState<string>('');
  const [roundTimer, setRoundTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (fightId) {
      fetchFightDetails();
    }
  }, [fightId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => {
        setRoundTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const fetchFightDetails = async () => {
    const { data, error } = await supabase
      .from('fights')
      .select(`
        *,
        fighterA:fighter_profiles!fighter_a_id(first_name, last_name, nickname),
        fighterB:fighter_profiles!fighter_b_id(first_name, last_name, nickname),
        event:bdg_event(name, state)
      `)
      .eq('id', fightId)
      .single();
    
    if (error) {
      toast({ title: "Error", description: "No se pudo cargar la pelea", variant: "destructive" });
      return;
    }
    
    setFight(data);
  };

  const sendControlEvent = async (eventType: string, metadata: any = {}) => {
    if (!currentJudge?.id) {
      toast({ title: "Error", description: "No se pudo identificar al referee", variant: "destructive" });
      return;
    }

    try {
      const controlEvent = {
        fight_id: fightId,
        referee_id: currentJudge.id,
        event_type: eventType,
        round_number: getCurrentRound(),
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          round_time: formatTime(roundTimer)
        },
        description: getEventDescription(eventType, metadata),
        reason: actionReason || null,
        fighter_affected: selectedFighter || null
      };

      const { error } = await supabase
        .from('fight_control_events')
        .insert(controlEvent);

      if (error) throw error;

      // Broadcast event
      await broadcastControlEvent(controlEvent);
      
      toast({ 
        title: "Evento registrado", 
        description: getEventDescription(eventType, metadata)
      });

      // Reset form
      setActionReason('');
      setSelectedFighter('');
      setIsActionDialogOpen(false);
      
    } catch (error) {
      console.error('Error sending control event:', error);
      toast({ title: "Error", description: "No se pudo registrar el evento", variant: "destructive" });
    }
  };

  const getEventDescription = (eventType: string, metadata: any) => {
    switch (eventType) {
      case 'ROUND_START': return `Inicio del Round ${getCurrentRound()}`;
      case 'ROUND_END': return `Fin del Round ${getCurrentRound()}`;
      case 'FIGHT_START': return 'Inicio de la pelea';
      case 'FIGHT_PAUSE': return 'Pelea pausada';
      case 'FIGHT_RESUME': return 'Pelea reanudada';
      case 'FIGHT_STOP': return 'Pelea detenida';
      case 'WARNING': return `Advertencia - ${metadata.reason || 'Infracción'}`;
      case 'POINT_DEDUCTION': return `Deducción de punto - ${metadata.reason}`;
      case 'FOUL': return `Falta cometida - ${metadata.reason}`;
      case 'KNOCKDOWN': return 'Knockdown registrado';
      case 'TECHNICAL_ISSUE': return 'Problema técnico reportado';
      default: return eventType;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'START_ROUND':
        setTimerActive(true);
        setRoundTimer(0);
        sendControlEvent('ROUND_START');
        break;
      case 'END_ROUND':
        setTimerActive(false);
        sendControlEvent('ROUND_END');
        break;
      case 'PAUSE_FIGHT':
        setTimerActive(false);
        sendControlEvent('FIGHT_PAUSE');
        break;
      case 'RESUME_FIGHT':
        setTimerActive(true);
        sendControlEvent('FIGHT_RESUME');
        break;
      case 'STOP_FIGHT':
        setTimerActive(false);
        sendControlEvent('FIGHT_STOP');
        break;
      default:
        setSelectedAction(action);
        setIsActionDialogOpen(true);
    }
  };

  const handleDetailedAction = () => {
    const metadata: any = { reason: actionReason };
    if (selectedFighter) {
      metadata.fighter_id = selectedFighter;
    }
    sendControlEvent(selectedAction, metadata);
  };

  if (!currentJudge) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Acceso Denegado</h3>
          <p className="text-muted-foreground">Solo referees autorizados pueden acceder a esta página</p>
        </div>
      </div>
    );
  }

  if (!fight) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const fightStatus = getFightStatus();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Referee Control Room
              </CardTitle>
              <CardDescription>
                {fight.fighterA?.first_name} {fight.fighterA?.last_name} vs {fight.fighterB?.first_name} {fight.fighterB?.last_name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={fightStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                <Clock className="mr-1 h-3 w-3" />
                {fightStatus}
              </Badge>
              <Badge variant="outline" className="text-lg px-4 py-2">
                <Timer className="mr-2 h-4 w-4" />
                {formatTime(roundTimer)}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Fighter Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-fighter-danger">
          <CardHeader>
            <CardTitle className="text-fighter-danger">
              Corner Rojo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {fight.fighterA?.first_name} {fight.fighterA?.last_name}
              </h3>
              {fight.fighterA?.nickname && (
                <p className="text-sm text-muted-foreground">"{fight.fighterA.nickname}"</p>
              )}
              <Badge variant="outline">{getWeightClassLabel(fight.weight_class)}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-fighter-info">
          <CardHeader>
            <CardTitle className="text-fighter-info">
              Corner Azul
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {fight.fighterB?.first_name} {fight.fighterB?.last_name}
              </h3>
              {fight.fighterB?.nickname && (
                <p className="text-sm text-muted-foreground">"{fight.fighterB.nickname}"</p>
              )}
              <Badge variant="outline">{getWeightClassLabel(fight.weight_class)}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Round Control */}
      <Card>
        <CardHeader>
          <CardTitle>Control de Round</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => handleQuickAction('START_ROUND')}
              disabled={timerActive}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Iniciar Round
            </Button>
            
            <Button
              onClick={() => handleQuickAction('END_ROUND')}
              disabled={!timerActive}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Finalizar Round
            </Button>
            
            <Button
              onClick={() => handleQuickAction('PAUSE_FIGHT')}
              disabled={!timerActive}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pausar
            </Button>
            
            <Button
              onClick={() => handleQuickAction('RESUME_FIGHT')}
              disabled={timerActive}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Reanudar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disciplinary Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Disciplinarias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => handleQuickAction('WARNING')}
              variant="outline"
              className="flex items-center gap-2 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
            >
              <Flag className="h-4 w-4" />
              Advertencia
            </Button>
            
            <Button
              onClick={() => handleQuickAction('POINT_DEDUCTION')}
              variant="outline"
              className="flex items-center gap-2 text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <AlertTriangle className="h-4 w-4" />
              Deducir Punto
            </Button>
            
            <Button
              onClick={() => handleQuickAction('FOUL')}
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
            >
              <AlertCircle className="h-4 w-4" />
              Falta
            </Button>
            
            <Button
              onClick={() => handleQuickAction('KNOCKDOWN')}
              variant="outline"
              className="flex items-center gap-2 text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <Zap className="h-4 w-4" />
              Knockdown
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controles de Emergencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => handleQuickAction('STOP_FIGHT')}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Detener Pelea
            </Button>
            
            <Button
              onClick={() => handleQuickAction('TECHNICAL_ISSUE')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Problema Técnico
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      {realtimeData.controlEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {realtimeData.controlEvents
                .slice(-10)
                .reverse()
                .map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>{event.description}</span>
                  <span className="text-muted-foreground">
                    R{event.round_number} - {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Acción</DialogTitle>
            <DialogDescription>
              Proporciona detalles sobre la acción a registrar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {(selectedAction === 'WARNING' || selectedAction === 'POINT_DEDUCTION' || 
              selectedAction === 'FOUL' || selectedAction === 'KNOCKDOWN') && (
              <div>
                <label className="text-sm font-medium mb-2 block">Peleador Afectado</label>
                <Select value={selectedFighter} onValueChange={setSelectedFighter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar peleador..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={fight.fighter_a_id}>
                      {fight.fighterA?.first_name} {fight.fighterA?.last_name} (Rojo)
                    </SelectItem>
                    <SelectItem value={fight.fighter_b_id}>
                      {fight.fighterB?.first_name} {fight.fighterB?.last_name} (Azul)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">Razón/Descripción</label>
              <Textarea
                placeholder="Describe la razón de esta acción..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDetailedAction}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}