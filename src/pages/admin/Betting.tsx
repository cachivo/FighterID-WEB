import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Play, Pause, Square, Eye, Clock, DollarSign, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { LiveControl } from '@/components/admin/LiveControl';
import { SettlementConsole } from '@/components/admin/SettlementConsole';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Types
interface BDGEvent {
  id: string;
  name: string;
  discipline: string;
  description?: string;
  venue?: string;
  state: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  meta: any;
}

interface Market {
  id: string;
  title: string;
  description?: string;
  kind: string;
  state: string;
  event_id: string;
  rake: number;
  min_stake: number;
  max_stake?: number;
  created_at: string;
  outcomes?: Outcome[];
  event?: { name: string; discipline: string };
}

interface Outcome {
  id: string;
  label: string;
  description?: string;
  market_id: string;
  pool: number;
  active: boolean;
  sort_order: number;
}

// Schemas
const eventSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  discipline: z.string().min(1, 'Disciplina requerida'),
  description: z.string().optional(),
  venue: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

const marketSchema = z.object({
  title: z.string().min(1, 'Título requerido'),
  description: z.string().optional(),
  kind: z.enum(['PARIMUTUEL', 'FIXED_ODDS']),
  rake: z.number().min(0).max(0.5),
  min_stake: z.number().min(0.1),
  max_stake: z.number().optional(),
  event_id: z.string().min(1, 'Evento requerido'),
});

const outcomeSchema = z.object({
  label: z.string().min(1, 'Label requerido'),
  description: z.string().optional(),
  sort_order: z.number().min(0),
});

