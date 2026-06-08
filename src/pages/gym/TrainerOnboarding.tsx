import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserModules } from '@/hooks/useUserModules';
import { ensureAppUser, fillAppUserIfEmpty } from '@/lib/ensureAppUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Building2 } from 'lucide-react';

/**
 * TrainerOnboarding - additive module. A user that already has any other
 * module (fighter/gym owner/judge) can also become a trainer; identity is
 * reused via ensureAppUser instead of being recreated.
 */
export default function TrainerOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { appUser, modules, loading: modulesLoading, refetch } = useUserModules();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'profile' | 'gym'>('profile');
  const [gymCode, setGymCode] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: 'HN',
  });

  // Already a trainer? Send them to their gym.
  useEffect(() => {
    if (modulesLoading) return;
    if (modules.trainer.status === 'active' && modules.trainer.gymId) {
      navigate(`/gym/${modules.trainer.gymId}/dashboard`, { replace: true });
      return;
    }
    // If app_user already has identity (from another module), skip step 1.
    if (appUser && appUser.first_name && appUser.last_name) {
      setFormData({
        firstName: appUser.first_name,
        lastName: appUser.last_name,
        phone: appUser.phone || '',
        country: appUser.country || 'HN',
      });
      setStep('gym');
    }
  }, [modulesLoading, appUser, modules.trainer.status, modules.trainer.gymId, navigate]);

  const handleCreateProfile = async () => {
    if (!user) { toast.error('Debes iniciar sesión'); return; }
    if (!formData.firstName || !formData.lastName) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }
    setLoading(true);
    try {
      const ensured = await ensureAppUser(user, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        country: formData.country,
        handlePrefix: `${formData.firstName}_${formData.lastName}`,
      });
      await fillAppUserIfEmpty(ensured.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || null,
        country: formData.country,
      });
      toast.success('Perfil guardado');
      setStep('gym');
    } catch (error: any) {
      console.error('Error creating trainer profile:', error);
      toast.error(error.message || 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGym = async () => {
    if (!gymCode) { toast.error('Ingresa el código del gimnasio'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.rpc('request_join_gym' as any, { p_gym_code: gymCode });
      if (error) throw error;
      toast.success('Solicitud enviada. El administrador del gimnasio debe aprobarla.');
      refetch();
      navigate('/profile/hub', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Error al solicitar unión');
    } finally {
      setLoading(false);
    }
  };

  if (!user || modulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto rounded-full p-3 bg-primary/10 w-fit mb-2">
            {step === 'profile' ? <User className="w-8 h-8 text-primary" /> : <Building2 className="w-8 h-8 text-primary" />}
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
                  <Input id="firstName" value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Juan" />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input id="lastName" value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Pérez" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+504 9999-9999" />
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
                <Input id="gym-code" value={gymCode}
                  onChange={(e) => setGymCode(e.target.value)}
                  placeholder="GYM-ABC123" />
              </div>
              <Button onClick={handleJoinGym} className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Solicitar Unión
              </Button>
              <Button variant="outline" onClick={() => navigate('/profile/hub')} className="w-full">
                Omitir por Ahora
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
