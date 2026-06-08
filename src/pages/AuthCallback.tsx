import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, RefreshCw, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type ErrorType = 'expired' | 'already_confirmed' | 'generic';

function detectErrorType(error: string, description: string): ErrorType {
  const combined = `${error} ${description}`.toLowerCase();
  if (combined.includes('expired') || combined.includes('expirado') || combined.includes('otp_expired')) {
    return 'expired';
  }
  if (combined.includes('already') || combined.includes('confirmed') || combined.includes('ya confirmad')) {
    return 'already_confirmed';
  }
  return 'generic';
}

function getErrorContent(type: ErrorType) {
  switch (type) {
    case 'expired':
      return {
        title: 'Enlace expirado',
        message: 'Tu enlace de verificación ha expirado. Solicita uno nuevo.',
        showResend: true,
      };
    case 'already_confirmed':
      return {
        title: 'Cuenta ya confirmada',
        message: 'Tu cuenta ya fue verificada anteriormente. Puedes iniciar sesión directamente.',
        showResend: false,
      };
    default:
      return {
        title: 'Error de verificación',
        message: 'Ocurrió un problema al verificar tu cuenta.',
        showResend: true,
      };
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { resendConfirmation } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando...');
  const [errorType, setErrorType] = useState<ErrorType>('generic');
  const [errorDetails, setErrorDetails] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (error) {
          const type = detectErrorType(error, errorDescription || '');
          setErrorType(type);
          const content = getErrorContent(type);
          setStatus('error');
          setMessage(content.title);
          setErrorDetails(errorDescription || content.message);
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
            setMessage('¡Email confirmado exitosamente! Inicia sesión para continuar.');
            setTimeout(() => navigate('/auth', { replace: true }), 2000);
            return;
          }
          throw new Error('No se pudo establecer la sesión');
        }

        // Save email for potential resend
        if (session.user?.email) setResendEmail(session.user.email);

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

        // Trigger PostAuthRouter via profile hub
        setTimeout(() => navigate('/profile/hub', { replace: true }), 1500);
      } catch (err: any) {
        console.error('[AuthCallback] Error:', err);
        const type = detectErrorType(err.message || '', '');
        setErrorType(type);
        const content = getErrorContent(type);
        setStatus('error');
        setMessage(content.title);
        setErrorDetails(err.message || content.message);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !resendEmail) return;
    setIsResending(true);
    const { error } = await resendConfirmation(resendEmail);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Correo de verificación reenviado');
      setResendCooldown(60);
    }
    setIsResending(false);
  };

  const errorContent = getErrorContent(errorType);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-foreground/80 text-lg">{message}</p>
            <p className="text-muted-foreground text-sm mt-2">Por favor espera...</p>
          </>
        )}

        {status === 'success' && (
          <div className="animate-fade-in">
            <div className="bg-fighter-success/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-fighter-success" />
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
            <p className="text-muted-foreground mb-6">{errorDetails}</p>

            <div className="space-y-3">
              {errorType === 'already_confirmed' ? (
                <Button onClick={() => navigate('/auth', { replace: true })} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <LogIn className="mr-2 h-4 w-4" />
                  Ir a Iniciar Sesión
                </Button>
              ) : (
                <>
                  {errorContent.showResend && resendEmail && (
                    <Button
                      onClick={handleResendEmail}
                      disabled={resendCooldown > 0 || isResending}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isResending ? (
                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Reenviando...</>
                      ) : resendCooldown > 0 ? (
                        <>Reenviar en {resendCooldown}s</>
                      ) : (
                        <><RefreshCw className="mr-2 h-4 w-4" />Solicitar nuevo enlace</>
                      )}
                    </Button>
                  )}
                  <Button onClick={() => navigate('/auth', { replace: true })} variant="outline" className="w-full border-border">
                    <LogIn className="mr-2 h-4 w-4" />
                    Ir a Iniciar Sesión
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => navigate('/auth', { replace: true })} className="w-full text-muted-foreground">
                <UserPlus className="mr-2 h-4 w-4" />
                Registrarse de nuevo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
