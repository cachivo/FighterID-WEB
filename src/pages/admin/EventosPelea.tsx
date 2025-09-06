import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Calendar, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, useFights, BdgEvent } from '@/hooks/useEvents';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FighterProfile {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  weight_class: string;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  avatar_url?: string;
}

export default function EventosPelea() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { events, loading, createEvent, updateEventState, refreshEvents } = useEvents();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFightersDialog, setShowFightersDialog] = useState(false);
  const [showFightsDialog, setShowFightsDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BdgEvent | null>(null);
  const [fighters, setFighters] = useState<FighterProfile[]>([]);
  const [availableFighters, setAvailableFighters] = useState<FighterProfile[]>([]);
  const [eventFighters, setEventFighters] = useState<string[]>([]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discipline: 'MMA',
    venue: '',
    start_time: '',
    end_time: ''
  });

  const [fightData, setFightData] = useState({
    fight_number: 1,
    fight_type: 'AMATEUR',
    fighter_a_id: '',
    fighter_b_id: '',
    weight_class: '',
    scheduled_time: ''
  });

  useEffect(() => {
    fetchFighters();
  }, []);

  const fetchFighters = async () => {
    try {
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select('id, first_name, last_name, nickname, weight_class, record_wins, record_losses, record_draws, avatar_url')
        .eq('active', true)
        .order('first_name');

      if (error) throw error;
      setAvailableFighters(data || []);
    } catch (error) {
      console.error('Error fetching fighters:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.name || !formData.discipline) {
      toast({
        title: 'Error',
        description: 'El nombre y disciplina son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    try {
      const eventData = {
        name: formData.name,
        description: formData.description,
        discipline: formData.discipline,
        venue: formData.venue,
        start_time: formData.start_time,
        end_time: formData.end_time
      };
      
      await createEvent(eventData);
      setShowCreateDialog(false);
      setFormData({
        name: '',
        description: '',
        discipline: 'MMA',
        venue: '',
        start_time: '',
        end_time: ''
      });
      
      toast({
        title: 'Éxito',
        description: 'Evento creado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el evento',
        variant: 'destructive',
      });
    }
  };

  const handleAddFighterToEvent = async (fighterId: string) => {
    if (!selectedEvent || eventFighters.includes(fighterId)) return;

    setEventFighters(prev => [...prev, fighterId]);
    toast({
      title: 'Éxito',
      description: 'Peleador agregado al evento',
    });
  };

  const handleCreateFight = async () => {
    if (!selectedEvent || !fightData.fighter_a_id || !fightData.fighter_b_id || !fightData.weight_class) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios para crear una pelea',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fights')
        .insert({
          event_id: selectedEvent.id,
          fight_number: fightData.fight_number,
          fight_type: fightData.fight_type,
          fighter_a_id: fightData.fighter_a_id,
          fighter_b_id: fightData.fighter_b_id,
          weight_class: fightData.weight_class,
          scheduled_time: fightData.scheduled_time || null,
          status: 'scheduled'
        });

      if (error) throw error;

      setFightData({
        fight_number: fightData.fight_number + 1,
        fight_type: 'AMATEUR',
        fighter_a_id: '',
        fighter_b_id: '',
        weight_class: '',
        scheduled_time: ''
      });

      toast({
        title: 'Éxito',
        description: 'Pelea creada correctamente',
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la pelea',
        variant: 'destructive',
      });
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'live':
        return 'bg-destructive text-destructive-foreground';
      case 'finished':
        return 'bg-muted-foreground text-background';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'draft':
        return 'Borrador';
      case 'live':
        return 'EN VIVO';
      case 'finished':
        return 'Finalizado';
      default:
        return state.toUpperCase();
    }
  };

  const getEventIcon = () => {
    return '🥊';
  };

  const eventFightersData = eventFighters.map(fighterId => 
    availableFighters.find(f => f.id === fighterId)
  ).filter(Boolean);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Eventos de Pelea</h2>
          <p className="text-muted-foreground">
            Gestiona los eventos de combate con peleadores y peleas específicas
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Evento de Pelea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Evento de Pelea</DialogTitle>
              <DialogDescription>
                Crea un evento específico de combate donde puedes agregar peleadores y peleas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Evento *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Batalla de Gimnasios #1"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el evento"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="discipline">Disciplina *</Label>
                <Select value={formData.discipline} onValueChange={(value) => setFormData(prev => ({...prev, discipline: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MMA">MMA</SelectItem>
                    <SelectItem value="Boxeo">Boxeo</SelectItem>
                    <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                    <SelectItem value="Muay Thai">Muay Thai</SelectItem>
                    <SelectItem value="Jiu-Jitsu">Jiu-Jitsu</SelectItem>
                    <SelectItem value="Karate">Karate</SelectItem>
                    <SelectItem value="Taekwondo">Taekwondo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="venue">Sede</Label>
                <Input
                  id="venue"
                  placeholder="Ej: Arena Multideportiva"
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({...prev, venue: e.target.value}))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Fecha y Hora Inicio</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({...prev, start_time: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">Fecha y Hora Fin</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({...prev, end_time: e.target.value}))}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateEvent}>Crear Evento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos de Combate</CardTitle>
          <CardDescription>
            {events.length} eventos creados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getEventIcon()}</span>
                      {event.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{event.discipline}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStateColor(event.state)}>
                      {getStateText(event.state)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.start_time ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.start_time), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin fecha</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {event.venue ? (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin sede</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setEventFighters([]);
                          setShowFightersDialog(true);
                        }}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Peleadores
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowFightsDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Peleas
                      </Button>
                      <Select value={event.state} onValueChange={(value) => updateEventState(event.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Borrador</SelectItem>
                          <SelectItem value="live">En Vivo</SelectItem>
                          <SelectItem value="finished">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fighters Management Dialog */}
      <Dialog open={showFightersDialog} onOpenChange={setShowFightersDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Gestionar Peleadores - {selectedEvent?.name}</DialogTitle>
            <DialogDescription>
              Agrega peleadores que participarán en este evento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {eventFightersData.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Peleadores del Evento ({eventFightersData.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {eventFightersData.map((fighter) => (
                    <div key={fighter?.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{fighter?.first_name} {fighter?.last_name}</span>
                        {fighter?.nickname && <span className="text-sm text-muted-foreground"> "{fighter.nickname}"</span>}
                        <div className="text-xs text-muted-foreground">
                          {fighter?.weight_class} • {fighter?.record_wins}W-{fighter?.record_losses}L-{fighter?.record_draws}D
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEventFighters(prev => prev.filter(id => id !== fighter?.id))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Peleadores Disponibles</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableFighters.filter(f => !eventFighters.includes(f.id)).map((fighter) => (
                  <div key={fighter.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{fighter.first_name} {fighter.last_name}</span>
                      {fighter.nickname && <span className="text-sm text-muted-foreground"> "{fighter.nickname}"</span>}
                      <div className="text-xs text-muted-foreground">
                        {fighter.weight_class} • {fighter.record_wins}W-{fighter.record_losses}L-{fighter.record_draws}D
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddFighterToEvent(fighter.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFightersDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fights Management Dialog */}
      <Dialog open={showFightsDialog} onOpenChange={setShowFightsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Peleas - {selectedEvent?.name}</DialogTitle>
            <DialogDescription>
              Crea peleas entre los peleadores del evento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número de Pelea</Label>
                <Input
                  type="number"
                  min="1"
                  value={fightData.fight_number}
                  onChange={(e) => setFightData(prev => ({...prev, fight_number: parseInt(e.target.value) || 1}))}
                />
              </div>
              <div>
                <Label>Tipo de Pelea</Label>
                <Select value={fightData.fight_type} onValueChange={(value) => setFightData(prev => ({...prev, fight_type: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMATEUR">Amateur</SelectItem>
                    <SelectItem value="PROFESSIONAL">Profesional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Peleador A</Label>
                <Select value={fightData.fighter_a_id} onValueChange={(value) => setFightData(prev => ({...prev, fighter_a_id: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar peleador" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventFightersData.map((fighter) => (
                      <SelectItem key={fighter?.id} value={fighter?.id || ''}>
                        {fighter?.first_name} {fighter?.last_name} {fighter?.nickname && `"${fighter.nickname}"`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Peleador B</Label>
                <Select value={fightData.fighter_b_id} onValueChange={(value) => setFightData(prev => ({...prev, fighter_b_id: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar peleador" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventFightersData.filter(f => f?.id !== fightData.fighter_a_id).map((fighter) => (
                      <SelectItem key={fighter?.id} value={fighter?.id || ''}>
                        {fighter?.first_name} {fighter?.last_name} {fighter?.nickname && `"${fighter.nickname}"`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría de Peso</Label>
                <Select value={fightData.weight_class} onValueChange={(value) => setFightData(prev => ({...prev, weight_class: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flyweight">Peso Mosca (125 lbs)</SelectItem>
                    <SelectItem value="Bantamweight">Peso Gallo (135 lbs)</SelectItem>
                    <SelectItem value="Featherweight">Peso Pluma (145 lbs)</SelectItem>
                    <SelectItem value="Lightweight">Peso Ligero (155 lbs)</SelectItem>
                    <SelectItem value="Welterweight">Peso Wélter (170 lbs)</SelectItem>
                    <SelectItem value="Middleweight">Peso Medio (185 lbs)</SelectItem>
                    <SelectItem value="Light Heavyweight">Peso Semipesado (205 lbs)</SelectItem>
                    <SelectItem value="Heavyweight">Peso Pesado (265 lbs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora Programada</Label>
                <Input
                  type="time"
                  value={fightData.scheduled_time}
                  onChange={(e) => setFightData(prev => ({...prev, scheduled_time: e.target.value}))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFightsDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={handleCreateFight}>
              Crear Pelea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}