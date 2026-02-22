import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, HelpCircle, ArrowLeft, Shield, Dumbbell, Scale, Building2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';
import { useFighterInvitations } from '@/hooks/useFighterInvitations';
import { supabase } from '@/integrations/supabase/client';

type AuthStep = 'role-select' | 'email' | 'login' | 'register';
type UserType = 'fighter' | 'gym' | 'judge' | 'admin';

const ROLE_OPTIONS: { type: UserType; label: string; description: string; icon: typeof Dumbbell; adminOnly?: boolean }[] = [
  { type: 'fighter', label: 'Peleador', description: 'Obtén tu Fighter ID profesional', icon: Dumbbell },
  { type: 'gym', label: 'Gimnasio', description: 'Registra y gestiona tu gimnasio', icon: Building2 },
  { type: 'judge', label: 'Juez / Oficial', description: 'Accede como oficial certificado', icon: Scale },
  { type: 'admin', label: 'Administrador', description: 'Solo acceso autorizado', icon: Shield, adminOnly: true },
];

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading, resendConfirmation } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const inviteGymToken = searchParams.get('invite_gym');
  const preselectedRole = searchParams.get('role') as UserType | null;
  const { validateToken } = useFighterInvitations();
  const [invitation, setInvitation] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Determine initial step
  const getInitialStep = (): AuthStep => {
    if (preselectedRole) return 'email';
    return 'role-select';
  };

  const [step, setStep] = useState<AuthStep>(getInitialStep);
  const [selectedRole, setSelectedRole] = useState<UserType | null>(preselectedRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Save selected role to localStorage for AuthCallback
  useEffect(() => {
    if (selectedRole) {
      localStorage.setItem('fighter_id_selected_role', selectedRole);
    }
    if (inviteGymToken) {
      localStorage.setItem('fighter_id_invite_gym', inviteGymToken);
    }
  }, [selectedRole, inviteGymToken]);

  // Validate invitation token
  useEffect(() => {
    if (!inviteToken) return;
    const checkInvitation = async () => {
      setValidatingToken(true);
      const invitationData = await validateToken(inviteToken);
      if (invitationData) {
        setInvitation(invitationData);
        setEmail(invitationData.email);
        setSelectedRole('fighter');
        setStep('email');
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

  // Smart routing for authenticated users
  useEffect(() => {
    if (!user || authLoading) return;
    routeAuthenticatedUser();
  }, [user, authLoading]);

  // Helper: route to gym dashboard
  const routeToGym = async () => {
    const { data: staffRecord } = await supabase
      .from('gym_staff')
      .select('gym_id')
      .eq('user_id', user!.id)
      .eq('active', true)
      .maybeSingle();
    navigate(staffRecord ? `/gym/${staffRecord.gym_id}/dashboard` : '/gimnasios', { replace: true });
  };

  // Helper: route to fighter license flow
  const routeToFighter = async () => {
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_user_id', user!.id)
      .maybeSingle();

    if (!appUser) { navigate('/license/onboarding', { replace: true }); return; }

    const { data: fighterProfile } = await supabase
      .from('fighter_profiles')
      .select('id')
      .eq('user_id', appUser.id)
      .maybeSingle();

    if (!fighterProfile) { navigate('/license/onboarding', { replace: true }); return; }

    const { data: license } = await supabase
      .from('fighter_licenses')
      .select('status')
      .eq('fighter_id', fighterProfile.id)
      .maybeSingle();

    if (!license) { navigate('/license/onboarding', { replace: true }); return; }

    switch (license.status) {
      case 'ACTIVE': navigate('/license/dashboard', { replace: true }); break;
      case 'PENDING_REVIEW':
      case 'APPLIED': navigate('/license/pending', { replace: true }); break;
      case 'SUSPENDED':
      case 'REVOKED': navigate('/license/suspended', { replace: true }); break;
      default: navigate('/license/onboarding', { replace: true });
    }
  };

  const routeAuthenticatedUser = async () => {
    try {
      const savedRole = localStorage.getItem('fighter_id_selected_role');
      localStorage.removeItem('fighter_id_selected_role');

      // 1. Get user roles from DB
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);
      const roleList = (roles || []).map(r => r.role);

      // 2. If a module was selected, route to that module
      if (savedRole) {
        switch (savedRole) {
          case 'admin':
            if (roleList.includes('admin') || roleList.includes('super_admin')) {
              navigate('/admin/dashboard', { replace: true });
            } else {
              toast.error('No tienes permisos de administrador.');
              navigate('/', { replace: true });
            }
            return;
          case 'gym':
            await routeToGym();
            return;
          case 'judge':
            navigate('/judge/onboarding', { replace: true });
            return;
          case 'fighter':
            await routeToFighter();
            return;
        }
      }

      // 3. Fallback: no module selected (direct login) — use role priority
      if (roleList.includes('admin') || roleList.includes('super_admin')) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      if (roleList.includes('gym_owner') || roleList.includes('gym_coach')) {
        await routeToGym();
        return;
      }
      if (roleList.includes('official_judge') || roleList.includes('official_referee')) {
        navigate('/', { replace: true });
        return;
      }

      // 4. Default: fighter license flow
      await routeToFighter();
    } catch (error) {
      console.error('[Auth] Error routing user:', error);
      navigate('/', { replace: true });
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

  const handleRoleSelect = (role: UserType) => {
    setSelectedRole(role);
    setStep('email');
  };

  const handleLoginDirect = () => {
    setSelectedRole(null);
    setStep('email');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setCheckingEmail(true);
    const exists = await checkEmailExists(email);
    setCheckingEmail(false);

    if (selectedRole === 'admin' && !exists) {
      toast.error('Las cuentas de administrador no se pueden crear aquí. Contacta al equipo.');
      return;
    }

    setStep(exists ? 'login' : 'register');
  };

  const handleBackToEmail = () => {
    setStep('email');
    setPassword('');
  };

  const handleBackToRoles = () => {
    setStep('role-select');
    setSelectedRole(null);
    setEmail('');
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const roleLabel = selectedRole ? ROLE_OPTIONS.find(r => r.type === selectedRole)?.label : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s', animationDuration: '10s' }} />

      <Card className="w-full max-w-md bg-slate-950/95 border-purple-500/30 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] relative z-10 animate-fade-in">
        <CardHeader className="text-center pb-2">
          <img src={fighterIdLogo} alt="Fighter ID" className="w-24 mx-auto mb-2" />
          <CardTitle className="text-xl font-bold text-white">
            {step === 'role-select' && 'Selecciona tu tipo de cuenta'}
            {step === 'email' && (selectedRole ? `Acceso — ${roleLabel}` : 'Iniciar Sesión')}
            {step === 'login' && 'Ingresa tu contraseña'}
            {step === 'register' && (registrationSuccess ? '¡Revisa tu correo!' : 'Crea tu cuenta')}
          </CardTitle>
          <CardDescription className="text-white/60">
            {step === 'role-select' && '¿Cómo usarás Fighter ID?'}
            {step === 'email' && 'Ingresa tu email para continuar'}
            {step === 'login' && email}
            {step === 'register' && !registrationSuccess && `Registro como ${roleLabel || 'usuario'}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* STEP 0: Role Selector */}
          {step === 'role-select' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map(({ type, label, description, icon: Icon, adminOnly }) => (
                  <button
                    key={type}
                    onClick={() => handleRoleSelect(type)}
                    className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-purple-500/20 bg-slate-900/50 hover:bg-purple-600/20 hover:border-purple-500/50 transition-all duration-300 text-center"
                  >
                    <div className="rounded-full p-3 bg-purple-600/20 group-hover:bg-purple-600/30 transition-colors">
                      <Icon className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                    </div>
                    <span className="text-sm font-semibold text-white">{label}</span>
                    <span className="text-xs text-white/50 leading-tight">{description}</span>
                    {adminOnly && (
                      <span className="absolute top-2 right-2 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Solo login</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={handleLoginDirect}
                  className="w-full text-white/60 hover:text-white"
                >
                  Ya tengo cuenta — Iniciar sesión
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fade-in">
              <div>
                <label className="text-sm font-medium text-white/90" htmlFor="auth-email">Email</label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={!!invitation}
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={checkingEmail}>
                {checkingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
              </Button>

              <div className="flex flex-col gap-2">
                <Link to="/auth/forgot-password" className="inline-flex items-center justify-center gap-1 text-sm text-white/50 hover:text-white transition-colors">
                  <HelpCircle className="h-3.5 w-3.5" />
                  ¿Olvidaste tu contraseña?
                </Link>
                <Button type="button" variant="ghost" onClick={handleBackToRoles} className="text-sm text-white/50 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Volver
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2A: Login */}
          {step === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4 animate-fade-in">
              <div className="bg-slate-900/60 rounded-lg p-3 border border-purple-500/20">
                <p className="text-sm text-white/60">Email:</p>
                <p className="text-white font-medium">{email}</p>
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-white/90" htmlFor="auth-password">Contraseña</label>
                <Input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  minLength={6}
                  className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 pr-10"
                />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-6 h-9 w-9 text-white/50 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>

              <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                <Link to="/auth/forgot-password" className="inline-flex items-center justify-center text-sm font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4">
                  <HelpCircle className="w-4 h-4 mr-1.5" />
                  ¿Olvidaste tu contraseña?
                </Link>
                <Button type="button" variant="ghost" onClick={handleBackToEmail} className="text-sm text-white/50 hover:text-white">
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
                    <div className="bg-green-500/20 rounded-full p-4">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <p className="text-white/90">Hemos enviado un email de confirmación a</p>
                    <p className="text-amber-400 font-semibold">{registeredEmail}</p>
                    <div className="bg-slate-900/60 rounded-lg p-3 w-full border border-purple-500/20 text-left text-sm text-white/70 space-y-1">
                      <p>⚠️ Revisa tu carpeta de <strong className="text-amber-400">spam</strong></p>
                      <p>🕒 El enlace es válido por <strong>24 horas</strong></p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full border-purple-500/30" onClick={handleResendEmail} disabled={resendCooldown > 0 || isResending}>
                      {isResending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reenviando...</> : resendCooldown > 0 ? <><Mail className="mr-2 h-4 w-4" />Reenviar en {resendCooldown}s</> : <><Mail className="mr-2 h-4 w-4" />Reenviar correo</>}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="bg-slate-900/60 rounded-lg p-3 border border-purple-500/20">
                    <p className="text-sm text-white/60">Nuevo registro para:</p>
                    <p className="text-white font-medium">{email}</p>
                  </div>

                  {invitation && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm text-white/90">Invitado como: <strong>{invitation.first_name} {invitation.last_name}</strong></p>
                    </div>
                  )}

                  <div className="relative">
                    <label className="text-sm font-medium text-white/90" htmlFor="signup-password">Contraseña</label>
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      minLength={6}
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 pr-10"
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-6 h-9 w-9 text-white/50 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={loading || validatingToken}>
                    {(loading || validatingToken) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {invitation ? 'Completar Registro' : 'Registrarse'}
                  </Button>

                  <Button type="button" variant="ghost" onClick={handleBackToEmail} className="w-full text-sm text-white/50 hover:text-white">
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
