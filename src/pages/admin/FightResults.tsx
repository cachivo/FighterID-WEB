import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Trophy, Clock, Users, Save, Eye, Edit, Trash2, CheckCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function FightResults() {
  const { toast } = useToast();
  const [fights, setFights] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedFight, setSelectedFight] = useState<any>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [resultForm, setResultForm] = useState({
    winner_id: '',
    result_type: 'DECISION',
    finish_method: '',
    finish_round: 1,
    finish_time: '',
    judge_1_scorecard: [10, 10, 10, 10, 10] as number[],
    judge_2_scorecard: [10, 10, 10, 10, 10] as number[],
    judge_3_scorecard: [10, 10, 10, 10, 10] as number[],
    judge_1_total: 0,
    judge_2_total: 0,
    judge_3_total: 0,
    performance_bonus: false,
    fight_of_night: false,
    notes: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchFights();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('bdg_event')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los eventos", variant: "destructive" });
      return;
    }
    
    setEvents(data || []);
    setLoading(false);
  };

  const fetchFights = async () => {
    const { data, error } = await supabase
      .from('fights')
      .select(`
        *,
        fighterA:fighter_profiles!fighter_a_id(first_name, last_name, nickname),
        fighterB:fighter_profiles!fighter_b_id(first_name, last_name, nickname),
        winner:fighter_profiles!winner_id(first_name, last_name),
        fight_results(*)
      `)
      .eq('event_id', selectedEvent)
      .order('fight_number');
    
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las peleas", variant: "destructive" });
      return;
    }
    
    setFights(data || []);
  };

  const openResultDialog = (fight: any) => {
    setSelectedFight(fight);
    
    // Load existing result if available
    if (fight.fight_results && fight.fight_results.length > 0) {
      const result = fight.fight_results[0];
      setResultForm({
        winner_id: result.winner_id || '',
        result_type: result.result_type,
        finish_method: result.finish_method || '',
        finish_round: result.finish_round || 1,
        finish_time: result.finish_time || '',
        judge_1_scorecard: result.judge_1_scorecard || [10, 9, 10, 9, 10],
        judge_2_scorecard: result.judge_2_scorecard || [10, 9, 10, 9, 10],
        judge_3_scorecard: result.judge_3_scorecard || [10, 9, 10, 9, 10],
        judge_1_total: result.judge_1_total || 0,
        judge_2_total: result.judge_2_total || 0,
        judge_3_total: result.judge_3_total || 0,
        performance_bonus: result.performance_bonus || false,
        fight_of_night: result.fight_of_night || false,
        notes: ''
      });
    } else {
      // Reset form for new result
      setResultForm({
        winner_id: '',
        result_type: 'DECISION',
        finish_method: '',
        finish_round: 1,
        finish_time: '',
        judge_1_scorecard: [10, 9, 10, 9, 10],
        judge_2_scorecard: [10, 9, 10, 9, 10],
        judge_3_scorecard: [10, 9, 10, 9, 10],
        judge_1_total: 0,
        judge_2_total: 0,
        judge_3_total: 0,
        performance_bonus: false,
        fight_of_night: false,
        notes: ''
      });
    }
    
    setIsResultDialogOpen(true);
  };

  const calculateTotals = () => {
    const judge1Total = resultForm.judge_1_scorecard.reduce((a, b) => a + b, 0);
    const judge2Total = resultForm.judge_2_scorecard.reduce((a, b) => a + b, 0);
    const judge3Total = resultForm.judge_3_scorecard.reduce((a, b) => a + b, 0);
    
    setResultForm(prev => ({
      ...prev,
      judge_1_total: judge1Total,
      judge_2_total: judge2Total,
      judge_3_total: judge3Total
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [resultForm.judge_1_scorecard, resultForm.judge_2_scorecard, resultForm.judge_3_scorecard]);

  const updateScorecard = (judgeIndex: number, roundIndex: number, score: number) => {
    const scorecardField = `judge_${judgeIndex + 1}_scorecard` as keyof typeof resultForm;
    const currentScorecard = [...(resultForm[scorecardField] as number[])];
    currentScorecard[roundIndex] = score;
    
    setResultForm(prev => ({
      ...prev,
      [scorecardField]: currentScorecard
    }));
  };

  const finalizeFightAuto = async (fight: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('finalize-fight-auto', {
        body: { 
          fight_id: fight.id,
          result_type: 'DECISION'
        }
      });
      
      if (error) throw error;
      
      toast({ 
        title: "✅ Pelea finalizada", 
        description: "Resultado guardado y récords actualizados automáticamente con IA" 
      });
      
      fetchFights();
    } catch (error: any) {
      console.error('Error finalizing fight:', error);
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo finalizar la pelea", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const submitResult = async () => {
    if (!selectedFight) return;

    try {
      const resultData = {
        fight_id: selectedFight.id,
        ...resultForm,
        confirmed_by: (await supabase.auth.getUser()).data.user?.id,
        confirmed_at: new Date().toISOString()
      };

      // Check if result exists
      const existingResult = selectedFight.fight_results && selectedFight.fight_results.length > 0;
      
      let error;
      if (existingResult) {
        ({ error } = await supabase
          .from('fight_results')
          .update(resultData)
          .eq('fight_id', selectedFight.id));
      } else {
        ({ error } = await supabase
          .from('fight_results')
          .insert(resultData));
      }

      if (error) throw error;

      // Update fight status and winner
      await supabase
        .from('fights')
        .update({
          status: 'finished',
          winner_id: resultForm.winner_id || null,
          finish_method: resultForm.finish_method || null,
          finish_round: resultForm.finish_round,
          finish_time: resultForm.finish_time || null
        })
        .eq('id', selectedFight.id);

      toast({ title: "Éxito", description: "Resultado guardado correctamente" });
      setIsResultDialogOpen(false);
      fetchFights();
      
    } catch (error) {
      console.error('Error saving result:', error);
      toast({ title: "Error", description: "No se pudo guardar el resultado", variant: "destructive" });
    }
  };

  const getResultBadgeVariant = (resultType: string) => {
    switch (resultType) {
      case 'KO': case 'TKO': return 'destructive';
      case 'SUBMISSION': return 'secondary';
      case 'DECISION': return 'default';
      case 'DRAW': return 'outline';
      default: return 'outline';
    }
  };

  const FightCard = ({ fight }: { fight: any }) => {
    const hasResult = fight.fight_results && fight.fight_results.length > 0;
    const result = hasResult ? fight.fight_results[0] : null;
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-xs">
                #{fight.fight_number}
              </Badge>
              {hasResult && (
                <Badge variant={getResultBadgeVariant(result.result_type)}>
                  {result.result_type}
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              {fight.status === 'ACTIVE' && !hasResult && (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => finalizeFightAuto(fight)}
                >
                  <Sparkles className="mr-2 h-3 w-3" />
                  Finalizar con IA
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => openResultDialog(fight)}
              >
                {hasResult ? <Edit className="mr-2 h-3 w-3" /> : <Trophy className="mr-2 h-3 w-3" />}
                {hasResult ? 'Editar' : 'Resultado'}
              </Button>
            </div>
          </div>

          <CardTitle className="text-lg">
            <div className="flex items-center justify-between">
              <span className={`${fight.winner_id === fight.fighter_a_id ? 'text-primary font-bold' : ''}`}>
                {fight.fighterA?.first_name} {fight.fighterA?.last_name}
              </span>
              <span className="mx-2 text-muted-foreground">VS</span>
              <span className={`${fight.winner_id === fight.fighter_b_id ? 'text-primary font-bold' : ''}`}>
                {fight.fighterB?.first_name} {fight.fighterB?.last_name}
              </span>
            </div>
          </CardTitle>
          
          <CardDescription>
            {fight.weight_class} • {fight.fight_type}
            {result && result.finish_method && (
              <> • {result.finish_method}</>
            )}
          </CardDescription>
        </CardHeader>

        {hasResult && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {result.result_type === 'DECISION' && (
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Juez 1:</span>
                    <span>{result.judge_1_total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Juez 2:</span>
                    <span>{result.judge_2_total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Juez 3:</span>
                    <span>{result.judge_3_total}</span>
                  </div>
                </div>
              )}
              
              {(result.finish_round && result.finish_time) && (
                <div className="text-sm text-muted-foreground">
                  Round {result.finish_round} - {result.finish_time}
                </div>
              )}
              
              <div className="flex gap-2">
                {result.performance_bonus && (
                  <Badge variant="secondary" className="text-xs">
                    Bono Actuación
                  </Badge>
                )}
                {result.fight_of_night && (
                  <Badge variant="secondary" className="text-xs">
                    Pelea de la Noche
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resultados de Peleas</h1>
        <p className="text-muted-foreground">
          Gestiona y registra los resultados oficiales de las peleas
        </p>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Seleccionar Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un evento..." />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{event.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {event.state}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Fights List */}
      {selectedEvent && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Card de Peleas</h2>
          
          {fights.length > 0 ? (
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
                  <h3 className="text-lg font-medium mb-2">No hay peleas</h3>
                  <p className="text-muted-foreground">
                    Este evento no tiene peleas registradas
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Result Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Resultado</DialogTitle>
            <DialogDescription>
              {selectedFight && (
                <>
                  {selectedFight.fighterA?.first_name} {selectedFight.fighterA?.last_name} vs{' '}
                  {selectedFight.fighterB?.first_name} {selectedFight.fighterB?.last_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Winner and Result Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ganador</Label>
                <Select value={resultForm.winner_id} onValueChange={(value) => setResultForm(prev => ({ ...prev, winner_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ganador..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin ganador (Empate/NC)</SelectItem>
                    {selectedFight && (
                      <>
                        <SelectItem value={selectedFight.fighter_a_id}>
                          {selectedFight.fighterA?.first_name} {selectedFight.fighterA?.last_name}
                        </SelectItem>
                        <SelectItem value={selectedFight.fighter_b_id}>
                          {selectedFight.fighterB?.first_name} {selectedFight.fighterB?.last_name}
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Tipo de Resultado</Label>
                <Select value={resultForm.result_type} onValueChange={(value) => setResultForm(prev => ({ ...prev, result_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DECISION">Decisión</SelectItem>
                    <SelectItem value="KO">KO</SelectItem>
                    <SelectItem value="TKO">TKO</SelectItem>
                    <SelectItem value="SUBMISSION">Sumisión</SelectItem>
                    <SelectItem value="DRAW">Empate</SelectItem>
                    <SelectItem value="NO_CONTEST">Sin Concurso</SelectItem>
                    <SelectItem value="DQ">Descalificación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Finish Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Método</Label>
                <Input
                  placeholder="Ej: Rear Naked Choke"
                  value={resultForm.finish_method}
                  onChange={(e) => setResultForm(prev => ({ ...prev, finish_method: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Round</Label>
                <Select value={resultForm.finish_round.toString()} onValueChange={(value) => setResultForm(prev => ({ ...prev, finish_round: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(round => (
                      <SelectItem key={round} value={round.toString()}>Round {round}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Tiempo</Label>
                <Input
                  placeholder="4:59"
                  value={resultForm.finish_time}
                  onChange={(e) => setResultForm(prev => ({ ...prev, finish_time: e.target.value }))}
                />
              </div>
            </div>

            {/* Scorecards for Decision */}
            {resultForm.result_type === 'DECISION' && (
              <div className="space-y-4">
                <h4 className="font-medium">Scorecards de los Jueces</h4>
                
                {[0, 1, 2].map(judgeIndex => (
                  <div key={judgeIndex} className="space-y-2">
                    <Label>Juez {judgeIndex + 1} - Total: {resultForm[`judge_${judgeIndex + 1}_total` as keyof typeof resultForm]}</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[0, 1, 2, 3, 4].map(roundIndex => (
                        <div key={roundIndex}>
                          <Label className="text-xs">R{roundIndex + 1}</Label>
                          <Input
                            type="number"
                            min="6"
                            max="10"
                            value={resultForm[`judge_${judgeIndex + 1}_scorecard` as keyof typeof resultForm][roundIndex]}
                            onChange={(e) => updateScorecard(judgeIndex, roundIndex, parseInt(e.target.value) || 10)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bonuses */}
            <div className="space-y-4">
              <h4 className="font-medium">Bonos y Reconocimientos</h4>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={resultForm.performance_bonus}
                  onCheckedChange={(checked) => setResultForm(prev => ({ ...prev, performance_bonus: checked }))}
                />
                <Label>Bono por Actuación</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={resultForm.fight_of_night}
                  onCheckedChange={(checked) => setResultForm(prev => ({ ...prev, fight_of_night: checked }))}
                />
                <Label>Pelea de la Noche</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitResult}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}