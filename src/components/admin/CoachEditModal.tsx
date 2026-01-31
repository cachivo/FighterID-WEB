import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { useUpdateCoach } from '@/hooks/useCoaches';
import { useGyms } from '@/hooks/useGyms';
import { supabase } from '@/integrations/supabase/client';
import type { Coach } from '@/types/gyms';

interface CoachEditModalProps {
  coach: Coach;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoachEditModal({ coach, open, onOpenChange }: CoachEditModalProps) {
  const updateCoach = useUpdateCoach(coach.id);
  const { data: gyms } = useGyms();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(coach.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: coach.nombre || '',
    apellidos: coach.apellidos || '',
    bio: coach.bio || '',
    gym_id: coach.gym_id || '',
    especialidades: coach.especialidades?.join(', ') || '',
    ciudad: coach.ciudad || '',
    pais: coach.pais || '',
    telefono: coach.telefono || '',
    whatsapp: coach.whatsapp || '',
    email: coach.email || '',
    instagram: coach.instagram || '',
    facebook: coach.facebook || '',
  });

  const uploadAvatar = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${coach.slug}-${Date.now()}.${fileExt}`;
    
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

  useEffect(() => {
    setFormData({
      nombre: coach.nombre || '',
      apellidos: coach.apellidos || '',
      bio: coach.bio || '',
      gym_id: coach.gym_id || '',
      especialidades: coach.especialidades?.join(', ') || '',
      ciudad: coach.ciudad || '',
      pais: coach.pais || '',
      telefono: coach.telefono || '',
      whatsapp: coach.whatsapp || '',
      email: coach.email || '',
      instagram: coach.instagram || '',
      facebook: coach.facebook || '',
    });
    setAvatarPreview(coach.avatar_url || '');
    setAvatarFile(null);
  }, [coach]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let avatarUrl = coach.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }
      
      await updateCoach.mutateAsync({
        nombre: formData.nombre,
        apellidos: formData.apellidos || null,
        bio: formData.bio || null,
        gym_id: formData.gym_id || null,
        avatar_url: avatarUrl || null,
        especialidades: formData.especialidades ? formData.especialidades.split(',').map(e => e.trim()) : [],
        ciudad: formData.ciudad || null,
        pais: formData.pais || null,
        telefono: formData.telefono || null,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
      });
      
      onOpenChange(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Entrenador</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input 
                id="nombre" 
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input 
                id="apellidos" 
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Biografía</Label>
            <Textarea 
              id="bio" 
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="gym_id">Gimnasio</Label>
            <Select 
              value={formData.gym_id || '__none__'} 
              onValueChange={(value) => setFormData({ ...formData, gym_id: value === '__none__' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un gimnasio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin gimnasio</SelectItem>
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
                setAvatarPreview(coach.avatar_url || '');
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
              value={formData.especialidades}
              onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
              placeholder="MMA, BJJ, Striking"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input 
                id="ciudad" 
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pais">País</Label>
              <Input 
                id="pais" 
                value={formData.pais}
                onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input 
                id="telefono" 
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input 
                id="whatsapp" 
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input 
                id="instagram" 
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@usuario"
              />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input 
                id="facebook" 
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateCoach.isPending || isUploading}>
              {updateCoach.isPending || isUploading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
