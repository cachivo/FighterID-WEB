import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, Mail, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFighterInvitations } from '@/hooks/useFighterInvitations';
import { supabase } from '@/integrations/supabase/client';

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type AuthFormData = z.infer<typeof authSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function Auth() {
  const { user, signIn, signUp, resendConfirmation } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const inviteToken = searchParams.get('invite');
  const { validateToken } = useFighterInvitations();
  const [invitation, setInvitation] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: invitation?.email || '',
      password: '',
    },
  });

  // Redirect users without profile type selection to LicenseWelcome
  useEffect(() => {
    const mode = searchParams.get('mode');
    // No longer redirecting to welcome page, license/auth has profile type selection built-in
  }, [user, inviteToken, searchParams]);

  // Redirect fighter invitations to license auth flow
  useEffect(() => {
    if (inviteToken) {
      console.info('[Auth] Redirecting fighter invitation to /license/auth');
      window.location.href = `/license/auth?mode=signup&invite=${inviteToken}`;
    }
  }, [inviteToken]);

  // Validate invitation token on mount (for general users, though invitations should go to /license/auth)
  useEffect(() => {
    const checkInvitation = async () => {
      if (inviteToken) {
        setValidatingToken(true);
        const invitationData = await validateToken(inviteToken);
        
        if (invitationData) {
          setInvitation(invitationData);
          signUpForm.setValue('email', invitationData.email);
          toast({
            title: 'Invitación válida',
            description: `Bienvenido ${invitationData.first_name}! Completa tu registro para crear tu perfil de peleador.`,
          });
        } else {
          toast({
            title: 'Invitación inválida',
            description: 'El link de invitación ha expirado o no es válido',
            variant: 'destructive',
          });
        }
        setValidatingToken(false);
      }
    };
    
    checkInvitation();
  }, [inviteToken]);

  // Cooldown timer - MUST be before conditional return
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Redirect if already authenticated
  if (user && !adminLoading) {
    // If there's a redirect parameter, use it (for admin access)
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    // Otherwise, redirect based on role
    if (isAdmin === true) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (isAdmin === false) {
      return <Navigate to="/" replace />;
    }
  }

  const handleSignIn = async (data: AuthFormData) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      toast({
        title: 'Error de autenticación',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión correctamente',
      });
    }
    setLoading(false);
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !registeredEmail) return;
    
    setIsResending(true);
    const { error } = await resendConfirmation(registeredEmail);
    
    if (error) {
      toast({
        title: 'Error al reenviar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Correo reenviado',
        description: 'Revisa tu bandeja de entrada',
      });
      setResendCooldown(60);
    }
    setIsResending(false);
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setLoading(true);
    setRegistrationSuccess(false);
    
    try {
      // Register the user
      const { error: signUpError } = await signUp(data.email, data.password);
      
      if (signUpError) {
        // Check for rate limiting
        if (signUpError.message?.includes('For security purposes') || signUpError.message?.includes('email_send_rate_limit')) {
          throw new Error('Has intentado registrarte varias veces. Por favor espera 60 segundos antes de intentar nuevamente.');
        }
        
        // Handle already registered - redirect to login
        if (signUpError.message?.includes('already registered')) {
          toast({
            title: "✅ Cuenta existente detectada",
            description: "Este email ya está registrado. Redirigiendo a inicio de sesión...",
            duration: 3000,
          });
          
          // Pre-fill login form with the email and switch tab
          form.setValue('email', data.email);
          
          // Switch to signin tab immediately
          setTimeout(() => {
            setActiveTab('signin');
          }, 1500);
          
          setLoading(false);
          return;
        }
        
        throw signUpError;
      }

      // If this is an invitation signup, create fighter profile
      if (invitation && inviteToken) {
        // Wait a bit for auth and trigger to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the newly created user
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (newUser) {
          // Get app_user (should be created by trigger)
          const { data: appUser, error: appUserError } = await supabase
            .from('app_user')
            .select('id')
            .eq('auth_user_id', newUser.id)
            .single();

          if (appUserError || !appUser) {
            console.error('App user not found:', appUserError);
            throw new Error('Error configurando perfil de usuario');
          }

          // Create fighter profile
          const { data: fighterProfile, error: profileError } = await supabase
            .from('fighter_profiles')
            .insert({
              user_id: appUser.id,
              first_name: invitation.first_name,
              last_name: invitation.last_name,
              weight_class: invitation.weight_class || 'Lightweight',
              country: 'HN',
            })
            .select('id')
            .single();

          if (profileError) throw profileError;

          // Mark invitation as accepted using secure RPC function
          const { error: acceptError } = await supabase
            .rpc('accept_fighter_invitation', {
              p_token: inviteToken,
              p_fighter_profile_id: fighterProfile.id,
            });
          
          if (acceptError) throw acceptError;

          toast({
            title: '✅ Registro completo',
            description: 'Tu perfil de peleador ha sido creado exitosamente',
          });
        }
      } else {
        // Show registration success message
        setRegistrationSuccess(true);
        setRegisteredEmail(data.email);
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      toast({
        title: 'Error de registro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Acceso a Batalla</CardTitle>
          <CardDescription>
            Inicia sesión o regístrate para acceder a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="tu@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                  </Button>
                </form>
              </Form>
              <div className="mt-4 text-center border-t border-border/50 pt-4">
                <Button
                  variant="link"
                  className="text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-4"
                  onClick={() => window.location.href = '/auth/forgot-password'}
                >
                  <HelpCircle className="w-4 h-4 mr-1.5" />
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              {registrationSuccess && (
                <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                  <AlertDescription className="space-y-3">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      ✉️ ¡Registro exitoso! Revisa tu correo electrónico
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Te hemos enviado un correo de confirmación a:
                    </p>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded">
                      {registeredEmail}
                    </p>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <p>⚠️ <strong>Importante:</strong> Revisa tu carpeta de spam/promociones</p>
                      <p>🕒 El enlace es válido por <strong>24 horas</strong></p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={handleResendEmail}
                      disabled={resendCooldown > 0 || isResending}
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Reenviando...
                        </>
                      ) : resendCooldown > 0 ? (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Reenviar en {resendCooldown}s
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Reenviar correo
                        </>
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {invitation && (
                <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium text-white">Invitación de Fighter ID</p>
                  </div>
                  <p className="text-sm text-white/90">
                    Has sido invitado como: <strong>{invitation.first_name} {invitation.last_name}</strong>
                  </p>
                  <p className="text-xs text-white/80 mt-1">
                    Tu perfil de peleador se creará automáticamente al completar el registro
                  </p>
                </div>
              )}
              {!invitation && (
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-white/90">
                    Después del registro podrás crear tu <strong>Fighter ID</strong> si deseas ser peleador profesional.
                  </p>
                </div>
              )}
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="tu@email.com"
                            {...field}
                            disabled={!!invitation}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading || validatingToken}>
                    {(loading || validatingToken) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {invitation ? 'Completar Registro' : 'Registrarse'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}