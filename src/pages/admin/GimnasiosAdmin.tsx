import { useState, useMemo } from 'react';
import { useGyms, useCreateGym, useCheckGymDuplicate } from '@/hooks/useGyms';
import { useAllDisciplines } from '@/hooks/gyms';
import { useDiscipline } from '@/contexts/DisciplineContext';
import { AdminGymCard } from '@/components/admin/AdminGymCard';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Building2, AlertTriangle, Mail, Loader2, Search } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function GimnasiosAdmin() {
  const { data: gyms, isLoading } = useGyms();
  const { data: disciplines } = useAllDisciplines();
  const createGym = useCreateGym();
  const { isSuperAdmin } = useSuperAdmin();
  const discipline = useDiscipline();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();
  
  const watchedNombre = useWatch({ control, name: 'nombre', defaultValue: '' });
  const { isDuplicate, existingGym, isChecking } = useCheckGymDuplicate(watchedNombre || '');

  const filteredGyms = useMemo(() => {
    if (!gyms) return [];
    let result = gyms.filter(g =>
      g.disciplinas?.some(d => d === discipline)
    );
    // Then filter by search query
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(g =>
      g.nombre.toLowerCase().includes(q) ||
      g.ciudad?.toLowerCase().includes(q) ||
      g.pais?.toLowerCase().includes(q) ||
      g.disciplinas?.some(d => d.toLowerCase().includes(q))
    );
  }, [gyms, searchQuery, discipline]);

  const toggleDiscipline = (id: string) => {
    setSelectedDisciplines(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: any) => {
    try {
      const slug = data.nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const selectedNames = disciplines
        ?.filter(d => selectedDisciplines.includes(d.id))
        .map(d => d.name) || [];

      const newGym = await createGym.mutateAsync({
        ...data,
        slug,
        disciplinas: selectedNames,
      });

      if (selectedDisciplines.length > 0 && newGym?.id) {
        await supabase.from('gym_disciplines').insert(
          selectedDisciplines.map(id => ({ gym_id: newGym.id, discipline_id: id }))
        );
      }

      if (data.coach_email && newGym?.id) {
        setSendingInvitation(true);
        try {
          const { error: invError } = await supabase.functions.invoke('send-gym-invitation', {
            body: { gymId: newGym.id, email: data.coach_email, coachName: data.coach_name || undefined },
          });
          if (invError) throw invError;
          toast.success(`Invitación enviada a ${data.coach_email}`);
        } catch (invErr: any) {
          console.error('Error sending gym invitation:', invErr);
          toast.error('Gimnasio creado, pero falló el envío de invitación: ' + (invErr.message || 'Error desconocido'));
        } finally {
          setSendingInvitation(false);
        }
      }

      reset();
      setSelectedDisciplines([]);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error('Error al crear gimnasio: ' + error.message);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gimnasios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los gimnasios de la plataforma
            {gyms && (
              <Badge variant="secondary" className="ml-2">{gyms.length}</Badge>
            )}
          </p>
        </div>

        {isSuperAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Crear Gimnasio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Gimnasio</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input 
                    id="nombre" 
                    {...register('nombre', { required: 'El nombre es requerido' })}
                    placeholder="Alfa Omega MMA"
                  />
                  {errors.nombre && <p className="text-sm text-destructive mt-1">{errors.nombre.message as string}</p>}
                  {isDuplicate && existingGym && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Ya existe: <strong>{existingGym.nombre}</strong>{existingGym.ciudad ? ` — ${existingGym.ciudad}` : ''}. Puedes editarlo desde su tarjeta.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coach_email">Email Entrenador Principal *</Label>
                    <Input 
                      id="coach_email" 
                      type="email"
                      {...register('coach_email', { required: 'El email del entrenador es requerido' })}
                      placeholder="coach@email.com"
                    />
                    {errors.coach_email && <p className="text-sm text-destructive mt-1">{errors.coach_email.message as string}</p>}
                  </div>
                  <div>
                    <Label htmlFor="coach_name">Nombre del Entrenador</Label>
                    <Input 
                      id="coach_name" 
                      {...register('coach_name')}
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea 
                    id="descripcion" 
                    {...register('descripcion')}
                    placeholder="Breve descripción del gimnasio..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input id="ciudad" {...register('ciudad')} placeholder="Tegucigalpa" />
                  </div>
                  <div>
                    <Label htmlFor="pais">País</Label>
                    <Input id="pais" {...register('pais')} defaultValue="Honduras" />
                  </div>
                </div>

                <div>
                  <Label>Disciplinas</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {disciplines?.map(disc => (
                      <label key={disc.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={selectedDisciplines.includes(disc.id)}
                          onCheckedChange={() => toggleDiscipline(disc.id)}
                        />
                        {disc.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input id="telefono" {...register('telefono')} placeholder="+504 1234-5678" />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" {...register('whatsapp')} placeholder="+504 1234-5678" />
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createGym.isPending || isDuplicate || sendingInvitation}>
                    {(createGym.isPending || sendingInvitation) ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{sendingInvitation ? 'Enviando invitación...' : 'Creando...'}</>
                    ) : (
                      <><Mail className="mr-2 h-4 w-4" />Crear y Enviar Invitación</>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, ciudad o disciplina..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : filteredGyms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGyms.map(gym => (
            <AdminGymCard key={gym.id} gym={gym} readOnly={!isSuperAdmin} />
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No se encontraron gimnasios para "{searchQuery}"</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No hay gimnasios registrados</p>
          {isSuperAdmin && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Gimnasio
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
