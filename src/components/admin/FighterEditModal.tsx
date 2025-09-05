import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from '@/hooks/use-toast';
import { useFighterProfiles, FighterProfile, AdminFighterFormData } from '@/hooks/useFighterProfiles';

const WEIGHT_CLASSES = [
  'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight', 
  'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
];

const DISCIPLINES = [
  'MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'
];

interface FighterEditModalProps {
  fighter: FighterProfile;
  open: boolean;
  onClose: () => void;
}

export function FighterEditModal({ fighter, open, onClose }: FighterEditModalProps) {
  const { adminUpdateFighterProfile } = useFighterProfiles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AdminFighterFormData>({
    first_name: '',
    last_name: '',
    nickname: '',
    country: 'HN',
    weight_class: 'Lightweight',
    avatar_url: '',
    discipline: undefined,
    record_wins: 0,
    record_losses: 0,
    record_draws: 0,
    elo_rating: 1200,
  });

  useEffect(() => {
    if (fighter) {
      setFormData({
        first_name: fighter.first_name,
        last_name: fighter.last_name,
        nickname: fighter.nickname || '',
        country: fighter.country || 'HN',
        weight_class: fighter.weight_class,
        avatar_url: fighter.avatar_url || '',
        discipline: fighter.discipline || undefined,
        record_wins: fighter.record_wins,
        record_losses: fighter.record_losses,
        record_draws: fighter.record_draws,
        elo_rating: fighter.elo_rating,
      });
    }
  }, [fighter]);

  const handleChange = (field: keyof AdminFighterFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre y apellido son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Handle avatar upload if a new file was selected
      let finalFormData = { ...formData };
      
      if ((formData as any)._avatarFile) {
        const { uploadFighterAvatar } = await import('@/lib/photoUtils');
        const avatarUrl = await uploadFighterAvatar(
          (formData as any)._avatarFile, 
          fighter.user_id, 
          fighter.id,
          fighter.avatar_url
        );
        
        if (avatarUrl) {
          finalFormData.avatar_url = avatarUrl;
        }
        
        // Clean up temporary properties
        delete (finalFormData as any)._avatarFile;
      }

      console.log('Enviando datos para actualizar:', finalFormData);
      
      // Prepare form data with proper null handling for empty/undefined values
      const sanitizedData = {
        ...finalFormData,
        // Convert undefined to null for proper database handling
        discipline: finalFormData.discipline === undefined ? null : finalFormData.discipline,
        nickname: finalFormData.nickname === '' ? null : finalFormData.nickname,
      };
      
      console.log('Datos sanitizados enviados a la BD:', sanitizedData);
      
      const success = await adminUpdateFighterProfile(fighter.id, sanitizedData);
      if (success) {
        toast({
          title: "¡Actualización exitosa!",
          description: "El perfil del peleador ha sido actualizado correctamente.",
        });
        onClose();
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar Perfil: {fighter.first_name} {fighter.last_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Nombre *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Apellido *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nickname">Apodo</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => handleChange('nickname', e.target.value)}
                    placeholder="Ej: El Destructor"
                  />
                </div>

                <div>
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="discipline">Disciplina</Label>
                  <Select 
                    value={formData.discipline || undefined} 
                    onValueChange={(value) => handleChange('discipline', value === 'none' ? undefined : value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin disciplina específica</SelectItem>
                      {DISCIPLINES.map(discipline => (
                        <SelectItem key={discipline} value={discipline}>
                          {discipline}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Categoría de Peso y Avatar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categoría de Peso y Avatar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="weight_class">Categoría de Peso *</Label>
                  <Select 
                    value={formData.weight_class} 
                    onValueChange={(value) => handleChange('weight_class', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEIGHT_CLASSES.map(weight => (
                        <SelectItem key={weight} value={weight}>
                          {weight}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Foto de Perfil</Label>
                  <FileUpload
                    accept="image/*" 
                    onFileSelect={async (file) => {
                      try {
                        // Store the file for upload during form submission
                        (formData as any)._avatarFile = file;
                        
                        // Create temporary URL for preview only
                        const tempUrl = URL.createObjectURL(file);
                        handleChange('avatar_url', tempUrl);
                      } catch (error) {
                        console.error('Error handling file selection:', error);
                      }
                    }}
                    maxSize={5 * 1024 * 1024}
                    className="mt-2"
                  />
                  {formData.avatar_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.avatar_url} 
                        alt="Preview" 
                        className="w-20 h-20 rounded-full object-cover border"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Récord y Estadísticas */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Récord y Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="record_wins">Victorias</Label>
                    <Input
                      id="record_wins"
                      type="number"
                      min="0"
                      value={formData.record_wins}
                      onChange={(e) => handleChange('record_wins', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="record_losses">Derrotas</Label>
                    <Input
                      id="record_losses"
                      type="number"
                      min="0"
                      value={formData.record_losses}
                      onChange={(e) => handleChange('record_losses', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="record_draws">Empates</Label>
                    <Input
                      id="record_draws"
                      type="number"
                      min="0"
                      value={formData.record_draws}
                      onChange={(e) => handleChange('record_draws', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="elo_rating">ELO Rating</Label>
                    <Input
                      id="elo_rating"
                      type="number"
                      min="800"
                      max="2000"
                      value={formData.elo_rating}
                      onChange={(e) => handleChange('elo_rating', parseInt(e.target.value) || 1200)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}