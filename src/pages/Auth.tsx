import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, HelpCircle, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PasswordStrength } from '@/components/ui/password-strength';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';
import { useFighterInvitations } from '@/hooks/useFighterInvitations';
import { supabase } from '@/integrations/supabase/client';

type AuthStep = 'email' | 'login' | 'register';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading, resendConfirmation } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const inviteGymToken = searchParams.get('invite_gym');
  const { validateToken } = useFighterInvitations();
  const [invitation, setInvitation] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Save gym invite token for post-auth processing
  useEffect(() => {
    if (inviteGymToken) {
      localStorage.setItem('fighter_id_invite_gym', inviteGymToken);
    }
  }, [inviteGymToken]);

  // Validate fighter invitation token
  useEffect(() => {
    if (!inviteToken) return;
    const checkInvitation = async () => {
      setValidatingToken(true);
      const invitationData = await validateToken(inviteToken);
      if (invitationData) {
        setInvitation(invitationData);
        setEmail(invitationData.email);
        toast.success(`Bienvenido ${invitationData.first_name}! Completa tu registro.`);
      } else {
        toast.error('El link de invitación ha expirado o no es válido');
      }
      setValidatingToken(false);
    };
    checkInvitation();
  }, [inviteToken]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle hash tokens (email confirmation landing here)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;
    const handleHash = async () => {
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          toast.error('Error al verificar cuenta.');
        } else {
          window.history.replaceState({}, '', window.location.pathname + window.location.search);
          if (type === 'signup' || type === 'email') {
            toast.success('¡Cuenta confirmada exitosamente!');
          }
        }
      }
    };
    handleHash();
  }, []);

  // Post-login: always redirect to home
  useEffect(() => {
    if (!user || authLoading) return;
    navigate('/', { replace: true });
  }, [user, authLoading]);

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error('Error al conectar con el proveedor');
    }
  };

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-email-exists', {
        body: { email: emailToCheck },
      });
      if (error) return false;
      return data?.exists ?? false;
    } catch { return false; }
  };

  // Initial mode from URL (?mode=signin|signup)
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signin') setStep('login');
    else if (mode === 'signup') setStep('register');
  }, [searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent, forcedStep?: 'login' | 'register') => {
    e.preventDefault();
    if (!email) return;
    // If user explicitly chose login/register, honor it.
    if (forcedStep) {
      setStep(forcedStep);
      return;
    }
    setCheckingEmail(true);
    try {
      const exists = await checkEmailExists(email);
      // If lookup fails, default to login (safer for existing users) rather than registration.
      setStep(exists ? 'login' : 'register');
    } catch {
      setStep('login');
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setPassword('');
  };


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    // Safety: ensure the spinner never sticks if something hangs unexpectedly
    const safety = setTimeout(() => setLoading(false), 20000);
    try {
      setNetworkError(false);
      const { error, errorCode } = await signIn(email, password);
      if (error) {
        if (errorCode === 'email_not_confirmed') {
          toast.warning('Tu correo aún no está confirmado. Te enviamos el enlace de nuevo.');
          setRegisteredEmail(email);
          setRegistrationSuccess(true);
          setStep('register');
          if (resendCooldown === 0 && !isResending) {
            setIsResending(true);
            const { error: resendErr } = await resendConfirmation(email);
            if (resendErr) {
              const msg = (resendErr as any).message || '';
              if (/rate|security purposes|too many/i.test(msg)) {
                const retry = (resendErr as any).retryAfter ?? 60;
                setResendCooldown(retry);
                toast.info(`Espera ${retry}s para reenviar el correo.`);
              } else {
                toast.error(msg || 'No se pudo reenviar el correo.');
              }
            } else {
              setResendCooldown(60);
            }
            setIsResending(false);
          }
        } else if (errorCode === 'network') {
          setNetworkError(true);
          toast.error(error.message);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Sesión iniciada correctamente');
      }
    } finally {
      clearTimeout(safety);
      setLoading(false);
    }
  };


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRegistrationSuccess(false);

    try {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        if (signUpError.message?.includes('For security purposes') || signUpError.message?.includes('email_send_rate_limit')) {
          throw new Error('Has intentado registrarte varias veces. Espera 60 segundos.');
        }
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists') || signUpError.message?.includes('Database error')) {
          toast.info('Este correo ya está registrado. Intenta iniciar sesión.');
          setTimeout(() => setStep('login'), 1500);
          setLoading(false);
          return;
        }
        throw signUpError;
      }

      // Handle invitation flow
      if (invitation && inviteToken) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          // Retry loop — DB trigger that creates app_user may not have fired yet
          let appUser: { id: string } | null = null;
          let retries = 5;
          while (!appUser && retries > 0) {
            const result = await supabase
              .from('app_user')
              .select('id')
              .eq('auth_user_id', newUser.id)
              .maybeSingle();
            appUser = result.data;
            if (!appUser) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              retries--;
            }
          }

          if (!appUser) {
            // Persist token so it can be processed post-confirmation
            localStorage.setItem('fighter_invite_pending', inviteToken);
            toast.info('Cuenta creada. Tu perfil de peleador se configurará después de confirmar tu email.');
            setRegistrationSuccess(true);
            setRegisteredEmail(email);
            return;
          }

          const { data: fighterProfile, error: profileError } = await supabase
            .from('fighter_profiles')
            .insert({ user_id: appUser.id, first_name: invitation.first_name, last_name: invitation.last_name, weight_class: invitation.weight_class || 'Peso Ligero', country: 'Honduras' })
            .select('id').single();
          if (profileError) throw profileError;
          await supabase.rpc('accept_fighter_invitation', { p_token: inviteToken, p_fighter_profile_id: fighterProfile.id });
          toast.success('¡Registro completo! Tu perfil de peleador ha sido creado.');
        }
      } else {
        setRegistrationSuccess(true);
        setRegisteredEmail(email);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !registeredEmail) return;
    setIsResending(true);
    const { error } = await resendConfirmation(registeredEmail);
    if (error) {
      const retry = (error as any).retryAfter;
      if (retry) setResendCooldown(retry);
      toast.error(error.message);
    } else {
      toast.success('Correo reenviado');
      setResendCooldown(60);
    }
    setIsResending(false);
  };

  if (authLoading) {
    return <PageSkeleton variant="auth" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background — Combat red glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary to-background" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s', animationDuration: '10s' }} />

      <Card className="w-full max-w-md bg-card/95 border-primary/30 backdrop-blur-xl shadow-[0_0_50px_hsl(var(--primary)/0.15)] relative z-10 animate-fade-in">
        <CardHeader className="text-center pb-2">
          <img src={fighterIdLogo} alt="Fighter ID" className="w-24 mx-auto mb-2" />
          <CardTitle className="text-xl font-bold text-foreground">
            {step === 'email' && 'Bienvenido a Fighter ID'}
            {step === 'login' && 'Ingresa tu contraseña'}
            {step === 'register' && (registrationSuccess ? '¡Revisa tu correo!' : 'Crea tu cuenta')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 'email' && 'Ingresa tu email para iniciar sesión o crear una cuenta'}
            {step === 'login' && email}
            {step === 'register' && !registrationSuccess && 'Elige una contraseña para tu cuenta'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* STEP 1: Email */}
          {step === 'email' && (
            <form onSubmit={(e) => handleEmailSubmit(e, 'login')} className="space-y-4 animate-fade-in">
              <div>
                <label className="text-sm font-medium text-foreground/90" htmlFor="auth-email">Email</label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  disabled={!!invitation}
                  className="bg-secondary border-border focus:border-primary"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={checkingEmail || !email}
              >
                Iniciar sesión
              </Button>
              <div className="relative flex items-center gap-3 py-1">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground uppercase">o</span>
                <Separator className="flex-1" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-border hover:bg-secondary"
                disabled={checkingEmail || !email}
                onClick={(e) => handleEmailSubmit(e as any, 'register')}
              >
                Crear cuenta nueva
              </Button>

              <div className="flex flex-col gap-2">
                <Link to="/auth/forgot-password" className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-3.5 w-3.5" />
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Social Login Divider */}
              <div className="relative flex items-center gap-3 py-1">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground uppercase">o continúa con</span>
                <Separator className="flex-1" />
              </div>


              {/* OAuth Buttons */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-border hover:bg-secondary"
                onClick={() => handleOAuthLogin('google')}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
            </form>
          )}

          {/* STEP 2A: Login */}
          {step === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4 animate-fade-in">
              <div className="bg-secondary rounded-lg p-3 border border-border">
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="text-foreground font-medium">{email}</p>
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-foreground/90" htmlFor="auth-password">Contraseña</label>
                <Input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  minLength={6}
                  className="bg-secondary border-border focus:border-primary pr-10"
                />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-6 h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>

              {networkError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 space-y-2">
                  <p className="text-xs text-foreground/90">
                    No pudimos conectar con el servidor. Esto suele pasar por una extensión del navegador o caché vieja.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-destructive/40"
                    onClick={async () => {
                      try {
                        if ('serviceWorker' in navigator) {
                          const regs = await navigator.serviceWorker.getRegistrations();
                          await Promise.all(regs.map((r) => r.unregister()));
                        }
                        if ('caches' in window) {
                          const keys = await caches.keys();
                          await Promise.all(
                            keys.filter((k) => k.startsWith('fighter-id-')).map((k) => caches.delete(k))
                          );
                        }
                      } catch (err) {
                        console.warn('[AUTH] Cache cleanup failed:', err);
                      } finally {
                        window.location.reload();
                      }
                    }}
                  >
                    Limpiar caché y reintentar
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <Link to="/auth/forgot-password" className="inline-flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-4">
                  <HelpCircle className="w-4 h-4 mr-1.5" />
                  ¿Olvidaste tu contraseña?
                </Link>
                <Button type="button" variant="ghost" onClick={handleBackToEmail} className="text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Usar otro email
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2B: Register */}
          {step === 'register' && (
            <div className="animate-fade-in">
              {registrationSuccess ? (
                <div className="space-y-4 py-2">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="bg-fighter-success/20 rounded-full p-4">
                      <CheckCircle className="h-10 w-10 text-fighter-success" />
                    </div>
                    <p className="text-foreground/90">Hemos enviado un email de confirmación a</p>
                    <p className="text-primary font-semibold">{registeredEmail}</p>
                    <div className="bg-secondary rounded-lg p-3 w-full border border-border text-left text-sm text-muted-foreground space-y-1">
                      <p>⚠️ Revisa tu carpeta de <strong className="text-primary">spam</strong></p>
                      <p>🕒 El enlace es válido por <strong>24 horas</strong></p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full border-border" onClick={handleResendEmail} disabled={resendCooldown > 0 || isResending}>
                      {isResending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reenviando...</> : resendCooldown > 0 ? <><Mail className="mr-2 h-4 w-4" />Reenviar en {resendCooldown}s</> : <><Mail className="mr-2 h-4 w-4" />Reenviar correo</>}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="bg-secondary rounded-lg p-3 border border-border">
                    <p className="text-sm text-muted-foreground">Nuevo registro para:</p>
                    <p className="text-foreground font-medium">{email}</p>
                  </div>

                  {invitation && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm text-foreground/90">Invitado como: <strong>{invitation.first_name} {invitation.last_name}</strong></p>
                    </div>
                  )}

                  <div className="relative">
                    <label className="text-sm font-medium text-foreground/90" htmlFor="signup-password">Contraseña</label>
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      minLength={6}
                      className="bg-secondary border-border focus:border-primary pr-10"
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-6 h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <PasswordStrength password={password} />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading || validatingToken}>
                    {(loading || validatingToken) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {invitation ? 'Completar Registro' : 'Crear Cuenta'}
                  </Button>

                  <Button type="button" variant="ghost" onClick={handleBackToEmail} className="w-full text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Usar otro email
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
