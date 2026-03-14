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

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-email-exists', {
        body: { email: emailToCheck },
      });
      if (error) return false;
      return data?.exists ?? false;
    } catch { return false; }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setCheckingEmail(true);
    const exists = await checkEmailExists(email);
    setCheckingEmail(false);
    setStep(exists ? 'login' : 'register');
  };

  const handleBackToEmail = () => {
    setStep('email');
    setPassword('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      const isInvalid = error.message?.includes('Invalid login credentials');
      toast.error(isInvalid ? 'Credenciales incorrectas.' : error.message);
    } else {
      toast.success('Sesión iniciada correctamente');
    }
    setLoading(false);
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
          const { data: appUser } = await supabase.from('app_user').select('id').eq('auth_user_id', newUser.id).single();
          if (!appUser) throw new Error('Error configurando perfil');
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
    if (error) { toast.error(error.message); } else { toast.success('Correo reenviado'); setResendCooldown(60); }
    setIsResending(false);
  };

  if (authLoading) {
    return <PageSkeleton variant="auth" className="bg-black" />;
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
            <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fade-in">
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
                  disabled={!!invitation}
                  className="bg-secondary border-border focus:border-primary"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={checkingEmail}>
                {checkingEmail ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando email...</>
                ) : (
                  'Continuar'
                )}
              </Button>

              <div className="flex flex-col gap-2">
                <Link to="/auth/forgot-password" className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-3.5 w-3.5" />
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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
