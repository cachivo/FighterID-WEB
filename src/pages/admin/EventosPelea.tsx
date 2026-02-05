import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Calendar, MapPin, Clock, Trophy, Eye, EyeOff, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, useFights, BdgEvent } from '@/hooks/useEvents';
import { useExternalFighters } from '@/hooks/useExternalFighters';
import { ExternalFighterForm } from '@/components/admin/ExternalFighterForm';
import { FileUpload } from '@/components/ui/file-upload';
import { Switch } from '@/components/ui/switch';


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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  const { events, loading, createEvent, updateEventState, togglePublishEvent, deleteEvent, refreshEvents } = useEvents();
  console.log('[EventosPelea] loading:', loading, 'events:', events?.length);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFightersDialog, setShowFightersDialog] = useState(false);
  const [showFightsDialog, setShowFightsDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BdgEvent | null>(null);
  const [fighters, setFighters] = useState<FighterProfile[]>([]);
  const [availableFighters, setAvailableFighters] = useState<FighterProfile[]>([]);
  const [eventFighters, setEventFighters] = useState<string[]>([]);
  const [fighterSearchTerm, setFighterSearchTerm] = useState('');
  const [editingFight, setEditingFight] = useState<any | null>(null);
  
  // External fighters hook
  const { externalFighters, createExternalFighter, searchExternalFighters } = useExternalFighters();
  
  // Fight creation with external fighters
  const [fighterAIsRegistered, setFighterAIsRegistered] = useState(true);
  const [fighterBIsRegistered, setFighterBIsRegistered] = useState(true);
  const [externalFighterAData, setExternalFighterAData] = useState({
    name: '',
    nickname: '',
    weight_class: '',
    gym: '',
    country: 'HN',
   country: 'Honduras',
    record: { wins: 0, losses: 0, draws: 0 }
   country: 'Honduras',
   record: { wins: 0, losses: 0, draws: 0 }
  });
  const [externalFighterBData, setExternalFighterBData] = useState({
    name: '',
    nickname: '',
    weight_class: '',
    gym: '',
    country: 'HN',
   country: 'Honduras',
    record: { wins: 0, losses: 0, draws: 0 }
  });
  const [imageFileA, setImageFileA] = useState<File | undefined>();
  const [imageFileB, setImageFileB] = useState<File | undefined>();
  const [eventImageFileA, setEventImageFileA] = useState<File | undefined>();
  const [eventImageFileB, setEventImageFileB] = useState<File | undefined>();
  
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
    card_position: 'regular' as 'main_event' | 'co_main_event' | 'regular',
    number_of_rounds: 3
  });

  useEffect(() => {
    console.log('[EventosPelea] Component mounted, fetching fighters');
    fetchFighters();
  }, []);

  useEffect(() => {
    console.log('[EventosPelea] events updated:', events);
  }, [events]);

  useEffect(() => {
    console.log('[EventosPelea] loading state changed:', loading);
  }, [loading]);

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

  const handleSaveFight = async () => {
    // 1. VALIDACIÓN COMPLETA
    if (!user) {
      toast({
        title: 'Error de autenticación',
        description: 'Debes iniciar sesión para gestionar peleas',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedEvent || !fightData.weight_class) {
      toast({
        title: 'Error',
        description: 'Debes completar todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    try {
      let fighterAId: string | null = null;
      let fighterAExternalId: string | null = null;
      let fighterBId: string | null = null;
      let fighterBExternalId: string | null = null;

      // 2. PROCESAR PELEADOR A
      if (fighterAIsRegistered) {
        if (!fightData.fighter_a_id) {
          toast({
            title: 'Error',
            description: 'Debes seleccionar el Peleador A',
            variant: 'destructive',
          });
          return;
        }
        fighterAId = fightData.fighter_a_id;
      } else {
        // Crear o mantener peleador externo A
        if (editingFight?.fighter_a_external_id) {
          fighterAExternalId = editingFight.fighter_a_external_id;
        } else {
          if (!externalFighterAData.name || !externalFighterAData.weight_class) {
            toast({
              title: 'Error',
              description: 'Debes completar nombre y categoría del Peleador A',
              variant: 'destructive',
            });
            return;
          }
          const externalId = await createExternalFighter(externalFighterAData, imageFileA);
          if (!externalId) return;
          fighterAExternalId = externalId;
        }
      }

      // 3. PROCESAR PELEADOR B
      if (fighterBIsRegistered) {
        if (!fightData.fighter_b_id) {
          toast({
            title: 'Error',
            description: 'Debes seleccionar el Peleador B',
            variant: 'destructive',
          });
          return;
        }
        // Validar que no sean el mismo
        if (fighterAId && fightData.fighter_b_id === fighterAId) {
          toast({
            title: 'Error',
            description: 'No puedes asignar el mismo peleador dos veces',
            variant: 'destructive',
          });
          return;
        }
        fighterBId = fightData.fighter_b_id;
      } else {
        // Crear o mantener peleador externo B
        if (editingFight?.fighter_b_external_id) {
          fighterBExternalId = editingFight.fighter_b_external_id;
        } else {
          if (!externalFighterBData.name || !externalFighterBData.weight_class) {
            toast({
              title: 'Error',
              description: 'Debes completar nombre y categoría del Peleador B',
              variant: 'destructive',
            });
            return;
          }
          const externalId = await createExternalFighter(externalFighterBData, imageFileB);
          if (!externalId) return;
          fighterBExternalId = externalId;
        }
      }

      // 4. SUBIR FOTOS ESPECÍFICAS DEL EVENTO
      let fighterAEventImageUrl: string | null = editingFight?.fighter_a_event_image_url || null;
      let fighterBEventImageUrl: string | null = editingFight?.fighter_b_event_image_url || null;

      // Subir foto de evento para peleador A (si existe nueva)
      if (eventImageFileA) {
        const fileExt = eventImageFileA.name.split('.').pop();
        const fileName = `${Date.now()}-fighter-a-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadErrorA } = await supabase.storage
          .from('event-fighter-images')
          .upload(filePath, eventImageFileA);

        if (uploadErrorA) throw uploadErrorA;

        const { data: { publicUrl: publicUrlA } } = supabase.storage
          .from('event-fighter-images')
          .getPublicUrl(filePath);

        fighterAEventImageUrl = publicUrlA;
      }

      // Subir foto de evento para peleador B (si existe nueva)
      if (eventImageFileB) {
        const fileExt = eventImageFileB.name.split('.').pop();
        const fileName = `${Date.now()}-fighter-b-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadErrorB } = await supabase.storage
          .from('event-fighter-images')
          .upload(filePath, eventImageFileB);

        if (uploadErrorB) throw uploadErrorB;

        const { data: { publicUrl: publicUrlB } } = supabase.storage
          .from('event-fighter-images')
          .getPublicUrl(filePath);

        fighterBEventImageUrl = publicUrlB;
      }

      // 5. CREAR O ACTUALIZAR PELEA
      if (editingFight) {
        // ACTUALIZAR pelea existente
        const { error } = await supabase
          .from('fights')
          .update({
            fight_number: fightData.fight_number,
            fight_type: fightData.fight_type,
            fighter_a_id: fighterAId,
            fighter_b_id: fighterBId,
            fighter_a_external_id: fighterAExternalId,
            fighter_b_external_id: fighterBExternalId,
            fighter_a_event_image_url: fighterAEventImageUrl,
            fighter_b_event_image_url: fighterBEventImageUrl,
            weight_class: fightData.weight_class,
            card_position: fightData.card_position
          })
          .eq('id', editingFight.id);

        if (error) throw error;

        // GESTIONAR ROUNDS: crear o eliminar según el número especificado
        const { data: existingRounds } = await supabase
          .from('fight_rounds')
          .select('id, number')
          .eq('fight_id', editingFight.id)
          .order('number');

        const currentRoundsCount = existingRounds?.length || 0;
        const desiredRounds = fightData.number_of_rounds;

        if (currentRoundsCount < desiredRounds) {
          // Crear rounds faltantes
          const roundsToCreate = [];
          for (let i = currentRoundsCount + 1; i <= desiredRounds; i++) {
            roundsToCreate.push({
              fight_id: editingFight.id,
              number: i,
              duration_seconds: 300,
              status: 'scheduled'
            });
          }

          if (roundsToCreate.length > 0) {
            await supabase.from('fight_rounds').insert(roundsToCreate);
          }
        } else if (currentRoundsCount > desiredRounds) {
          // Eliminar rounds sobrantes (solo si no tienen datos)
          const roundsToDelete = existingRounds
            ?.filter(r => r.number > desiredRounds)
            .map(r => r.id) || [];
          
          if (roundsToDelete.length > 0) {
            await supabase
              .from('fight_rounds')
              .delete()
              .in('id', roundsToDelete);
          }
        }

        toast({
          title: '✅ Pelea actualizada',
          description: `Pelea #${fightData.fight_number} actualizada con ${desiredRounds} rounds`,
        });
      } else {
        // CREAR pelea nueva
        const { data, error } = await supabase
          .from('fights')
          .insert({
            event_id: selectedEvent.id,
            fight_number: fightData.fight_number,
            fight_type: fightData.fight_type,
            fighter_a_id: fighterAId,
            fighter_b_id: fighterBId,
            fighter_a_external_id: fighterAExternalId,
            fighter_b_external_id: fighterBExternalId,
            fighter_a_event_image_url: fighterAEventImageUrl,
            fighter_b_event_image_url: fighterBEventImageUrl,
            weight_class: fightData.weight_class,
            status: 'scheduled',
            card_position: fightData.card_position
          })
          .select()
          .single();

        if (error) throw error;

        // 6. VERIFICAR Y CREAR ROUNDS SEGÚN EL NÚMERO ESPECIFICADO
        const { data: existingRounds, error: roundsCheckError } = await supabase
          .from('fight_rounds')
          .select('id, number, status')
          .eq('fight_id', data.id)
          .order('number');

        const currentRoundsCount = existingRounds?.length || 0;
        const desiredRounds = fightData.number_of_rounds;

        if (currentRoundsCount < desiredRounds) {
          // Crear los rounds faltantes
          const roundsToCreate = [];
          for (let i = currentRoundsCount + 1; i <= desiredRounds; i++) {
            roundsToCreate.push({
              fight_id: data.id,
              number: i,
              duration_seconds: 300, // 5 minutos por defecto
              status: 'scheduled'
            });
          }

          if (roundsToCreate.length > 0) {
            const { error: createRoundsError } = await supabase
              .from('fight_rounds')
              .insert(roundsToCreate);

            if (createRoundsError) {
              console.error('Error creating additional rounds:', createRoundsError);
              toast({
                title: 'Advertencia',
                description: `Pelea creada pero hubo un problema al crear todos los rounds`,
                variant: 'destructive',
              });
            }
          }
        }

        toast({
          title: '✅ Éxito',
          description: `Pelea #${data.fight_number} creada con ${desiredRounds} rounds`,
        });
      }

      // 7. RESET FORM Y CERRAR DIALOG
      resetFightForm();
      setShowFightsDialog(false);

    } catch (error: any) {
      console.error('Fight save error:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la pelea',
        variant: 'destructive',
      });
    }
  };

  const resetFightForm = () => {
    setFightData({
      fight_number: editingFight ? fightData.fight_number : fightData.fight_number + 1,
      fight_type: 'AMATEUR',
      fighter_a_id: '',
      fighter_b_id: '',
      weight_class: '',
      card_position: 'regular',
      number_of_rounds: 3
    });
    setFighterAIsRegistered(true);
    setFighterBIsRegistered(true);
    setExternalFighterAData({
      name: '',
      nickname: '',
      weight_class: '',
      gym: '',
      country: 'HN',
      record: { wins: 0, losses: 0, draws: 0 }
    });
    setExternalFighterBData({
      name: '',
      nickname: '',
      weight_class: '',
      gym: '',
      country: 'HN',
      record: { wins: 0, losses: 0, draws: 0 }
    });
    setImageFileA(undefined);
    setImageFileB(undefined);
    setEventImageFileA(undefined);
    setEventImageFileB(undefined);
    setEditingFight(null);
  };

  const handleEditFight = async (fight: any) => {
    // Obtener el número de rounds actuales
    const { count } = await supabase
      .from('fight_rounds')
      .select('*', { count: 'exact', head: true })
      .eq('fight_id', fight.id);
    
    setEditingFight(fight);
    setFightData({
      fight_number: fight.fight_number,
      fight_type: fight.fight_type,
      fighter_a_id: fight.fighter_a_id || '',
      fighter_b_id: fight.fighter_b_id || '',
      weight_class: fight.weight_class,
      card_position: fight.card_position || 'regular',
      number_of_rounds: count || 3
    });
    
    // Determinar si los peleadores son registrados o externos
    setFighterAIsRegistered(!!fight.fighter_a_id);
    setFighterBIsRegistered(!!fight.fighter_b_id);
    
    // Cargar datos de peleadores externos si existen
    if (fight.fighter_a_external_id) {
      const { data: externalA } = await supabase
        .from('external_fighters')
        .select('*')
        .eq('id', fight.fighter_a_external_id)
        .single();
      
      if (externalA) {
        const recordA = typeof externalA.record === 'object' && externalA.record !== null
          ? externalA.record as { wins: number; losses: number; draws: number }
          : { wins: 0, losses: 0, draws: 0 };
          
        setExternalFighterAData({
          name: externalA.name || '',
          nickname: externalA.nickname || '',
          weight_class: externalA.weight_class || '',
          gym: externalA.gym || '',
          country: externalA.country || 'HN',
          record: recordA
        });
      }
    }
    
    if (fight.fighter_b_external_id) {
      const { data: externalB } = await supabase
        .from('external_fighters')
        .select('*')
        .eq('id', fight.fighter_b_external_id)
        .single();
      
      if (externalB) {
        const recordB = typeof externalB.record === 'object' && externalB.record !== null
          ? externalB.record as { wins: number; losses: number; draws: number }
          : { wins: 0, losses: 0, draws: 0 };
          
        setExternalFighterBData({
          name: externalB.name || '',
          nickname: externalB.nickname || '',
          weight_class: externalB.weight_class || '',
          gym: externalB.gym || '',
          country: externalB.country || 'HN',
          record: recordB
        });
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast({
        title: 'Éxito',
        description: 'Evento eliminado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el evento',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublish = async (eventId: string, currentPublished: boolean) => {
    try {
      await togglePublishEvent(eventId, !currentPublished);
      toast({
        title: 'Éxito',
        description: !currentPublished 
          ? 'Evento publicado y visible al público' 
          : 'Evento despublicado y ahora es privado',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la visibilidad del evento',
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

  const EventIcon = Trophy;

  const eventFightersData = eventFighters.map(fighterId => 
    availableFighters.find(f => f.id === fighterId)
  ).filter(Boolean);

  console.log('[EventosPelea] Render - loading:', loading, 'events:', events, 'events.length:', events?.length);

  if (loading) {
    console.log('[EventosPelea] Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  console.log('[EventosPelea] Not loading, checking events array');
  
  const hasEvents = Array.isArray(events) && events.length > 0;
  console.log('[EventosPelea] hasEvents:', hasEvents, 'events:', events);
  
  if (!hasEvents) {
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
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
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
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay eventos creados</h3>
            <p className="text-muted-foreground mb-4">Crea tu primer evento de pelea para comenzar</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Evento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('[EventosPelea] Rendering events table with', events.length, 'events');

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
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
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
                <TableHead>Visibilidad</TableHead>
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
                      <EventIcon className="h-5 w-5" />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(event.id, event.published)}
                      className={event.published ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}
                    >
                      {event.published ? (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Público
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Privado
                        </>
                      )}
                    </Button>
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
                          resetFightForm();
                          setShowFightsDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Peleas
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el evento "{event.name}" y todas las peleas asociadas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
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
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o apodo..."
                  value={fighterSearchTerm}
                  onChange={(e) => setFighterSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableFighters
                  .filter(f => !eventFighters.includes(f.id))
                  .filter(f => {
                    if (!fighterSearchTerm) return true;
                    const searchLower = fighterSearchTerm.toLowerCase();
                    const fullName = `${f.first_name} ${f.last_name}`.toLowerCase();
                    const nickname = f.nickname?.toLowerCase() || '';
                    return fullName.includes(searchLower) || nickname.includes(searchLower);
                  })
                  .map((fighter) => (
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
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFight ? 'Editar Pelea' : 'Crear Peleas'} - {selectedEvent?.name}
            </DialogTitle>
            <DialogDescription>
              {editingFight ? 'Modifica los datos de la pelea' : 'Crea peleas entre los peleadores del evento'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <Label>Número de Rounds</Label>
                <Select 
                  value={fightData.number_of_rounds.toString()} 
                  onValueChange={(value) => setFightData(prev => ({...prev, number_of_rounds: parseInt(value)}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Round</SelectItem>
                    <SelectItem value="2">2 Rounds</SelectItem>
                    <SelectItem value="3">3 Rounds</SelectItem>
                    <SelectItem value="5">5 Rounds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Peleador A</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fighter-a-registered" className="text-xs text-muted-foreground">
                      ¿Registrado?
                    </Label>
                    <Switch
                      id="fighter-a-registered"
                      checked={fighterAIsRegistered}
                      onCheckedChange={setFighterAIsRegistered}
                    />
                  </div>
                </div>
                
                 {fighterAIsRegistered ? (
                  <>
                    <Select value={fightData.fighter_a_id} onValueChange={(value) => setFightData(prev => ({...prev, fighter_a_id: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar peleador" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFighters.map((fighter) => (
                          <SelectItem key={fighter.id} value={fighter.id}>
                            {fighter.first_name} {fighter.last_name} {fighter.nickname && `"${fighter.nickname}"`}
                            <span className="text-xs text-muted-foreground ml-2">({fighter.weight_class})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2">
                      <Label className="text-xs text-muted-foreground">Foto para miniatura 3D (opcional)</Label>
                      
                      {/* Preview de imagen existente */}
                      {editingFight?.fighter_a_event_image_url && !eventImageFileA && (
                        <div className="mb-2 p-2 border rounded bg-muted/20">
                          <img 
                            src={editingFight.fighter_a_event_image_url} 
                            alt="Preview A"
                            className="h-24 w-auto mx-auto object-contain mb-2"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={async () => {
                                const confirmed = confirm('¿Eliminar la imagen del evento? Se usará la foto del perfil.');
                                if (confirmed) {
                                  setEditingFight((prev: any) => ({...prev, fighter_a_event_image_url: null}));
                                  // Actualizar en BD
                                  await supabase
                                    .from('fights')
                                    .update({ fighter_a_event_image_url: null })
                                    .eq('id', editingFight.id);
                                  toast({
                                    title: 'Imagen eliminada',
                                    description: 'Se usará la foto del perfil del peleador',
                                  });
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <FileUpload
                        accept="image/*"
                        onFileSelect={setEventImageFileA}
                        onRemoveFile={() => setEventImageFileA(undefined)}
                        maxSize={50}
                        autoResize={false}
                        showResizeInfo={false}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Si no subes foto, se usará la del perfil (máx. 50MB)
                      </p>
                      
                      {/* Botón para usar avatar del perfil */}
                      {fightData.fighter_a_id && !eventImageFileA && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1 text-xs"
                          onClick={async () => {
                            const fighter = availableFighters.find(f => f.id === fightData.fighter_a_id);
                            if (fighter?.avatar_url) {
                              await supabase
                                .from('fights')
                                .update({ fighter_a_event_image_url: fighter.avatar_url })
                                .eq('id', editingFight?.id);
                              setEditingFight((prev: any) => ({...prev, fighter_a_event_image_url: fighter.avatar_url}));
                              toast({
                                title: 'Avatar copiado',
                                description: 'Se usará la foto del perfil como imagen del evento',
                              });
                            }
                          }}
                        >
                          Usar foto del perfil
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="border rounded-lg p-3 bg-muted/30 max-h-[50vh] overflow-y-auto">
                    <ExternalFighterForm
                      formData={externalFighterAData}
                      imageFile={imageFileA}
                      onFormChange={setExternalFighterAData}
                      onImageChange={setImageFileA}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Peleador B</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fighter-b-registered" className="text-xs text-muted-foreground">
                      ¿Registrado?
                    </Label>
                    <Switch
                      id="fighter-b-registered"
                      checked={fighterBIsRegistered}
                      onCheckedChange={setFighterBIsRegistered}
                    />
                  </div>
                </div>
                
                {fighterBIsRegistered ? (
                  <>
                    <Select value={fightData.fighter_b_id} onValueChange={(value) => setFightData(prev => ({...prev, fighter_b_id: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar peleador" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFighters
                          .filter(f => f.id !== fightData.fighter_a_id)
                          .map((fighter) => (
                            <SelectItem key={fighter.id} value={fighter.id}>
                              {fighter.first_name} {fighter.last_name} {fighter.nickname && `"${fighter.nickname}"`}
                              <span className="text-xs text-muted-foreground ml-2">({fighter.weight_class})</span>
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <div className="mt-2">
                      <Label className="text-xs text-muted-foreground">Foto para miniatura 3D (opcional)</Label>
                      
                      {/* Preview de imagen existente */}
                      {editingFight?.fighter_b_event_image_url && !eventImageFileB && (
                        <div className="mb-2 p-2 border rounded bg-muted/20">
                          <img 
                            src={editingFight.fighter_b_event_image_url} 
                            alt="Preview B"
                            className="h-24 w-auto mx-auto object-contain mb-2"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={async () => {
                                const confirmed = confirm('¿Eliminar la imagen del evento? Se usará la foto del perfil.');
                                if (confirmed) {
                                  setEditingFight((prev: any) => ({...prev, fighter_b_event_image_url: null}));
                                  // Actualizar en BD
                                  await supabase
                                    .from('fights')
                                    .update({ fighter_b_event_image_url: null })
                                    .eq('id', editingFight.id);
                                  toast({
                                    title: 'Imagen eliminada',
                                    description: 'Se usará la foto del perfil del peleador',
                                  });
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <FileUpload
                        accept="image/*"
                        onFileSelect={setEventImageFileB}
                        onRemoveFile={() => setEventImageFileB(undefined)}
                        maxSize={50}
                        autoResize={false}
                        showResizeInfo={false}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Si no subes foto, se usará la del perfil (máx. 50MB)
                      </p>
                      
                      {/* Botón para usar avatar del perfil */}
                      {fightData.fighter_b_id && !eventImageFileB && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1 text-xs"
                          onClick={async () => {
                            const fighter = availableFighters.find(f => f.id === fightData.fighter_b_id);
                            if (fighter?.avatar_url) {
                              await supabase
                                .from('fights')
                                .update({ fighter_b_event_image_url: fighter.avatar_url })
                                .eq('id', editingFight?.id);
                              setEditingFight((prev: any) => ({...prev, fighter_b_event_image_url: fighter.avatar_url}));
                              toast({
                                title: 'Avatar copiado',
                                description: 'Se usará la foto del perfil como imagen del evento',
                              });
                            }
                          }}
                        >
                          Usar foto del perfil
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="border rounded-lg p-3 bg-muted/30 max-h-[50vh] overflow-y-auto">
                    <ExternalFighterForm
                      formData={externalFighterBData}
                      imageFile={imageFileB}
                      onFormChange={setExternalFighterBData}
                      onImageChange={setImageFileB}
                    />
                  </div>
                )}
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
                <Label>Importancia</Label>
                <Select value={fightData.card_position} onValueChange={(value: 'main_event' | 'co_main_event' | 'regular') => setFightData(prev => ({...prev, card_position: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Normal</SelectItem>
                    <SelectItem value="co_main_event">Co-Estelar</SelectItem>
                    <SelectItem value="main_event">Estelar ⭐</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Peleas Existentes */}
            {selectedEvent && <FightsListPreview eventId={selectedEvent.id} onEditFight={handleEditFight} />}
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-background border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => {
              resetFightForm();
              setShowFightsDialog(false);
            }}>
              Cerrar
            </Button>
            {editingFight && (
              <Button variant="outline" onClick={resetFightForm}>
                Cancelar Edición
              </Button>
            )}
            <Button onClick={handleSaveFight}>
              {editingFight ? 'Actualizar Pelea' : 'Crear Pelea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para mostrar peleas existentes con indicador de rounds
const FightsListPreview = ({ eventId, onEditFight }: { eventId: string; onEditFight: (fight: any) => void }) => {
  const { fights, loading } = useFights(eventId);
  const [roundsData, setRoundsData] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchRoundsCount = async () => {
      if (fights.length === 0) return;
      
      const counts: Record<string, number> = {};
      for (const fight of fights) {
        const { count } = await supabase
          .from('fight_rounds')
          .select('*', { count: 'exact', head: true })
          .eq('fight_id', fight.id);
        counts[fight.id] = count || 0;
      }
      setRoundsData(counts);
    };
    
    fetchRoundsCount();
  }, [fights]);

  if (loading) {
    return (
      <div className="mt-4 border-t pt-4">
        <h4 className="font-semibold mb-2">Peleas del Evento</h4>
        <div className="text-sm text-muted-foreground">Cargando peleas...</div>
      </div>
    );
  }

  if (fights.length === 0) {
    return (
      <div className="mt-4 border-t pt-4">
        <h4 className="font-semibold mb-2">Peleas del Evento</h4>
        <div className="text-sm text-muted-foreground">No hay peleas creadas aún</div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-semibold mb-2">Peleas del Evento ({fights.length})</h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {fights.map(fight => (
          <div key={fight.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded hover:bg-muted/80 transition-colors">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Pelea #{fight.fight_number}</span>
              <Badge variant="secondary" className="text-xs">{fight.fight_type}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{fight.weight_class}</Badge>
              <Badge variant={roundsData[fight.id] > 0 ? 'default' : 'destructive'}>
                {roundsData[fight.id] || 0} {roundsData[fight.id] === 1 ? 'round' : 'rounds'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await onEditFight(fight);
                }}
                className="h-7 px-2"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar pelea?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente la Pelea #{fight.fight_number} y todos sus rounds asociados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          // Eliminar rounds primero
                          await supabase
                            .from('fight_rounds')
                            .delete()
                            .eq('fight_id', fight.id);
                          
                          // Eliminar pelea
                          const { error } = await supabase
                            .from('fights')
                            .delete()
                            .eq('id', fight.id);

                          if (error) throw error;

                          toast({
                            title: 'Pelea eliminada',
                            description: `Pelea #${fight.fight_number} eliminada correctamente`,
                          });

                          // Refrescar lista
                          window.location.reload();
                        } catch (error) {
                          console.error('Error deleting fight:', error);
                          toast({
                            title: 'Error',
                            description: 'No se pudo eliminar la pelea',
                            variant: 'destructive',
                          });
                        }
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};