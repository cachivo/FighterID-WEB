import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeBetting } from '@/hooks/useRealtimeBetting';
import { 
  Play, 
  Pause, 
  Square, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  DollarSign,
  Users,
  Clock,
  Zap,
  Ban,
  CheckCircle
} from 'lucide-react';

interface LiveMarket {
  id: string;
  title: string;
  description?: string;
  state: string;
  event_id: string;
  rake: number;
  created_at: string;
  outcomes?: Outcome[];
  event?: { name: string; discipline: string };
  totalPool?: number;
  activeTickets?: number;
  lastActivity?: string;
}

interface Outcome {
  id: string;
  label: string;
  pool: number;
  active: boolean;
  market_id: string;
}

interface EmergencyAction {
  type: 'SUSPEND_ALL' | 'REFUND_MARKET' | 'BLOCK_BETTING';
  reason: string;
  marketId?: string;
}

export function LiveControl() {
  const [liveMarkets, setLiveMarkets] = useState<LiveMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [suspendReason, setSuspendReason] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { toast } = useToast();
  const { 
    poolUpdates, 
    ticketUpdates, 
    connectionStatus,
    getPoolForOutcome,
    getMarketState 
  } = useRealtimeBetting();

  useEffect(() => {
    fetchLiveMarkets();
    
    // Auto-refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLiveMarkets, refreshInterval * 1000);
    }

    // Hotkeys
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            if (selectedMarket) handleQuickAction('open', selectedMarket);
            break;
          case '2':
            e.preventDefault();
            if (selectedMarket) handleQuickAction('suspended', selectedMarket);
            break;
          case '3':
            e.preventDefault();
            if (selectedMarket) handleQuickAction('closed', selectedMarket);
            break;
          case 'e':
            e.preventDefault();
            setEmergencyMode(true);
            break;
          case 'r':
            e.preventDefault();
            fetchLiveMarkets();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedMarket, refreshInterval, autoRefresh]);

  const fetchLiveMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('market')
        .select(`
          *,
          bdg_event!inner(name, discipline),
          outcome(*),
          bet_ticket!market_id(count)
        `)
        .in('state', ['open', 'suspended', 'preopen'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedMarkets = data?.map(market => ({
        ...market,
        event: market.bdg_event,
        outcomes: market.outcome,
        totalPool: market.outcome?.reduce((sum: number, o: any) => sum + o.pool, 0) || 0,
        activeTickets: market.bet_ticket?.[0]?.count || 0,
        lastActivity: new Date().toISOString()
      })) || [];
      
      setLiveMarkets(formattedMarkets);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los mercados',
        variant: 'destructive',
      });
    }
  };

  const handleQuickAction = async (newState: string, marketId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('market')
        .update({ state: newState })
        .eq('id', marketId);
      
      if (error) throw error;
      
      // Log state change
      await supabase
        .from('market_state_log')
        .insert([{
          market_id: marketId,
          to_state: newState,
          actor: (await supabase.auth.getUser()).data.user?.id,
          reason: `Quick action: ${newState}`
        }]);
      
      toast({
        title: 'Estado Actualizado',
        description: `Mercado cambiado a ${newState}`,
      });
      
      fetchLiveMarkets();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyAction = async (action: EmergencyAction) => {
    try {
      setLoading(true);
      
      switch (action.type) {
        case 'SUSPEND_ALL':
          const { error: suspendError } = await supabase
            .from('market')
            .update({ state: 'suspended' })
            .eq('state', 'open');
          
          if (suspendError) throw suspendError;
          break;
          
        case 'REFUND_MARKET':
          // Refund all pending bets in the market by setting tickets to cancelled
          const { error: refundError } = await supabase
            .from('bet_ticket')
            .update({ status: 'CANCELLED' })
            .eq('market_id', action.marketId)
            .in('status', ['PENDING_DELAY', 'ACCEPTED']);
          
          if (refundError) throw refundError;
          break;
          
        case 'BLOCK_BETTING':
          // Set all markets to suspended
          const { error: blockError } = await supabase
            .from('market')
            .update({ state: 'suspended' })
            .in('state', ['open', 'preopen']);
          
          if (blockError) throw blockError;
          break;
      }
      
      toast({
        title: 'Acción de Emergencia Ejecutada',
        description: `${action.type}: ${action.reason}`,
      });
      
      setEmergencyMode(false);
      fetchLiveMarkets();
      
    } catch (error) {
      toast({
        title: 'Error en Acción de Emergencia',
        description: 'No se pudo ejecutar la acción',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'open': return 'bg-fighter-success/20 text-fighter-success';
      case 'suspended': return 'bg-fighter-warning/20 text-fighter-warning';
      case 'preopen': return 'bg-fighter-info/20 text-fighter-info';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getActivityStatus = (market: LiveMarket) => {
    const realtimeState = getMarketState(market.id);
    if (realtimeState && realtimeState !== market.state) {
      return realtimeState;
    }
    return market.state;
  };

  const getRealtimePool = (outcomeId: string, originalPool: number) => {
    const realtimePool = getPoolForOutcome(outcomeId);
    return realtimePool !== null ? realtimePool : originalPool;
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <Card className={`border-2 ${emergencyMode ? 'border-red-500' : 'border-primary/20'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className={`h-5 w-5 ${connectionStatus === 'connected' ? 'text-fighter-success' : 'text-fighter-danger'}`} />
                Control en Vivo
                <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                  {connectionStatus}
                </Badge>
              </CardTitle>
              <CardDescription>
                Panel de control para mercados activos • {liveMarkets.length} mercados monitoreados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Hotkeys: Ctrl+1/2/3 (states) • Ctrl+E (emergency) • Ctrl+R (refresh)
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto: {autoRefresh ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Emergency Controls */}
      {emergencyMode && (
        <Alert className="border-fighter-danger bg-fighter-danger/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Modo de emergencia activado</span>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Ban className="h-4 w-4 mr-1" />
                    Suspender Todo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Suspender Todos los Mercados</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción suspenderá inmediatamente todos los mercados abiertos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    placeholder="Razón de la suspensión..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleEmergencyAction({
                        type: 'SUSPEND_ALL',
                        reason: suspendReason || 'Suspensión de emergencia'
                      })}
                    >
                      Suspender Todo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEmergencyMode(false)}
              >
                Cancelar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Live Markets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mercados Activos</CardTitle>
          <CardDescription>
            Monitoreo en tiempo real de mercados y actividad de apuestas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mercado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pool en Vivo</TableHead>
                <TableHead>Actividad</TableHead>
                <TableHead>Acciones Rápidas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liveMarkets.map((market) => {
                const currentState = getActivityStatus(market);
                return (
                  <TableRow 
                    key={market.id} 
                    className={`${selectedMarket === market.id ? 'bg-muted/50' : ''} cursor-pointer`}
                    onClick={() => setSelectedMarket(selectedMarket === market.id ? '' : market.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{market.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {market.event?.name} • {market.event?.discipline}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStateColor(currentState)}>
                        {currentState}
                        {currentState !== market.state && (
                          <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {market.outcomes?.reduce((sum, o) => 
                            sum + getRealtimePool(o.id, o.pool), 0
                          )?.toFixed(2) || '0.00'} BDG
                        </div>
                        <Progress 
                          value={Math.min((market.totalPool || 0) / 1000 * 100, 100)} 
                          className="h-1"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          {market.activeTickets} tickets
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {Object.keys(ticketUpdates).length > 0 ? 'Actividad reciente' : 'Sin actividad'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {currentState === 'preopen' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('open', market.id);
                            }}
                            disabled={loading}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {currentState === 'open' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction('suspended', market.id);
                              }}
                              disabled={loading}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction('closed', market.id);
                              }}
                              disabled={loading}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {currentState === 'suspended' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction('open', market.id);
                            }}
                            disabled={loading}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Market Details */}
      {selectedMarket && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>
              Detalles del Mercado: {
                liveMarkets.find(m => m.id === selectedMarket)?.title
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {liveMarkets.find(m => m.id === selectedMarket)?.outcomes?.map(outcome => (
                <div key={outcome.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{outcome.label}</span>
                    <Badge variant={outcome.active ? 'default' : 'secondary'}>
                      {outcome.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-lg font-bold">
                      {getRealtimePool(outcome.id, outcome.pool).toFixed(2)} BDG
                    </span>
                    {getRealtimePool(outcome.id, outcome.pool) !== outcome.pool && (
                      <Zap className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <Progress 
                    value={
                      (getRealtimePool(outcome.id, outcome.pool) / 
                      (liveMarkets.find(m => m.id === selectedMarket)?.totalPool || 1)) * 100
                    } 
                    className="h-2 mt-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Updates Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.values(ticketUpdates).slice(0, 10).map((update, index) => (
              <div key={update.id} className="flex items-center justify-between text-sm border-b pb-1">
                <span>
                  {update.status === 'ACCEPTED' ? (
                    <CheckCircle className="h-4 w-4 inline mr-1 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 inline mr-1 text-yellow-500" />
                  )}
                  Apuesta {update.status.toLowerCase()}
                </span>
                <span className="text-muted-foreground">
                  Hace un momento
                </span>
              </div>
            ))}
            {Object.keys(ticketUpdates).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Sin actividad reciente
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}