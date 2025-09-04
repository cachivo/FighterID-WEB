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
import { useFighterProfiles, FighterProfile, AdminFighterFormData } from '@/hooks/useFighterProfiles';

const WEIGHT_CLASSES = [
  'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight', 
  'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
];

const FIGHTING_STYLES = [
  'Peleador Técnico',
  'Brawler/Agresivo',
  'Contra-Atacador',
  'Finalizador',
  'Grappler',
  'Striker',
  'Híbrido',
  'Defensivo',
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
    height_cm: undefined,
    weight_kg: undefined,
    reach_cm: undefined,
    fighting_style: '',
    gym_name: '',
    bio: '',
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
        height_cm: fighter.height_cm,
        weight_kg: fighter.weight_kg,
        reach_cm: fighter.reach_cm,
        fighting_style: fighter.fighting_style || '',
        gym_name: fighter.gym_name || '',
        bio: fighter.bio || '',
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

      const success = await adminUpdateFighterProfile(fighter.id, finalFormData);
      if (success) {
        onClose();
      }
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
                  <Label htmlFor="gym_name">Gimnasio/Academia</Label>
                  <Input
                    id="gym_name"
                    value={formData.gym_name}
                    onChange={(e) => handleChange('gym_name', e.target.value)}
                    placeholder="Ej: Gracie Barra"
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
                    value={formData.discipline || ''} 
                    onValueChange={(value) => handleChange('discipline', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una disciplina" />
                    </SelectTrigger>
                    <SelectContent>
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

            {/* Información Física */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Física</CardTitle>
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="height_cm">Altura (cm)</Label>
                    <Input
                      id="height_cm"
                      type="number"
                      value={formData.height_cm || ''}
                      onChange={(e) => handleChange('height_cm', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight_kg">Peso (kg)</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.1"
                      value={formData.weight_kg || ''}
                      onChange={(e) => handleChange('weight_kg', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reach_cm">Alcance (cm)</Label>
                    <Input
                      id="reach_cm"
                      type="number"
                      value={formData.reach_cm || ''}
                      onChange={(e) => handleChange('reach_cm', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fighting_style">¿Qué tipo de peleador eres?</Label>
                  <Select 
                    value={formData.fighting_style} 
                    onValueChange={(value) => handleChange('fighting_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIGHTING_STYLES.map(style => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Récord y Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Récord y Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
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
              </CardContent>
            </Card>

            {/* Avatar y Biografía */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avatar y Biografía</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div>
                  <Label htmlFor="bio">Biografía</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Información adicional sobre el peleador..."
                    rows={4}
                  />
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