export default function AdminBetting() {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<BDGEvent[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [activeTab, setActiveTab] = useState('events');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [marketDialogOpen, setMarketDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BDGEvent | null>(null);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  
  const { toast } = useToast();

  // Forms
  const eventForm = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      discipline: '',
      description: '',
      venue: '',
      start_time: '',
      end_time: '',
    }
  });

  const marketForm = useForm({
    resolver: zodResolver(marketSchema),
    defaultValues: {
      title: '',
      description: '',
      kind: 'PARIMUTUEL' as const,
      rake: 0.08,
      min_stake: 1,
      max_stake: undefined,
      event_id: '',
    }
  });

  // Data fetching
  useEffect(() => {
    fetchEvents();
    fetchMarkets();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('bdg_event')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los eventos',
        variant: 'destructive',
      });
    }
  };

  const fetchMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('market')
        .select(`
          *,
          bdg_event!inner(name, discipline),
          outcome(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMarkets(data?.map(market => ({
        ...market,
        event: market.bdg_event,
        outcomes: market.outcome
      })) || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los mercados',
        variant: 'destructive',
      });
    }
  };

  // Event handlers
  const handleCreateEvent = async (data: any) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bdg_event')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Éxito',
        description: 'Evento creado correctamente',
      });
      
      setEventDialogOpen(false);
      eventForm.reset();
      fetchEvents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (data: any) => {
    if (!editingEvent) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bdg_event')
        .update(data)
        .eq('id', editingEvent.id);
      
      if (error) throw error;
      
      toast({
        title: 'Éxito',
        description: 'Evento actualizado correctamente',
      });
      
      setEventDialogOpen(false);
      setEditingEvent(null);
      eventForm.reset();
      fetchEvents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarket = async (data: any) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('market')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Éxito',
        description: 'Mercado creado correctamente',
      });
      
      setMarketDialogOpen(false);
      marketForm.reset();
      fetchMarkets();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el mercado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bdg_event')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
      
      toast({
        title: 'Éxito',
        description: 'Evento eliminado correctamente',
      });
      
      fetchEvents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarketStateChange = async (marketId: string, newState: string) => {
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
          reason: `Estado cambiado a ${newState} desde admin`
        }]);
      
      toast({
        title: 'Éxito',
        description: `Estado del mercado cambiado a ${newState}`,
      });
      
      fetchMarkets();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado del mercado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'live': case 'open': return 'bg-fighter-success/20 text-fighter-success';
      case 'suspended': return 'bg-fighter-warning/20 text-fighter-warning';
      case 'finished': case 'closed': return 'bg-fighter-info/20 text-fighter-info';
      case 'settled': return 'bg-primary/20 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.discipline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMarkets = markets.filter(market =>
    market.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    market.event?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (selectedEvent ? market.event_id === selectedEvent : true)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Betting & Markets</h1>
          <p className="text-muted-foreground">Gestión de eventos BDG, mercados y liquidaciones</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="events">BDG Events</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="live">Live Control</TabsTrigger>
          <TabsTrigger value="settlement">Settlement</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingEvent(null);
                  eventForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingEvent ? 'Actualizar información del evento BDG' : 'Crear un nuevo evento BDG para betting'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={eventForm.handleSubmit(editingEvent ? handleUpdateEvent : handleCreateEvent)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nombre del Evento</Label>
                      <Input
                        {...eventForm.register('name')}
                        placeholder="Ej: Championship Final"
                      />
                      {eventForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{eventForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="discipline">Disciplina</Label>
                      <Select onValueChange={(value) => eventForm.setValue('discipline', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="boxing">Boxing</SelectItem>
                          <SelectItem value="rap">Rap Battle</SelectItem>
                          <SelectItem value="chess">Chess</SelectItem>
                          <SelectItem value="esports">Esports</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      {...eventForm.register('description')}
                      placeholder="Descripción del evento..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="venue">Venue</Label>
                      <Input
                        {...eventForm.register('venue')}
                        placeholder="Ubicación del evento"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Inicio</Label>
                      <Input
                        {...eventForm.register('start_time')}
                        type="datetime-local"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">Final</Label>
                      <Input
                        {...eventForm.register('end_time')}
                        type="datetime-local"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEventDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {editingEvent ? 'Actualizar' : 'Crear'} Evento
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <CardDescription>
                        {event.discipline} • {event.venue}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStateColor(event.state)}>
                        {event.state}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingEvent(event);
                          eventForm.reset(event);
                          setEventDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará el evento y todos sus mercados asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  {event.start_time && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {new Date(event.start_time).toLocaleDateString('es', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="markets" className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar mercados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los eventos</SelectItem>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={marketDialogOpen} onOpenChange={setMarketDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingMarket(null);
                  marketForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Mercado
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Mercado</DialogTitle>
                  <DialogDescription>
                    Crear un mercado de apuestas para un evento BDG
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={marketForm.handleSubmit(handleCreateMarket)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título del Mercado</Label>
                      <Input
                        {...marketForm.register('title')}
                        placeholder="Ej: Fight Winner"
                      />
                    </div>
                    <div>
                      <Label htmlFor="event_id">Evento</Label>
                      <Select onValueChange={(value) => marketForm.setValue('event_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar evento" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.filter(e => e.state !== 'finished').map(event => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name} ({event.discipline})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      {...marketForm.register('description')}
                      placeholder="Descripción del mercado..."
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="kind">Tipo</Label>
                      <Select onValueChange={(value) => marketForm.setValue('kind', value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de mercado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PARIMUTUEL">Parimutuel</SelectItem>
                          <SelectItem value="FIXED_ODDS">Cuotas Fijas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rake">Rake (%)</Label>
                      <Input
                        {...marketForm.register('rake', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        max="0.5"
                        placeholder="0.08"
                      />
                    </div>
                    <div>
                      <Label htmlFor="min_stake">Apuesta Mínima</Label>
                      <Input
                        {...marketForm.register('min_stake', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setMarketDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      Crear Mercado
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto -mx-4 px-4"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mercado</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pool Total</TableHead>
                <TableHead>Outcomes</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMarkets.map((market) => (
                <TableRow key={market.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{market.title}</p>
                      <p className="text-sm text-muted-foreground">{market.kind} • Rake: {(market.rake * 100).toFixed(1)}%</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{market.event?.name}</p>
                      <p className="text-sm text-muted-foreground">{market.event?.discipline}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStateColor(market.state)}>
                      {market.state}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {market.outcomes?.reduce((sum, outcome) => sum + outcome.pool, 0)?.toFixed(2) || '0.00'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {market.outcomes?.length || 0} outcomes
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {market.state === 'preopen' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarketStateChange(market.id, 'open')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {market.state === 'open' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarketStateChange(market.id, 'suspended')}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarketStateChange(market.id, 'closed')}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {market.state === 'suspended' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarketStateChange(market.id, 'open')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <LiveControl />
        </TabsContent>

        <TabsContent value="settlement" className="space-y-4">
          <SettlementConsole />
        </TabsContent>
      </Tabs>
    </div>
  );
}