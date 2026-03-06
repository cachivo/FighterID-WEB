import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';

export default function GymOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [telefono, setTelefono] = useState('');

  // Check if user already has an active gym
  useState(() => {
    if (!user) { setCheckingExisting(false); return; }
    supabase
      .from('gym_staff')
      .select('gym_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          navigate(`/gym/${data.gym_id}/dashboard`, { replace: true });
        }
        setCheckingExisting(false);
      });
  });

  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Debes iniciar sesión'); return; }
    if (!nombre.trim()) { toast.error('El nombre del gimnasio es requerido'); return; }

    setLoading(true);
    try {
      // Generate slug
      const slug = nombre.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Create gym record
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .insert({
          nombre,
          slug: `${slug}-${Date.now().toString(36)}`,
          direccion: direccion || null,
          ciudad: ciudad || null,
          telefono: telefono || null,
          pais: 'Honduras',
          activo: true,
          owner_id: user.id,
        })
        .select('id')
        .single();

      if (gymError) throw gymError;

      // Assign gym_owner role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'gym_owner' });

      if (roleError && !roleError.message?.includes('duplicate')) {
        console.error('Error assigning role:', roleError);
      }

      // Add as gym staff
      const { error: staffError } = await supabase
        .from('gym_staff')
        .insert({ gym_id: gym.id, user_id: user.id, role: 'OWNER' as const });

      if (staffError) console.error('Error adding staff:', staffError);

      localStorage.removeItem('fighter_id_selected_role');
      toast.success('¡Gimnasio registrado exitosamente!');
      navigate(`/gym/${gym.id}/dashboard`, { replace: true });
    } catch (error: any) {
      console.error('Error creating gym:', error);
      toast.error(error.message || 'Error al crear el gimnasio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md bg-slate-950/95 border-purple-500/30 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] relative z-10">
        <CardHeader className="text-center">
          <img src={fighterIdLogo} alt="Fighter ID" className="w-20 mx-auto mb-2" />
          <div className="mx-auto rounded-full p-3 bg-blue-600/20 w-fit mb-2">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <CardTitle className="text-xl font-bold text-white">Registra tu Gimnasio</CardTitle>
          <CardDescription className="text-white/60">Completa los datos básicos para empezar</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/90">Nombre del gimnasio *</label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: MMA Academy" required className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/90">Dirección</label>
              <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección del gimnasio" className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-white/90">Ciudad</label>
                <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ciudad" className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/90">Teléfono</label>
                <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+504 ..." className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Gimnasio
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
