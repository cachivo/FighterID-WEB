import { useState } from 'react';
import { useCoaches, useCreateCoach } from '@/hooks/useCoaches';
import { useGyms } from '@/hooks/useGyms';
import { AdminCoachCard } from '@/components/admin/AdminCoachCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { Plus, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function EntrenadoresAdmin() {
  const { data: coaches, isLoading } = useCoaches();
  const { data: gyms } = useGyms();
  const createCoach = useCreateCoach();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGym, setSelectedGym] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const uploadAvatar = async (file: File, coachSlug: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${coachSlug}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('coaches')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('coaches')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const onSubmit = async (data: any) => {
    try {
      setIsUploading(true);
      const slug = `${data.nombre}-${data.apellidos || ''}`.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile, slug);
      }

      await createCoach.mutateAsync({
        ...data,
        slug,
        gym_id: selectedGym || null,
        avatar_url: avatarUrl,
        especialidades: data.especialidades ? data.especialidades.split(',').map((e: string) => e.trim()) : []
      });
      
      reset();
      setSelectedGym('');
      setAvatarFile(null);
      setAvatarPreview('');
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error('Error al crear entrenador: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Entrenadores</h1>
          <p className="text-muted-foreground">Gestiona los entrenadores de la plataforma</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Entrenador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Entrenador</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input 
                    id="nombre" 
                    {...register('nombre', { required: 'El nombre es requerido' })}
                    placeholder="Juan"
                  />
                  {errors.nombre && <p className="text-sm text-destructive mt-1">{errors.nombre.message as string}</p>}
                </div>
                <div>
                  <Label htmlFor="apellidos">Apellidos</Label>
                  <Input 
                    id="apellidos" 
                    {...register('apellidos')}
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biografía</Label>
                <Textarea 
                  id="bio" 
                  {...register('bio')}
                  placeholder="Breve biografía del entrenador..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="gym_id">Gimnasio</Label>
                <Select value={selectedGym} onValueChange={setSelectedGym}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un gimnasio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin gimnasio</SelectItem>
                    {gyms?.map(gym => (
                      <SelectItem key={gym.id} value={gym.id}>
                        {gym.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Foto de Perfil</Label>
                <FileUpload
                  onFileSelect={(file) => {
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }}
                  onRemoveFile={() => {
                    setAvatarFile(null);
                    setAvatarPreview('');
                  }}
                  accept="image/*"
                  maxSize={3}
                  preview={avatarPreview}
                  loading={isUploading}
                  autoResize={true}
                  resizeOptions={{ maxWidth: 300, maxHeight: 300, quality: 0.85 }}
                />
              </div>

              <div>
                <Label htmlFor="especialidades">Especialidades (separadas por coma)</Label>
                <Input 
                  id="especialidades" 
                  {...register('especialidades')}
                  placeholder="MMA, BJJ, Striking"
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
                <Button type="submit" disabled={createCoach.isPending || isUploading}>
                  {createCoach.isPending || isUploading ? 'Creando...' : 'Crear Entrenador'}
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
          {coaches?.map(coach => (
            <AdminCoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      )}

      {coaches?.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No hay entrenadores registrados</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Primer Entrenador
          </Button>
        </div>
      )}
    </div>
  );
}
