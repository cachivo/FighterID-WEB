import { useState } from 'react';
import { useGyms, useCreateGym } from '@/hooks/useGyms';
import { AdminGymCard } from '@/components/admin/AdminGymCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function GimnasiosAdmin() {
  const { data: gyms, isLoading } = useGyms();
  const createGym = useCreateGym();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const slug = data.nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      await createGym.mutateAsync({
        ...data,
        slug,
        disciplinas: data.disciplinas ? data.disciplinas.split(',').map((d: string) => d.trim()) : []
      });
      
      reset();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error('Error al crear gimnasio: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gimnasios</h1>
          <p className="text-muted-foreground">Gestiona los gimnasios de la plataforma</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Gimnasio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input 
                    id="ciudad" 
                    {...register('ciudad')}
                    placeholder="Tegucigalpa"
                  />
                </div>
                <div>
                  <Label htmlFor="pais">País</Label>
                  <Input 
                    id="pais" 
                    {...register('pais')}
                    defaultValue="Honduras"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="disciplinas">Disciplinas (separadas por coma)</Label>
                <Input 
                  id="disciplinas" 
                  {...register('disciplinas')}
                  placeholder="MMA, Boxeo, BJJ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input 
                    id="telefono" 
                    {...register('telefono')}
                    placeholder="+504 1234-5678"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input 
                    id="whatsapp" 
                    {...register('whatsapp')}
                    placeholder="+504 1234-5678"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createGym.isPending}>
                  {createGym.isPending ? 'Creando...' : 'Crear Gimnasio'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gyms?.map(gym => (
            <AdminGymCard key={gym.id} gym={gym} />
          ))}
        </div>
      )}

      {gyms?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No hay gimnasios registrados</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Primer Gimnasio
          </Button>
        </div>
      )}
    </div>
  );
}
