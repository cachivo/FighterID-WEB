import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FighterProfile, FighterProfileData, useFighterProfiles } from '@/hooks/useFighterProfiles';
import { useGyms } from '@/hooks/useGyms';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ENABLED_DISCIPLINES, WEIGHT_CLASSES } from '@/lib/constants/disciplines';

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


interface FighterProfileFormProps {
  existingProfile?: FighterProfile | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FighterProfileForm({ existingProfile, onSuccess, onCancel }: FighterProfileFormProps) {
  const [formData, setFormData] = useState<FighterProfileData>({
    first_name: '',
    last_name: '',
    nickname: '',
    country: 'HN',
    weight_class: '',
    height_cm: undefined,
    weight_kg: undefined,
    reach_cm: undefined,
    fighting_style: '',
    gym_name: '',
    gym_id: null,
    bio: '',
    avatar_url: '',
    discipline: undefined,
    martial_arts: [],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createFighterProfile } = useFighterProfiles();
  const { data: gyms, isLoading: gymsLoading, error: gymsError } = useGyms();
  const { toast } = useToast();

  // Debug: Log gyms data
  useEffect(() => {
    console.log('[FIGHTER FORM] Gyms data:', gyms);
    console.log('[FIGHTER FORM] Gyms loading:', gymsLoading);
    console.log('[FIGHTER FORM] Gyms error:', gymsError);
  }, [gyms, gymsLoading, gymsError]);

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        first_name: existingProfile.first_name,
        last_name: existingProfile.last_name,
        nickname: existingProfile.nickname || '',
        country: existingProfile.country,
        weight_class: existingProfile.weight_class,
        height_cm: existingProfile.height_cm,
        weight_kg: existingProfile.weight_kg,
        reach_cm: existingProfile.reach_cm,
        fighting_style: existingProfile.fighting_style || '',
        gym_name: existingProfile.gym_name || '',
        bio: existingProfile.bio || '',
        avatar_url: existingProfile.avatar_url || '',
        discipline: existingProfile.discipline,
        martial_arts: existingProfile.martial_arts || (existingProfile.discipline ? [existingProfile.discipline] : []),
      });
    }
  }, [existingProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (existingProfile) {
      toast({
        title: "Error",
        description: "Este formulario es solo para crear nuevos perfiles. Las ediciones deben realizarse a través del panel de administración.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.first_name || !formData.last_name || !formData.weight_class || !formData.martial_arts || formData.martial_arts.length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos (nombre, apellido, artes marciales y división)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createFighterProfile(formData);
      toast({
        title: "Perfil creado",
        description: "Tu perfil de peleador ha sido creado exitosamente",
      });
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FighterProfileData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const handleMartialArtsChange = (art: string, checked: boolean) => {
    const currentArts = formData.martial_arts || [];
    if (checked) {
      setFormData(prev => ({
        ...prev,
        martial_arts: [...currentArts, art],
        discipline: currentArts.length === 0 ? art as any : prev.discipline
      }));
    } else {
      const newArts = currentArts.filter(a => a !== art);
      setFormData(prev => ({
        ...prev,
        martial_arts: newArts,
        discipline: newArts.length > 0 ? newArts[0] as any : undefined
      }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-foreground">
          Crear Perfil de Peleador
        </CardTitle>
        {existingProfile && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mt-4">
            <p className="text-sm text-warning-foreground">
              <strong>Nota:</strong> Las ediciones de perfiles deben realizarse a través del panel de administración.
              Este formulario es solo para la creación inicial de perfiles.
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="text-foreground">Nombre *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Nombre"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="last_name" className="text-foreground">Apellido *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Apellido"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nickname" className="text-foreground">Apodo</Label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) => handleChange('nickname', e.target.value)}
              placeholder="Ej: El Tornado"
            />
          </div>

          <div>
              <Label htmlFor="gym_name" className="text-foreground">Gimnasio/Academia</Label>
              {gymsLoading && <p className="text-sm text-muted-foreground">Cargando gimnasios...</p>}
              {gymsError && <p className="text-sm text-destructive">Error al cargar gimnasios</p>}
              <Select 
                value={formData.gym_id || ''} 
                onValueChange={(value) => handleChange('gym_id', value || null)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecciona un gimnasio" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="" className="bg-popover hover:bg-accent">
                    Sin gimnasio
                  </SelectItem>
                  {gyms && gyms.length > 0 ? (
                    gyms.map(gym => (
                      <SelectItem key={gym.id} value={gym.id} className="bg-popover hover:bg-accent">
                        {gym.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-gyms" disabled className="bg-popover text-muted-foreground">
                      No hay gimnasios registrados
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {gyms ? `${gyms.length} gimnasio(s) disponible(s)` : 'Cargando...'}
              </p>
              <Input
                id="gym_name"
                value={formData.gym_name}
                onChange={(e) => handleChange('gym_name', e.target.value)}
                placeholder="O escribe el nombre del gimnasio manualmente"
                className="mt-2"
              />
          </div>

          <div>
            <Label className="text-foreground">¿En qué disciplina(s) deseas competir? *</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Selecciona las disciplinas para las cuales deseas obtener tu Fighter ID
            </p>
            <div className="grid grid-cols-1 gap-3">
              {ENABLED_DISCIPLINES.map((discipline) => (
                <div 
                  key={discipline.value} 
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.martial_arts?.includes(discipline.value) 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-muted-foreground/30'
                  }`}
                  onClick={() => handleMartialArtsChange(discipline.value, !formData.martial_arts?.includes(discipline.value))}
                >
                  <Checkbox
                    id={discipline.value}
                    checked={formData.martial_arts?.includes(discipline.value) || false}
                    onCheckedChange={(checked) => handleMartialArtsChange(discipline.value, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={discipline.value} className="text-sm font-medium cursor-pointer">
                      {discipline.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {discipline.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {formData.martial_arts && formData.martial_arts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.martial_arts.map((art) => (
                  <Badge key={art} variant="secondary" className="text-xs">
                    {art}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight_class" className="text-foreground">División *</Label>
              <Select
                value={formData.weight_class}
                onValueChange={(value) => handleChange('weight_class', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una división" />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_CLASSES.map(wc => (
                    <SelectItem key={wc.value} value={wc.value}>
                      {wc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecciona según tu peso de competencia
              </p>
            </div>
            
            <div>
              <Label htmlFor="fighting_style" className="text-foreground">¿Qué tipo de peleador eres?</Label>
              <Select
                value={formData.fighting_style}
                onValueChange={(value) => handleChange('fighting_style', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu tipo" />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="height_cm" className="text-foreground">Altura (cm)</Label>
              <Input
                id="height_cm"
                type="number"
                value={formData.height_cm || ''}
                onChange={(e) => {
                  const height = parseInt(e.target.value) || undefined;
                  setFormData(prev => ({
                    ...prev,
                    height_cm: height,
                    // Auto-calculate reach if not manually set
                    reach_cm: height && (!prev.reach_cm || prev.reach_cm === prev.height_cm) ? height : prev.reach_cm
                  }));
                }}
                placeholder="180"
              />
            </div>
            
            <div>
              <Label htmlFor="weight_kg" className="text-foreground">Peso (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.1"
                value={formData.weight_kg || ''}
                onChange={(e) => handleChange('weight_kg', parseFloat(e.target.value) || undefined)}
                placeholder="70.5"
              />
            </div>
            
            <div>
              <Label htmlFor="reach_cm" className="text-foreground">Alcance (cm)</Label>
              <Input
                id="reach_cm"
                type="number"
                value={formData.reach_cm || ''}
                onChange={(e) => handleChange('reach_cm', parseInt(e.target.value) || undefined)}
                placeholder="185"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Estimado según altura. Ajústalo si conoces tu medida.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="bio" className="text-foreground">Biografía</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Cuéntanos sobre tu trayectoria en las artes marciales..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="avatar_url" className="text-foreground">Foto de Perfil</Label>
            <FileUpload
              onFileSelect={(file) => {
                const url = URL.createObjectURL(file);
                handleChange('avatar_url', url);
              }}
              onRemoveFile={() => handleChange('avatar_url', '')}
              accept="image/*"
              maxSize={3}
              preview={formData.avatar_url}
              autoResize={true}
              resizeOptions={{ 
                maxWidth: 300, 
                maxHeight: 300, 
                quality: 0.85, 
                format: 'jpeg',
                maintainAspectRatio: true 
              }}
              showResizeInfo={true}
            />
            <p className="text-xs text-muted-foreground mt-1">
              O ingresa una URL directamente:
            </p>
            <Input
              id="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={(e) => handleChange('avatar_url', e.target.value)}
              placeholder="https://ejemplo.com/mi-foto.jpg"
              className="mt-2"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-fighter-primary hover:bg-fighter-secondary text-fighter-primary-foreground font-semibold"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Perfil
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="border-fighter-border hover:bg-fighter-accent hover:text-fighter-accent-foreground"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}