import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Building2 } from 'lucide-react';

/**
 * TrainerOnboarding - For non-fighter users who want to join a gym.
 * Flow: creates app_user → optionally requests join via gym code.
 */
export default function TrainerOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'profile' | 'gym'>('profile');
  const [gymCode, setGymCode] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: 'HN',
  });

  const handleCreateProfile = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }
    if (!formData.firstName || !formData.lastName) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_user')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || null,
          country: formData.country,
          handle: `${formData.firstName}_${formData.lastName}_${Date.now()}`.toLowerCase().replace(/\s+/g, '_'),
        });

      if (error && error.code !== '23505') throw error;

      toast.success('Perfil creado exitosamente');
      setStep('gym');
    } catch (error: any) {
      console.error('Error creating trainer profile:', error);
      toast.error(error.message || 'Error al crear perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGym = async () => {
    if (!gymCode) {
      toast.error('Ingresa el código del gimnasio');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .rpc('request_join_gym' as any, { p_gym_code: gymCode });

      if (error) throw error;

      toast.success('Solicitud enviada. El administrador del gimnasio debe aprobarla.');
      navigate('/profile/hub', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Error al solicitar unión');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">No autorizado</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto rounded-full p-3 bg-primary/10 w-fit mb-2">
            {step === 'profile' ? (
              <User className="w-8 h-8 text-primary" />
            ) : (
              <Building2 className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle>
            {step === 'profile' ? 'Completar Perfil' : 'Unirse a un Gimnasio'}
          </CardTitle>
          <CardDescription>
            {step === 'profile'
              ? 'Completa tus datos básicos como entrenador'
              : 'Ingresa el código de invitación de tu gimnasio'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'profile' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Pérez"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+504 9999-9999"
                />
              </div>
              <Button onClick={handleCreateProfile} className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="gym-code">Código del Gimnasio</Label>
                <Input
                  id="gym-code"
                  value={gymCode}
                  onChange={(e) => setGymCode(e.target.value)}
                  placeholder="GYM-ABC123"
                />
              </div>
              <Button onClick={handleJoinGym} className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Solicitar Unión
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile/hub')}
                className="w-full"
              >
                Omitir por Ahora
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
