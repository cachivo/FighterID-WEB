import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function JudgeProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isJudge, setIsJudge] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsJudge(false);
      return;
    }

    const checkJudgeAccess = async () => {
      try {
        // PASO 1: Verificar rol en user_roles usando función is_judge
        const { data: hasJudgeRole, error: roleError } = await supabase
          .rpc('is_judge', { _user_id: user.id });

        if (roleError) {
          console.error('[JUDGE AUTH] Error verificando rol:', roleError);
          toast.error('Error al verificar permisos');
          setIsJudge(false);
          return;
        }

        if (!hasJudgeRole) {
          setIsJudge(false);
          return;
        }

        // PASO 2: Verificar perfil activo en judges
        const { data: judgeProfile, error: profileError } = await supabase
          .from('judges')
          .select('id, active, first_name, last_name')
          .eq('email', user.email)
          .maybeSingle();
        
        if (profileError) {
          console.error('[JUDGE AUTH] Error obteniendo perfil:', profileError);
          toast.error('Error al verificar perfil de juez');
          setIsJudge(false);
          return;
        }

        if (!judgeProfile) {
          toast.error('No tienes perfil de juez configurado');
          setIsJudge(false);
          return;
        }

        if (!judgeProfile.active) {
          toast.error('Tu perfil de juez está inactivo');
          setIsJudge(false);
          return;
        }

        setIsJudge(true);

      } catch (error) {
        console.error('[JUDGE AUTH] Error inesperado:', error);
        toast.error('Error al verificar acceso');
        setIsJudge(false);
      }
    };

    checkJudgeAccess();
  }, [user]);

  if (isJudge === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isJudge) {
    return <Navigate to="/access-denied" />;
  }
  
  return <>{children}</>;
}
