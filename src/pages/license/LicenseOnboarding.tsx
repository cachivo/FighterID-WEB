import { useState } from 'react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Award } from 'lucide-react';

export default function LicenseOnboarding() {
  const { user } = useLicenseAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    country: 'HN',
    weightClass: '',
    heightCm: '',
    weightKg: '',
    discipline: 'MMA' as const,
    fightingStyle: '',
    bio: ''
  });

  const weightClasses = [
    'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight',
    'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      // Create app_user if it doesn't exist
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      let userId = appUser?.id;
      
      if (!userId) {
        const { data: newAppUser, error: appUserError } = await supabase
          .from('app_user')
          .insert({
            auth_user_id: user.id,
            email: user.email,
            handle: `${formData.firstName}_${formData.lastName}`.toLowerCase()
          })
          .select('id')
          .single();

        if (appUserError) throw appUserError;
        userId = newAppUser.id;
      }

      // Create fighter profile
      const { data: profile, error: profileError } = await supabase
        .from('fighter_profiles')
        .insert({
          user_id: userId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          nickname: formData.nickname || null,
          country: formData.country,
          weight_class: formData.weightClass,
          height_cm: parseInt(formData.heightCm),
          weight_kg: parseFloat(formData.weightKg),
          discipline: formData.discipline,
          fighting_style: formData.fightingStyle || null,
          bio: formData.bio || null
        })
        .select('id')
        .single();

      if (profileError) throw profileError;

      // Create initial license
      const { error: licenseError } = await supabase
        .from('fighter_licenses')
        .insert({
          fighter_id: profile.id,
          discipline: formData.discipline,
          license_level: 'AMATEUR',
          status: 'PENDING_REVIEW',
          is_primary: true,
          license_number: `TEMP-${Date.now()}` // Temporary license number, will be updated by trigger
        });

      if (licenseError) throw licenseError;

      toast.success('¡Perfil creado exitosamente! Tu licencia está pendiente de revisión.');
      navigate('/license/pending');
      
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Error al crear el perfil. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>No autorizado</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {step === 1 ? (
              <User className="h-12 w-12 text-purple-neon-primary" />
            ) : (
              <Award className="h-12 w-12 text-purple-neon-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">Configurar Tu Perfil de Peleador</CardTitle>
          <CardDescription>
            Necesitamos algunos datos para crear tu perfil y solicitar tu primera licencia
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nickname">Apodo (Opcional)</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                    placeholder="Ej: El Tigre"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="heightCm">Altura (cm) *</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({...formData, heightCm: e.target.value})}
                      placeholder="170"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="weightKg">Peso (kg) *</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      step="0.1"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({...formData, weightKg: e.target.value})}
                      placeholder="70.5"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="weightClass">Categoría de Peso *</Label>
                  <Select value={formData.weightClass} onValueChange={(value) => setFormData({...formData, weightClass: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {weightClasses.map((weightClass) => (
                        <SelectItem key={weightClass} value={weightClass}>
                          {weightClass}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setStep(2)}
                    disabled={!formData.firstName || !formData.lastName || !formData.heightCm || !formData.weightKg || !formData.weightClass}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fightingStyle">Estilo de Pelea</Label>
                  <Input
                    id="fightingStyle"
                    value={formData.fightingStyle}
                    onChange={(e) => setFormData({...formData, fightingStyle: e.target.value})}
                    placeholder="Ej: Muay Thai, BJJ, Boxing"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Biografía (Opcional)</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Cuéntanos sobre tu experiencia en artes marciales..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Atrás
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando Perfil...
                      </>
                    ) : (
                      'Crear Perfil y Solicitar Licencia'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}