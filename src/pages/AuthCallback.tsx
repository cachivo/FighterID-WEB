import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando...');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage('Error de verificación');
          setErrorDetails(errorDescription || error);
          return;
        }

        const type = urlParams.get('type') || hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        }

        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        if (getSessionError) throw getSessionError;

        if (!session) {
          if (type === 'signup' || type === 'email') {
            setStatus('success');
            setMessage('¡Email confirmado exitosamente!');
            // Try metadata first, then localStorage fallback
            const savedRole = localStorage.getItem('fighter_id_selected_role');
            const dest = savedRole === 'gym' ? '/gym/onboarding' : savedRole === 'judge' ? '/judge/onboarding' : '/license/onboarding';
            setTimeout(() => navigate(dest, { replace: true }), 2000);
            return;
          }
          throw new Error('No se pudo establecer la sesión');
        }

        if (type === 'recovery') {
          setStatus('success');
          setMessage('Verificación exitosa. Redirigiendo...');
          setTimeout(() => navigate('/license/reset-password', { replace: true }), 1500);
          return;
        }

        setStatus('success');
        setMessage('¡Cuenta verificada! Redirigiendo...');
        window.history.replaceState({}, '', '/auth/callback');

        // Check for gym invitation token
        const gymInviteToken = localStorage.getItem('fighter_id_invite_gym');
        if (gymInviteToken) {
          localStorage.removeItem('fighter_id_invite_gym');
          try {
            const { data: result, error: rpcError } = await supabase.rpc('accept_gym_invitation', { p_token: gymInviteToken });
            if (rpcError) throw rpcError;
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            if (parsed?.success && parsed?.gym_id) {
              setMessage(`¡Vinculado a ${parsed.gym_name || 'tu gimnasio'}!`);
              setTimeout(() => navigate(`/gym/${parsed.gym_id}/dashboard`, { replace: true }), 1500);
              return;
            }
          } catch (err) {
            console.error('[AuthCallback] Error accepting gym invitation:', err);
          }
        }

        const destination = await determineUserDestination(session.user.id);
        setTimeout(() => navigate(destination, { replace: true }), 1500);
      } catch (err: any) {
        console.error('[AuthCallback] Error:', err);
        setStatus('error');
        setMessage('Error de verificación');
        setErrorDetails(err.message || 'Por favor intenta de nuevo');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4" />
            <p className="text-foreground/80 text-lg">{message}</p>
            <p className="text-muted-foreground text-sm mt-2">Por favor espera...</p>
          </>
        )}

        {status === 'success' && (
          <div className="animate-fade-in">
            <div className="bg-green-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{message}</h2>
            <p className="text-muted-foreground">Serás redirigido automáticamente...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-fade-in">
            <div className="bg-destructive/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{message}</h2>
            <p className="text-destructive/80 mb-6">{errorDetails}</p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/auth', { replace: true })} className="w-full bg-primary hover:bg-primary/90">
                Ir a Iniciar Sesión
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth', { replace: true })} className="w-full border-border">
                Registrarse de nuevo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function resolveGymDestination(authUserId: string): Promise<string> {
  const { data: staffRecord } = await supabase
    .from('gym_staff')
    .select('gym_id')
    .eq('user_id', authUserId)
    .eq('active', true)
    .maybeSingle();
  if (staffRecord) return `/gym/${staffRecord.gym_id}/dashboard`;
  return '/gym/pending-invitation';
}

async function resolveFighterDestination(authUserId: string): Promise<string> {
  const { data: appUser } = await supabase
    .from('app_user')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (!appUser) return '/license/onboarding';

  const { data: fighterProfile } = await supabase
    .from('fighter_profiles')
    .select('id')
    .eq('user_id', appUser.id)
    .maybeSingle();

  if (!fighterProfile) return '/license/onboarding';

  const { data: license } = await supabase
    .from('fighter_licenses')
    .select('status')
    .eq('fighter_id', fighterProfile.id)
    .maybeSingle();

  if (!license) return '/license/onboarding';

  switch (license.status) {
    case 'ACTIVE': return '/license/dashboard';
    case 'PENDING_REVIEW':
    case 'APPLIED': return '/license/pending';
    case 'SUSPENDED':
    case 'REVOKED': return '/license/suspended';
    default: return '/license/onboarding';
  }
}

async function determineUserDestination(authUserId: string): Promise<string> {
  try {
    const savedRole = localStorage.getItem('fighter_id_selected_role');
    localStorage.removeItem('fighter_id_selected_role');

    // 1. Get user roles from DB
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUserId);
    const roleList = (roles || []).map(r => r.role);

    // 2. If a module was selected, route to that module
    if (savedRole) {
      switch (savedRole) {
        case 'admin':
          if (roleList.includes('admin') || roleList.includes('super_admin')) {
            return '/admin/dashboard';
          }
          return '/'; // No admin permission
        case 'gym':
          return resolveGymDestination(authUserId);
        case 'judge':
          return '/judge/onboarding';
        case 'fighter':
          return resolveFighterDestination(authUserId);
      }
    }

    // 3. Fallback: no module selected — use role priority
    if (roleList.includes('admin') || roleList.includes('super_admin')) {
      return '/admin/dashboard';
    }
    if (roleList.includes('gym_owner') || roleList.includes('gym_coach')) {
      return resolveGymDestination(authUserId);
    }
    if (roleList.includes('official_judge') || roleList.includes('official_referee')) {
      return '/';
    }

    // 4. Default: fighter license flow
    return resolveFighterDestination(authUserId);
  } catch (error) {
    console.error('[AuthCallback] Error in determineUserDestination:', error);
    return '/license/onboarding';
  }
}
