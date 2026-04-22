import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Zap, Play, Target, Activity, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AIStrikeTestPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fightId, setFightId] = useState('');
  const [roundNumber, setRoundNumber] = useState('1');
  const [fighter, setFighter] = useState<'A' | 'B'>('A');
  const [eventType, setEventType] = useState<'strike_attempted' | 'strike_connected'>('strike_connected');

  const callSimulator = async (action: string, additionalData?: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('ai-strike-test-simulator', {
        body: {
          action,
          fight_id: fightId,
          round_number: parseInt(roundNumber),
          fighter,
          event_type: eventType,
          ...additionalData
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Éxito",
        description: data.message || "Acción completada",
      });
    } catch (error) {
      console.error('Error calling simulator:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Error al ejecutar simulación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateSingleStrike = () => {
    if (!fightId) {
      toast({
        title: "⚠️ Atención",
        description: "Debes ingresar un Fight ID",
        variant: "destructive"
      });
      return;
    }
    callSimulator('simulate_strike');
  };

  const simulateBurst = () => {
    if (!fightId) {
      toast({
        title: "⚠️ Atención",
        description: "Debes ingresar un Fight ID",
        variant: "destructive"
      });
      return;
    }
    callSimulator('simulate_burst');
  };

  const startSession = () => {
    if (!fightId) {
      toast({
        title: "⚠️ Atención",
        description: "Debes ingresar un Fight ID",
        variant: "destructive"
      });
      return;
    }
    callSimulator('start_session');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🧪 Panel de Pruebas - IA Visión</h1>
        <p className="text-muted-foreground">
          Simula eventos de golpes para probar el sistema de visión artificial
        </p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Configuración de la Simulación
          </CardTitle>
          <CardDescription>
            Configura los parámetros para simular eventos de golpes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fightId">Fight ID *</Label>
              <Input
                id="fightId"
                placeholder="UUID de la pelea"
                value={fightId}
                onChange={(e) => setFightId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Obtén el ID desde el monitor o crea una pelea
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roundNumber">Round</Label>
              <Select value={roundNumber} onValueChange={setRoundNumber}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      Round {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fighter">Peleador</Label>
              <Select value={fighter} onValueChange={(v) => setFighter(v as 'A' | 'B')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Peleador A (Rojo)</SelectItem>
                  <SelectItem value="B">Peleador B (Azul)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strike_connected">Golpe Conectado</SelectItem>
                  <SelectItem value="strike_attempted">Golpe Intentado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Golpe Individual
            </CardTitle>
            <CardDescription>
              Simula un solo evento de golpe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={simulateSingleStrike} 
              disabled={loading || !fightId}
              className="w-full"
              variant="outline"
            >
              <Target className="mr-2 h-4 w-4" />
              Simular 1 Golpe
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Ráfaga de Golpes
            </CardTitle>
            <CardDescription>
              Simula 10 golpes consecutivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={simulateBurst} 
              disabled={loading || !fightId}
              className="w-full"
            >
              <Zap className="mr-2 h-4 w-4" />
              Simular 10 Golpes
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              Sesión de IA
            </CardTitle>
            <CardDescription>
              Inicia una sesión simulada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={startSession} 
              disabled={loading || !fightId}
              className="w-full"
              variant="outline"
            >
              <Play className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">📋 Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Obtén el UUID de una pelea activa desde el monitor de IA</li>
            <li>Pega el UUID en el campo "Fight ID"</li>
            <li>Selecciona el round, peleador y tipo de evento</li>
            <li>Haz clic en cualquier botón para simular eventos</li>
            <li>Ve al <strong>Monitor de IA</strong> para ver los eventos en tiempo real</li>
            <li>Prueba los <strong>Overlays de OBS</strong> con el botón de abajo</li>
          </ol>
          
          {fightId && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Vista previa del overlay:</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => window.open(`/ai-overlay?fightId=${fightId}&layout=side-by-side`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Overlay con este Fight ID
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
