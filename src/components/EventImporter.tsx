import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, CheckCircle, AlertCircle, Users, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EventImporter = () => {
  const [loading, setLoading] = useState(false);
  type ImportResult = {
    event_id?: string;
    fighters_created?: number;
    fights_created?: number;
    [key: string]: unknown;
  };
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const importBatallaGimnasios = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      toast({
        title: "Iniciando importación...",
        description: "Creando evento Batalla de Gimnasios #1 con todos los peleadores",
      });

      const { data, error } = await supabase.functions.invoke('populate-batalla-gimnasios');
      
      if (error) {
        console.error('Error:', error);
        throw new Error(error.message || 'Error en la importación');
      }

      setResult(data);
      
      toast({
        title: "¡Importación exitosa!",
        description: `Evento creado con ${data.fighters_created} peleadores y ${data.fights_created} peleas`,
      });

    } catch (error) {
      console.error('Error importing event:', error);
      toast({
        title: "Error en la importación",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Importar Batalla de Gimnasios #1
          </CardTitle>
          <CardDescription>
            Crear el evento completo con 36 peleadores y 18 peleas (14 amateur + 4 profesionales)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Event Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold">Vista previa del evento:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  36 Peleadores
                </Badge>
                <p className="text-sm text-muted-foreground">
                  De Honduras, Nicaragua, Guatemala, Costa Rica, Belice, Chile, Venezuela, México y Canadá
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">
                  <Trophy className="w-3 h-3 mr-1" />
                  18 Peleas
                </Badge>
                <p className="text-sm text-muted-foreground">
                  14 peleas amateur y 4 peleas profesionales
                </p>
              </div>
            </div>
          </div>

          {/* Import Button */}
          <div className="text-center">
            <Button 
              onClick={importBatallaGimnasios}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Importando datos...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Importar Evento Completo
                </>
              )}
            </Button>
          </div>

          {/* Result Display */}
          {result && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Importación Completada
                  </h4>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Evento ID:</span>
                    <code className="px-2 py-1 bg-background rounded text-xs">
                      {result.event_id}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span>Peleadores creados:</span>
                    <Badge variant="secondary">{result.fighters_created}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Peleas programadas:</span>
                    <Badge variant="secondary">{result.fights_created}</Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Todos los peleadores han sido importados con sus records, categorías de peso y ELO calculado
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Las 18 peleas están programadas y listas para apostar
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ El evento está marcado como EN VIVO
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Importante
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Esta acción creará todos los peleadores y peleas de una sola vez. 
                    Solo debe ejecutarse una vez por evento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventImporter;