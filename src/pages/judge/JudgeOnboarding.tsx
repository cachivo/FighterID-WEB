import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Scale } from 'lucide-react';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';

export default function JudgeOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [experiencia, setExperiencia] = useState('');

  // Check if user already has a judge record
  useEffect(() => {
    if (!user) { setCheckingExisting(false); return; }
    supabase
      .from('judges')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          toast.info('Ya estás registrado como juez');
          navigate('/', { replace: true });
        }
        setCheckingExisting(false);
      });
  }, [user]);

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
    if (!nombre.trim() || !apellido.trim()) { toast.error('Nombre y apellido son requeridos'); return; }

    setLoading(true);
    try {
      // Ensure app_user exists
      const { data: existingUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (existingUser) {
        await supabase.from('app_user').update({ first_name: nombre, last_name: apellido }).eq('id', existingUser.id);
      }

      // Assign official_judge role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'official_judge' });

      if (roleError && !roleError.message?.includes('duplicate')) {
        console.error('Error assigning role:', roleError);
      }

      // Create judge record
      const licenseNum = `JDG-${Date.now().toString(36).toUpperCase()}`;
      const { error: judgeError } = await supabase
        .from('judges')
        .insert({
          first_name: nombre,
          last_name: apellido,
          license_number: licenseNum,
          user_id: user.id,
          active: false,
        });

      if (judgeError) throw judgeError;

      localStorage.removeItem('fighter_id_selected_role');
      toast.success('¡Registro como juez exitoso! Tu solicitud será revisada.');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Error creating judge:', error);
      toast.error(error.message || 'Error al registrar juez');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md bg-slate-950/95 border-purple-500/30 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] relative z-10">
        <CardHeader className="text-center">
          <img src={fighterIdLogo} alt="Fighter ID" className="w-20 mx-auto mb-2" />
          <div className="mx-auto rounded-full p-3 bg-purple-600/20 w-fit mb-2">
            <Scale className="w-8 h-8 text-purple-400" />
          </div>
          <CardTitle className="text-xl font-bold text-white">Registro como Juez</CardTitle>
          <CardDescription className="text-white/60">Completa tus datos para solicitar acreditación</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-white/90">Nombre *</label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" required className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/90">Apellido *</label>
                <Input value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Apellido" required className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white/90">Experiencia / Certificaciones</label>
              <Textarea value={experiencia} onChange={(e) => setExperiencia(e.target.value)} placeholder="Describe tu experiencia como juez u oficial..." rows={3} className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 resize-none" />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Solicitud
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
