import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUpdateGym } from '@/hooks/useGyms';
import type { Gym } from '@/types/gyms';

interface GymEditModalProps {
  gym: Gym;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GymEditModal({ gym, open, onOpenChange }: GymEditModalProps) {
  const updateGym = useUpdateGym(gym.id);
  
  const [formData, setFormData] = useState({
    nombre: gym.nombre || '',
    descripcion: gym.descripcion || '',
    ciudad: gym.ciudad || '',
    pais: gym.pais || '',
    disciplinas: gym.disciplinas?.join(', ') || '',
    telefono: gym.telefono || '',
    whatsapp: gym.whatsapp || '',
    email: gym.email || '',
    direccion: gym.direccion || '',
    instagram: gym.instagram || '',
    facebook: gym.facebook || '',
    website: gym.website || '',
  });

  useEffect(() => {
    setFormData({
      nombre: gym.nombre || '',
      descripcion: gym.descripcion || '',
      ciudad: gym.ciudad || '',
      pais: gym.pais || '',
      disciplinas: gym.disciplinas?.join(', ') || '',
      telefono: gym.telefono || '',
      whatsapp: gym.whatsapp || '',
      email: gym.email || '',
      direccion: gym.direccion || '',
      instagram: gym.instagram || '',
      facebook: gym.facebook || '',
      website: gym.website || '',
    });
  }, [gym]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateGym.mutateAsync({
      nombre: formData.nombre,
      descripcion: formData.descripcion || null,
      ciudad: formData.ciudad || null,
      pais: formData.pais || null,
      disciplinas: formData.disciplinas ? formData.disciplinas.split(',').map(d => d.trim()) : [],
      telefono: formData.telefono || null,
      whatsapp: formData.whatsapp || null,
      email: formData.email || null,
      direccion: formData.direccion || null,
      instagram: formData.instagram || null,
      facebook: formData.facebook || null,
      website: formData.website || null,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Gimnasio</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea 
              id="descripcion" 
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
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

          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Input 
              id="direccion" 
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="disciplinas">Disciplinas (separadas por coma)</Label>
            <Input 
              id="disciplinas" 
              value={formData.disciplinas}
              onChange={(e) => setFormData({ ...formData, disciplinas: e.target.value })}
              placeholder="MMA, Boxeo, BJJ"
            />
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

          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateGym.isPending}>
              {updateGym.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
