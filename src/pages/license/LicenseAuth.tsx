import { useState, useEffect, useRef } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, Mail, UserCheck, User, Upload, Camera } from 'lucide-react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { useFighterInvitations } from '@/hooks/useFighterInvitations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { uploadFighterAvatar } from '@/lib/photoUtils';

export default function LicenseAuth() {
  const { user, signIn, loading, resendConfirmation } = useLicenseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const mode = searchParams.get('mode'); // 'signin' o 'signup'
  const type = searchParams.get('type'); // 'fighter' o 'user'
  const { validateToken } = useFighterInvitations();
  const [invitation, setInvitation] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(
    mode === 'signup' && type ? 1 : 0
  );
  const [selectedUserType, setSelectedUserType] = useState<'user' | 'fighter' | null>(
    type === 'fighter' ? 'fighter' : type === 'user' ? 'user' : null
  );
  
  // Basic form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('HN');
  
  // Fighter complete data
  const [fighterData, setFighterData] = useState({
    nickname: '',
    gender: '',
    birthdate: null as Date | null,
    birthplace: '',
    document_type: '',
    document_number: '',
    height_cm: 0,
    weight_kg: 0,
    reach_cm: 0,
    blood_type: '',
    weight_class: 'Lightweight',
    martial_arts: [] as string[],
    gym_name: '',
    stance: '',
    level: 'AMATEUR',
    fighting_style: '',
    discipline: 'MMA',
    record_wins: 0,
    record_losses: 0,
    record_draws: 0,
    medical_allergies: '',
    medical_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    insurance_company: '',
    insurance_policy: '',
    bio: '',
    avatar_url: ''
  });

  // Normal user additional data
  const [userExtraData, setUserExtraData] = useState({
    avatar_url: '',
    birthdate: null as Date | null,
    bio: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [currentTab, setCurrentTab] = useState('personal');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/license/dashboard', { replace: true });
      }
    };
    
    checkSession();
  }, [navigate]);

  useEffect(() => {
    if (inviteToken) {
      validateToken(inviteToken)
        .then((data) => {
          if (data) {
            setInvitation(data);
            setEmail(data.email);
          }
        })
        .catch((error) => {
          console.error('Error validating token:', error);
        });
    }
  }, [inviteToken, validateToken]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (user && !loading) {
    return <Navigate to="/license/dashboard" replace />;
  }

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !registeredEmail) return;
    setIsResending(true);
    const { error } = await resendConfirmation(registeredEmail);
    if (error) {
      toast({ title: 'Error al reenviar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Correo reenviado', description: 'Revisa tu bandeja de entrada' });
      setResendCooldown(60);
    }
    setIsResending(false);
  };

  const handleNextStep = (userType?: 'user' | 'fighter') => {
    // Si se pasa un userType, usarlo; si no, usar el estado actual
    const typeToCheck = userType || selectedUserType;
    
    if (registrationStep === 0 && !typeToCheck) {
      toast({
        title: "Selecciona un tipo de cuenta",
        description: "Por favor, selecciona si eres usuario normal o fighter",
        variant: "destructive"
      });
      return;
    }
    
    if (registrationStep === 1 && (!firstName || !lastName || !email || !password)) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    setRegistrationStep(prev => prev + 1);
  };

  const handleFighterDataChange = (field: string, value: any) => {
    setFighterData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserDataChange = (field: string, value: any) => {
    setUserExtraData(prev => ({ ...prev, [field]: value }));
  };

  const handleMartialArtsChange = (art: string, checked: boolean) => {
    if (checked) {
      setFighterData(prev => ({ ...prev, martial_arts: [...prev.martial_arts, art] }));
    } else {
      setFighterData(prev => ({ ...prev, martial_arts: prev.martial_arts.filter(a => a !== art) }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // We'll upload after user is created, just store the file for now
      if (selectedUserType === 'fighter') {
        setFighterData(prev => ({ ...prev, avatar_file: file as any }));
      } else {
        setUserExtraData(prev => ({ ...prev, avatar_file: file as any }));
      }
      
      toast({ title: "Foto seleccionada", description: "La foto se subirá al crear tu cuenta" });
    } catch (error) {
      console.error('Error selecting photo:', error);
      toast({ title: "Error", description: "No se pudo seleccionar la foto", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleTabContinue = () => {
    const tabs = ['personal', 'physical', 'combat', 'medical', 'additional'];
    const currentIndex = tabs.indexOf(currentTab);
    
    if (currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1]);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    // Validaciones antes de enviar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Contraseña débil",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Verificar si el email ya existe en app_user
      const { data: existingUser, error: checkError } = await supabase
        .from('app_user')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      
      // Ignorar error de no encontrado, otros errores sí importan
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user:', checkError);
        throw new Error('Error verificando email. Intenta de nuevo.');
      }
        
      if (existingUser) {
        toast({
          title: "Email ya registrado",
          description: "Este email ya está en uso. Por favor inicia sesión o usa otro email.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      if (selectedUserType === 'fighter') {
        if (!fighterData.weight_class || fighterData.martial_arts.length === 0) {
          console.error('Validation failed: missing weight_class or martial_arts');
          toast({
            title: "Error",
            description: "Categoría de peso y al menos un arte marcial son obligatorios",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        console.log('Starting fighter registration...');
        
        // First create auth account
        const { error: signUpError, data: authData } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/license/pending`
          }
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          throw signUpError;
        }
        
        console.log('Auth user created, waiting for user data...');
        
        // Wait for user creation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (!newUser) {
          console.error('User not created after signup');
          throw new Error('No se pudo crear el usuario. Intenta de nuevo.');
        }

        console.log('Calling RPC function with user ID:', newUser.id);

        // Call RPC function
        const { data, error } = await supabase.rpc('create_complete_fighter_registration', {
          p_auth_user_id: newUser.id,
          p_email: email,
          p_first_name: firstName,
          p_last_name: lastName,
          p_phone: phone,
          p_country: country,
          p_weight_class: fighterData.weight_class,
          p_nickname: fighterData.nickname || null,
          p_gender: fighterData.gender || null,
          p_birthdate: fighterData.birthdate?.toISOString().split('T')[0] || null,
          p_birthplace: fighterData.birthplace || null,
          p_document_type: fighterData.document_type || null,
          p_document_number: fighterData.document_number || null,
          p_height_cm: fighterData.height_cm || null,
          p_weight_kg: fighterData.weight_kg || null,
          p_reach_cm: fighterData.reach_cm || null,
          p_blood_type: fighterData.blood_type || null,
          p_martial_arts: fighterData.martial_arts.length > 0 ? fighterData.martial_arts : null,
          p_gym_name: fighterData.gym_name || null,
          p_stance: fighterData.stance || null,
          p_level: fighterData.level || 'AMATEUR',
          p_fighting_style: fighterData.fighting_style || null,
          p_discipline: fighterData.discipline || null,
          p_record_wins: fighterData.record_wins || 0,
          p_record_losses: fighterData.record_losses || 0,
          p_record_draws: fighterData.record_draws || 0,
          p_medical_allergies: fighterData.medical_allergies || null,
          p_medical_conditions: fighterData.medical_conditions || null,
          p_emergency_contact_name: fighterData.emergency_contact_name || null,
          p_emergency_contact_phone: fighterData.emergency_contact_phone || null,
          p_emergency_contact_relation: fighterData.emergency_contact_relation || null,
          p_insurance_company: fighterData.insurance_company || null,
          p_insurance_policy: fighterData.insurance_policy || null,
          p_bio: fighterData.bio || null,
          p_avatar_url: fighterData.avatar_url || null
        });
        
        if (error) {
          console.error('RPC function error:', error);
          throw new Error(`Error en registro: ${error.message}`);
        }
        
        console.log('Fighter registration completed successfully');
        
        setRegistrationSuccess(true);
        setRegisteredEmail(email);
        setResendCooldown(60);
        
      } else {
        console.log('Starting normal user registration...');
        
        // Normal user signup
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          throw signUpError;
        }

        console.log('Auth user created, updating profile...');

        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (newUser) {
          const { error: updateError } = await supabase
            .from('app_user')
            .update({
              first_name: firstName,
              last_name: lastName,
              phone,
              country,
              avatar_url: userExtraData.avatar_url || null,
              birthdate: userExtraData.birthdate?.toISOString().split('T')[0] || null,
              bio: userExtraData.bio || null
            })
            .eq('auth_user_id', newUser.id);
            
          if (updateError) {
            console.error('Profile update error:', updateError);
            throw new Error(`Error actualizando perfil: ${updateError.message}`);
          }
        }
        
        console.log('User registration completed successfully');
        
        setRegistrationSuccess(true);
        setRegisteredEmail(email);
        setResendCooldown(60);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Error desconocido');
      toast({ 
        title: "Error en registro", 
        description: error.message || 'Ocurrió un error al crear tu cuenta. Intenta de nuevo.', 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }
    
    // Validación de contraseña
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        // Mensajes de error más amigables
        if (error.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu email antes de iniciar sesión');
        } else {
          setError(error.message);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const weightClasses = ['Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'];
  const martialArtsList = ['MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'];
  const stances = ['Orthodox', 'Southpaw', 'Switch'];
  const levels = ['AMATEUR', 'SEMI_PRO', 'PROFESSIONAL'];
  const documentTypes = ['DIN', 'Pasaporte', 'Tarjeta de Residencia'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/10 p-2 sm:p-4 py-4 sm:py-8">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm w-full">
          <CardHeader className="text-center pb-3 px-4 pt-6 sm:px-6">
            <div className="mx-auto mb-3 p-2.5 sm:p-3 rounded-full bg-primary/10">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">
              {isLogin ? 'Acceso a tu Fighter ID' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription className="text-sm">
              {isLogin ? 'Ingresa a tu portal' : 'Solicita tu acceso'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 px-4 sm:px-6 pb-6">
            {registrationSuccess && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="space-y-3">
                  <p className="font-semibold text-blue-900">✉️ ¡Registro exitoso! Revisa tu correo electrónico</p>
                  <p className="text-sm text-blue-800">Te hemos enviado un correo de confirmación a: <strong>{registeredEmail}</strong></p>
                  <p className="text-sm text-blue-800">⚠️ Revisa tu carpeta de spam/promociones</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleResendEmail}
                    disabled={resendCooldown > 0 || isResending}
                  >
                    {isResending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reenviando...</> : resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar correo'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            {/* LOGIN FORM */}
            {isLogin && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    autoComplete="email"
                    inputMode="email"
                    className="min-h-[48px]"
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      autoComplete="current-password"
                      className="min-h-[48px] pr-10"
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 touch-manipulation"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full min-h-[48px] touch-manipulation" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ingresando...</> : 'Ingresar'}
                </Button>
                <Button type="button" variant="ghost" className="w-full min-h-[48px] touch-manipulation" onClick={() => setIsLogin(false)}>
                  ¿No tienes cuenta? Regístrate
                </Button>
              </form>
            )}

            {/* REGISTRATION FLOW */}
            {!isLogin && !registrationSuccess && (
              <div className="space-y-6">
                {/* STEP 0: Account Type Selection */}
                {registrationStep === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">Selecciona el tipo de cuenta</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSelectedUserType('user');
                  handleNextStep('user');
                }}
                className={`p-6 rounded-lg border-2 transition-all min-h-[120px] touch-manipulation ${selectedUserType === 'user' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 active:bg-primary/5'}`}
              >
                <div className="flex items-center space-x-4">
                  <User className="w-12 h-12 text-primary" />
                  <div className="text-left">
                    <div className="font-bold text-lg">Usuario Normal</div>
                    <div className="text-sm text-muted-foreground">Acceso a votaciones y contenido</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => {
                  setSelectedUserType('fighter');
                  handleNextStep('fighter');
                }}
                className={`p-6 rounded-lg border-2 transition-all min-h-[120px] touch-manipulation ${selectedUserType === 'fighter' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 active:bg-primary/5'}`}
              >
                        <div className="text-center space-y-2">
                          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-red-600" />
                          </div>
                          <h4 className="font-semibold">Fighter ID</h4>
                          <p className="text-sm text-muted-foreground">Perfil profesional de peleador</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 1: Basic Info */}
                {registrationStep === 1 && (
                  <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold">Información Básica</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Nombre *</Label>
                        <Input 
                          value={firstName} 
                          onChange={(e) => setFirstName(e.target.value)} 
                          autoComplete="given-name"
                          className="min-h-[48px]"
                          required 
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Apellido *</Label>
                        <Input 
                          value={lastName} 
                          onChange={(e) => setLastName(e.target.value)}
                          autoComplete="family-name"
                          className="min-h-[48px]"
                          required 
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Email *</Label>
                      <Input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        inputMode="email"
                        className="min-h-[48px]"
                        required 
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Contraseña *</Label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          className="min-h-[48px] pr-12"
                          required 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 touch-manipulation"
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Teléfono</Label>
                      <Input 
                        type="tel"
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        inputMode="tel"
                        className="min-h-[48px]"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">País *</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="min-h-[48px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HN">Honduras</SelectItem>
                          <SelectItem value="GT">Guatemala</SelectItem>
                          <SelectItem value="SV">El Salvador</SelectItem>
                          <SelectItem value="NI">Nicaragua</SelectItem>
                          <SelectItem value="CR">Costa Rica</SelectItem>
                          <SelectItem value="PA">Panamá</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setRegistrationStep(0)} className="flex-1 min-h-[48px]">
                        Atrás
                      </Button>
                      <Button 
                        type="button" 
                        onClick={selectedUserType === 'user' ? handleFinalSubmit : () => handleNextStep()} 
                        className="flex-1 min-h-[48px]"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</> : selectedUserType === 'user' ? 'Registrarse' : 'Continuar'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Complete Fighter Info with Tabs */}
                {registrationStep === 2 && selectedUserType === 'fighter' && (
                  <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold">Información Completa de Fighter ID</h3>
                    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-5 h-auto text-xs sm:text-sm">
                        <TabsTrigger value="personal">Personal</TabsTrigger>
                        <TabsTrigger value="physical">Físico</TabsTrigger>
                        <TabsTrigger value="combat">Combate</TabsTrigger>
                        <TabsTrigger value="medical">Médico</TabsTrigger>
                        <TabsTrigger value="additional">Adicional</TabsTrigger>
                      </TabsList>

                      <TabsContent value="personal" className="space-y-3">
                        <div>
                          <Label className="text-sm">Apodo</Label>
                          <Input 
                            value={fighterData.nickname} 
                            onChange={(e) => handleFighterDataChange('nickname', e.target.value)}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Género</Label>
                          <Select value={fighterData.gender} onValueChange={(val) => handleFighterDataChange('gender', val)}>
                            <SelectTrigger className="min-h-[48px]"><SelectValue placeholder="Selecciona género" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Femenino">Femenino</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Fecha de Nacimiento</Label>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left font-normal min-h-[48px] text-sm"
                            onClick={() => setDatePickerOpen(true)}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fighterData.birthdate ? format(fighterData.birthdate, 'dd/MM/yyyy') : 'Selecciona fecha'}
                          </Button>
                          <Dialog open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Selecciona tu fecha de nacimiento</DialogTitle>
                              </DialogHeader>
                              <div className="flex justify-center">
                                <Calendar
                                  mode="single"
                                  selected={fighterData.birthdate || undefined}
                                  onSelect={(date) => {
                                    handleFighterDataChange('birthdate', date);
                                    setDatePickerOpen(false);
                                  }}
                                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                  initialFocus
                                  captionLayout="dropdown-buttons"
                                  fromYear={1900}
                                  toYear={new Date().getFullYear()}
                                  className="p-3 pointer-events-auto"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div>
                          <Label className="text-sm">Lugar de Nacimiento</Label>
                          <Input 
                            value={fighterData.birthplace} 
                            onChange={(e) => handleFighterDataChange('birthplace', e.target.value)}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Tipo de Documento</Label>
                          <Select value={fighterData.document_type} onValueChange={(val) => handleFighterDataChange('document_type', val)}>
                            <SelectTrigger className="min-h-[48px]"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                            <SelectContent>
                              {documentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Número de Documento</Label>
                          <Input 
                            value={fighterData.document_number} 
                            onChange={(e) => handleFighterDataChange('document_number', e.target.value)}
                            className="min-h-[48px]"
                          />
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleTabContinue} 
                          className="w-full min-h-[48px]"
                        >
                          Continuar
                        </Button>
                      </TabsContent>

                      <TabsContent value="physical" className="space-y-3">
                        <div>
                          <Label className="text-sm">Altura (cm)</Label>
                          <Input 
                            type="number" 
                            inputMode="numeric"
                            value={fighterData.height_cm} 
                            onChange={(e) => handleFighterDataChange('height_cm', parseInt(e.target.value))}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Peso (kg)</Label>
                          <Input 
                            type="number" 
                            inputMode="decimal"
                            value={fighterData.weight_kg} 
                            onChange={(e) => handleFighterDataChange('weight_kg', parseFloat(e.target.value))}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Alcance (cm)</Label>
                          <Input 
                            type="number" 
                            inputMode="numeric"
                            value={fighterData.reach_cm} 
                            onChange={(e) => handleFighterDataChange('reach_cm', parseInt(e.target.value))}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Tipo de Sangre</Label>
                          <Select value={fighterData.blood_type} onValueChange={(val) => handleFighterDataChange('blood_type', val)}>
                            <SelectTrigger className="min-h-[48px]"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                            <SelectContent>
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Guardia</Label>
                          <Select value={fighterData.stance} onValueChange={(val) => handleFighterDataChange('stance', val)}>
                            <SelectTrigger className="min-h-[48px]"><SelectValue placeholder="Selecciona guardia" /></SelectTrigger>
                            <SelectContent>
                              {stances.map(stance => <SelectItem key={stance} value={stance}>{stance}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleTabContinue} 
                          className="w-full min-h-[48px]"
                        >
                          Continuar
                        </Button>
                      </TabsContent>

                      <TabsContent value="combat" className="space-y-3">
                        <div>
                          <Label className="text-sm">Categoría de Peso *</Label>
                          <Select value={fighterData.weight_class} onValueChange={(val) => handleFighterDataChange('weight_class', val)}>
                            <SelectTrigger className="min-h-[48px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {weightClasses.map(wc => <SelectItem key={wc} value={wc}>{wc}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Artes Marciales * (al menos una)</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {martialArtsList.map(art => (
                              <div key={art} className="flex items-center space-x-2 min-h-[44px]">
                                <Checkbox
                                  id={`art-${art}`}
                                  checked={fighterData.martial_arts.includes(art)}
                                  onCheckedChange={(checked) => handleMartialArtsChange(art, checked as boolean)}
                                  className="min-w-[20px] min-h-[20px]"
                                />
                                <label htmlFor={`art-${art}`} className="text-sm cursor-pointer flex-1">{art}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Gimnasio/Academia</Label>
                          <Input 
                            value={fighterData.gym_name} 
                            onChange={(e) => handleFighterDataChange('gym_name', e.target.value)}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Nivel</Label>
                          <Select value={fighterData.level} onValueChange={(val) => handleFighterDataChange('level', val)}>
                            <SelectTrigger className="min-h-[48px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {levels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Estilo de Pelea</Label>
                          <Input 
                            value={fighterData.fighting_style} 
                            onChange={(e) => handleFighterDataChange('fighting_style', e.target.value)}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs sm:text-sm">Victorias</Label>
                            <Input 
                              type="number" 
                              inputMode="numeric"
                              value={fighterData.record_wins} 
                              onChange={(e) => handleFighterDataChange('record_wins', parseInt(e.target.value))}
                              className="min-h-[48px]"
                            />
                          </div>
                          <div>
                            <Label className="text-xs sm:text-sm">Derrotas</Label>
                            <Input 
                              type="number" 
                              inputMode="numeric"
                              value={fighterData.record_losses} 
                              onChange={(e) => handleFighterDataChange('record_losses', parseInt(e.target.value))}
                              className="min-h-[48px]"
                            />
                          </div>
                          <div>
                            <Label className="text-xs sm:text-sm">Empates</Label>
                            <Input 
                              type="number" 
                              inputMode="numeric"
                              value={fighterData.record_draws} 
                              onChange={(e) => handleFighterDataChange('record_draws', parseInt(e.target.value))}
                              className="min-h-[48px]"
                            />
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleTabContinue} 
                          className="w-full min-h-[48px]"
                        >
                          Continuar
                        </Button>
                      </TabsContent>

                      <TabsContent value="medical" className="space-y-3">
                        <div>
                          <Label className="text-sm">Alergias Médicas</Label>
                          <Textarea 
                            value={fighterData.medical_allergies} 
                            onChange={(e) => handleFighterDataChange('medical_allergies', e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Condiciones Médicas</Label>
                          <Textarea 
                            value={fighterData.medical_conditions} 
                            onChange={(e) => handleFighterDataChange('medical_conditions', e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Contacto de Emergencia (Nombre)</Label>
                          <Input 
                            value={fighterData.emergency_contact_name} 
                            onChange={(e) => handleFighterDataChange('emergency_contact_name', e.target.value)}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Contacto de Emergencia (Teléfono)</Label>
                          <Input 
                            type="tel"
                            inputMode="tel"
                            value={fighterData.emergency_contact_phone} 
                            onChange={(e) => handleFighterDataChange('emergency_contact_phone', e.target.value)}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Relación con Contacto</Label>
                          <Input 
                            value={fighterData.emergency_contact_relation} 
                            onChange={(e) => handleFighterDataChange('emergency_contact_relation', e.target.value)}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Compañía de Seguro</Label>
                          <Input 
                            value={fighterData.insurance_company} 
                            onChange={(e) => handleFighterDataChange('insurance_company', e.target.value)}
                            className="min-h-[48px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Póliza de Seguro</Label>
                          <Input 
                            value={fighterData.insurance_policy} 
                            onChange={(e) => handleFighterDataChange('insurance_policy', e.target.value)}
                            className="min-h-[48px]"
                          />
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleTabContinue} 
                          className="w-full min-h-[48px]"
                        >
                          Continuar
                        </Button>
                      </TabsContent>

                      <TabsContent value="additional" className="space-y-3">
                        <div>
                          <Label className="text-sm">Biografía</Label>
                          <Textarea 
                            value={fighterData.bio} 
                            onChange={(e) => handleFighterDataChange('bio', e.target.value)} 
                            placeholder="Cuéntanos sobre tu trayectoria como peleador..."
                            className="min-h-[120px]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Foto de Perfil</Label>
                          <div className="space-y-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                            {photoPreview ? (
                              <div className="relative w-full aspect-square max-w-[200px] mx-auto">
                                <img 
                                  src={photoPreview} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => {
                                    setPhotoPreview('');
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                  }}
                                >
                                  Cambiar
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full min-h-[100px] flex-col gap-2"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto}
                              >
                                <Upload className="h-8 w-8" />
                                <span className="text-sm">
                                  {uploadingPhoto ? 'Procesando...' : 'Seleccionar Foto'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Desde cámara o galería
                                </span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setRegistrationStep(1)} className="flex-1 min-h-[48px]">
                        Atrás
                      </Button>
                      <Button 
                        type="button" 
                        onClick={handleFinalSubmit} 
                        className="flex-1 min-h-[48px]"
                        disabled={isSubmitting || !fighterData.weight_class || fighterData.martial_arts.length === 0}
                      >
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando Fighter ID...</> : 'Crear Fighter ID'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Back to login link */}
                {registrationStep === 0 && (
                  <Button type="button" variant="ghost" className="w-full min-h-[48px]" onClick={() => setIsLogin(true)}>
                    ¿Ya tienes cuenta? Inicia sesión
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
