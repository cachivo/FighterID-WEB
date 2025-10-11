import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Monitor, Copy, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import AdminLayout from '@/components/AdminLayout';
import { format } from 'date-fns';

type StationStatus = 'online' | 'waiting' | 'empty';

interface StationData {
  station_number: number;
  pin_code: string | null;
  assigned_judge_name: string | null;
  is_active: boolean;
  expires_at: string | null;
  is_connected: boolean;
  connected_judge_name: string | null;
  last_access: string | null;
}

interface Event {
  id: string;
  name: string;
  start_time: string;
  state: string;
}

export default function JudgeStationsSetup() {
  const [stations, setStations] = useState<StationData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingPin, setGeneratingPin] = useState<number | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  // Restore selected event from localStorage after events are loaded
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      const savedEventId = localStorage.getItem('admin_station_selected_event');
      if (savedEventId) {
        // Validate that the saved event still exists and is active
        const eventExists = events.find(e => e.id === savedEventId);
        if (eventExists) {
          setSelectedEvent(savedEventId);
        } else {
          // Clear localStorage if event no longer exists
          localStorage.removeItem('admin_station_selected_event');
        }
      }
    }
  }, [events]);

  useEffect(() => {
    if (selectedEvent) {
      loadStationStatus();
    }
  }, [selectedEvent]);

  // Polling cada 5 segundos para actualizar estado de conexión
  useEffect(() => {
    if (!selectedEvent) return;

    const interval = setInterval(() => {
      loadStationStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('bdg_event')
        .select('id, name, start_time, state')
        .in('state', ['draft', 'live'])
        .order('start_time', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      toast.error('Error al cargar eventos');
    }
  };

  const loadStationStatus = async () => {
    if (!selectedEvent) return;

    try {
      const { data, error } = await supabase.rpc('get_station_status', {
        p_event_id: selectedEvent
      });

      if (error) throw error;

      // Si no hay datos, inicializar con estaciones vacías
      if (!data || data.length === 0) {
        setStations([
          { station_number: 1, pin_code: null, assigned_judge_name: null, is_active: false, expires_at: null, is_connected: false, connected_judge_name: null, last_access: null },
          { station_number: 2, pin_code: null, assigned_judge_name: null, is_active: false, expires_at: null, is_connected: false, connected_judge_name: null, last_access: null },
          { station_number: 3, pin_code: null, assigned_judge_name: null, is_active: false, expires_at: null, is_connected: false, connected_judge_name: null, last_access: null },
        ]);
      } else {
        // Asegurar que tenemos las 3 estaciones
        const stationMap = new Map(data.map((s: StationData) => [s.station_number, s]));
        const allStations = [1, 2, 3].map(num => 
          stationMap.get(num) || {
            station_number: num,
            pin_code: null,
            assigned_judge_name: null,
            is_active: false,
            expires_at: null,
            is_connected: false,
            connected_judge_name: null,
            last_access: null,
          }
        );
        setStations(allStations);
      }
    } catch (error) {
      console.error('Error cargando estado de estaciones:', error);
    }
  };

  const generatePin = async (stationNumber: number) => {
    if (!selectedEvent) {
      toast.error('Selecciona un evento primero');
      return;
    }

    setGeneratingPin(stationNumber);

    try {
      const { data, error } = await supabase.rpc('generate_station_pin', {
        p_event_id: selectedEvent,
        p_station_number: stationNumber,
        p_assigned_judge_id: null,
      });

      if (error) throw error;

      const result = data[0];
      
      toast.success(`PIN generado para Estación ${stationNumber}`, {
        description: `PIN: ${result.pin_code}`,
      });

      await loadStationStatus();
    } catch (err) {
      console.error('Error generando PIN:', err);
      const errorMessage = (err as any)?.message ?? 'Error al generar PIN';
      toast.error(errorMessage);
    } finally {
      setGeneratingPin(null);
    }
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    toast.success('📋 PIN copiado al portapapeles');
  };

  const copyUrl = (stationNumber: number) => {
    const url = `${window.location.origin}/estacion/${stationNumber}`;
    navigator.clipboard.writeText(url);
    toast.success(`URL copiada: /estacion/${stationNumber}`);
  };

  const getStationStatus = (station: StationData): StationStatus => {
    if (station.is_connected) return 'online';
    if (station.pin_code && station.is_active) return 'waiting';
    return 'empty';
  };

  const getBadgeVariant = (status: StationStatus) => {
    switch (status) {
      case 'online': return 'default';
      case 'waiting': return 'secondary';
      case 'empty': return 'outline';
    }
  };

  const getBadgeText = (status: StationStatus) => {
    switch (status) {
      case 'online': return '🟢 En Línea';
      case 'waiting': return '🟡 Esperando';
      case 'empty': return '⚪ Sin PIN';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Configuración de Estaciones de Jueces"
          subtitle="Sistema de acceso con PIN - Sin necesidad de crear cuentas"
        />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Nuevo Sistema de PIN:</strong> Genera un PIN de 4 dígitos por estación. 
            Los jueces solo necesitan la URL y el PIN para acceder. No requieren email ni cuenta.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Evento</CardTitle>
            <CardDescription>Elige el evento para generar PINs de estaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedEvent} 
              onValueChange={(value) => {
                setSelectedEvent(value);
                localStorage.setItem('admin_station_selected_event', value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un evento..." />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {format(new Date(event.start_time), 'dd/MM/yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedEvent && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stations.map(station => {
              const status = getStationStatus(station);
              return (
                <Card key={station.station_number} className="min-h-[450px]">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Monitor className="h-5 w-5 shrink-0" />
                        <CardTitle className="text-lg truncate">
                          Estación #{station.station_number}
                        </CardTitle>
                      </div>
                      <Badge 
                        variant={getBadgeVariant(status)}
                        className="text-xs px-2 py-1 shrink-0"
                      >
                        {getBadgeText(status)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* PIN Display */}
                    {station.pin_code && station.is_active ? (
                      <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                        <label className="text-sm font-medium">PIN Activo</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-2xl font-bold tracking-widest text-center py-2 bg-background rounded border">
                            {station.pin_code}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyPin(station.pin_code!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Expira: {format(new Date(station.expires_at!), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => generatePin(station.station_number)}
                        disabled={generatingPin === station.station_number}
                      >
                        {generatingPin === station.station_number ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Generar PIN
                          </>
                        )}
                      </Button>
                    )}

                    {/* URL Display */}
                    {station.pin_code && station.is_active && (
                      <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                        <label className="text-sm font-medium">URL de Acceso</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm p-2 bg-background rounded border truncate">
                            /estacion/{station.station_number}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyUrl(station.station_number)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Regenerar PIN */}
                    {station.pin_code && station.is_active && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => generatePin(station.station_number)}
                        disabled={generatingPin === station.station_number}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerar PIN
                      </Button>
                    )}

                    {/* Connection Info */}
                    {station.is_connected && station.connected_judge_name && (
                      <div className="pt-4 border-t space-y-2">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          ✓ Juez Conectado
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {station.connected_judge_name}
                        </p>
                        {station.last_access && (
                          <p className="text-xs text-muted-foreground">
                            Última conexión: {format(new Date(station.last_access), 'HH:mm:ss')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Assigned Judge Info */}
                    {station.assigned_judge_name && !station.is_connected && (
                      <div className="pt-4 border-t space-y-2">
                        <p className="text-sm font-medium">
                          Juez Asignado (opcional):
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {station.assigned_judge_name}
                        </p>
                      </div>
                    )}

                    {/* Empty State */}
                    {!station.pin_code && (
                      <div className="pt-4 text-center text-sm text-muted-foreground">
                        <p>Sin PIN generado</p>
                        <p className="text-xs mt-1">Genera un PIN para habilitar esta estación</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones del Sistema de PIN</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Pasos para configurar una estación:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Selecciona el evento activo</li>
                <li>Haz clic en "Generar PIN" para cada estación que necesites</li>
                <li>Copia el PIN y la URL usando los botones 📋</li>
                <li>Envía el PIN y URL al juez (WhatsApp, verbal, etc.)</li>
                <li>El juez abre la URL en su navegador e ingresa el PIN</li>
                <li>Verifica que el estado cambie a "🟢 En Línea"</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Estados de Estación:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><Badge variant="default" className="mr-2">🟢 En Línea</Badge> - Juez conectado y listo para calificar</li>
                <li><Badge variant="secondary" className="mr-2">🟡 Esperando</Badge> - PIN generado, esperando conexión</li>
                <li><Badge variant="outline" className="mr-2">⚪ Sin PIN</Badge> - Sin PIN generado</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Características:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✅ Sin necesidad de crear cuentas de usuario</li>
                <li>✅ PIN de 4 dígitos fácil de comunicar</li>
                <li>✅ URLs simples: /estacion1, /estacion2, /estacion3</li>
                <li>✅ Expiración automática al terminar el evento</li>
                <li>✅ Regeneración de PIN invalida el anterior</li>
                <li>✅ Auditoría completa de todos los accesos</li>
                <li>✅ Protección contra fuerza bruta (rate limiting)</li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Seguridad:</strong> Después de 5 intentos fallidos, la IP queda bloqueada 10 minutos. 
                Los PINs expiran automáticamente cuando termina el evento.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}