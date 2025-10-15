import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, Mail, UserCheck } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

export default function LicenseAuth() {
  const { user, signIn, loading, resendConfirmation } = useLicenseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const { validateToken } = useFighterInvitations();
  const [invitation, setInvitation] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0);
  const [selectedUserType, setSelectedUserType] = useState<'user' | 'fighter' | null>(null);
  
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

  useEffect(() => {
    if (supabase.auth.getSession()) {
      navigate('/license/dashboard');
    }
  }, []);

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

  const handleNextStep = () => {
    if (registrationStep === 0 && !selectedUserType) {
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

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (selectedUserType === 'fighter') {
        if (!fighterData.weight_class || fighterData.martial_arts.length === 0) {
          toast({
            title: "Error",
            description: "Categoría de peso y al menos un arte marcial son obligatorios",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        // First create auth account
        const { error: signUpError, data: authData } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/license/pending`
          }
        });

        if (signUpError) throw signUpError;
        
        // Wait for user creation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (!newUser) throw new Error('User not created');

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
        
        if (error) throw error;
        
        setRegistrationSuccess(true);
        setRegisteredEmail(email);
        setResendCooldown(60);
        
      } else {
        // Normal user signup
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (signUpError) throw signUpError;

        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (newUser) {
          await supabase
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
        }
        
        setRegistrationSuccess(true);
        setRegisteredEmail(email);
        setResendCooldown(60);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/10 p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? 'Acceso a tu Fighter ID' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Ingresa a tu portal' : 'Solicita tu acceso'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label>Contraseña</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ingresando...</> : 'Ingresar'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setIsLogin(false)}>
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
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setSelectedUserType('user');
                          handleNextStep();
                        }}
                        className={`p-6 rounded-lg border-2 transition-all ${selectedUserType === 'user' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      >
                        <div className="text-center space-y-2">
                          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-blue-600" />
                          </div>
                          <h4 className="font-semibold">Usuario Normal</h4>
                          <p className="text-sm text-muted-foreground">Acceso al feed social y eventos</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUserType('fighter');
                          handleNextStep();
                        }}
                        className={`p-6 rounded-lg border-2 transition-all ${selectedUserType === 'fighter' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
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
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Información Básica</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre *</Label>
                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                      </div>
                      <div>
                        <Label>Apellido *</Label>
                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                      </div>
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                      <Label>Contraseña *</Label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          required 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label>Teléfono</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div>
                      <Label>País *</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger>
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
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setRegistrationStep(0)} className="flex-1">
                        Atrás
                      </Button>
                      <Button 
                        type="button" 
                        onClick={selectedUserType === 'user' ? handleFinalSubmit : handleNextStep} 
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</> : selectedUserType === 'user' ? 'Registrarse' : 'Continuar'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Complete Fighter Info with Tabs */}
                {registrationStep === 2 && selectedUserType === 'fighter' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Información Completa de Fighter ID</h3>
                    <Tabs defaultValue="personal" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="personal">Personal</TabsTrigger>
                        <TabsTrigger value="physical">Físico</TabsTrigger>
                        <TabsTrigger value="combat">Combate</TabsTrigger>
                        <TabsTrigger value="medical">Médico</TabsTrigger>
                        <TabsTrigger value="additional">Adicional</TabsTrigger>
                      </TabsList>

                      <TabsContent value="personal" className="space-y-4">
                        <div>
                          <Label>Apodo</Label>
                          <Input value={fighterData.nickname} onChange={(e) => handleFighterDataChange('nickname', e.target.value)} />
                        </div>
                        <div>
                          <Label>Género</Label>
                          <Select value={fighterData.gender} onValueChange={(val) => handleFighterDataChange('gender', val)}>
                            <SelectTrigger><SelectValue placeholder="Selecciona género" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Femenino">Femenino</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Fecha de Nacimiento</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {fighterData.birthdate ? format(fighterData.birthdate, 'PP', { locale: es }) : 'Selecciona fecha'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 pointer-events-auto">
                              <Calendar
                                mode="single"
                                selected={fighterData.birthdate || undefined}
                                onSelect={(date) => handleFighterDataChange('birthdate', date)}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label>Lugar de Nacimiento</Label>
                          <Input value={fighterData.birthplace} onChange={(e) => handleFighterDataChange('birthplace', e.target.value)} />
                        </div>
                        <div>
                          <Label>Tipo de Documento</Label>
                          <Select value={fighterData.document_type} onValueChange={(val) => handleFighterDataChange('document_type', val)}>
                            <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                            <SelectContent>
                              {documentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Número de Documento</Label>
                          <Input value={fighterData.document_number} onChange={(e) => handleFighterDataChange('document_number', e.target.value)} />
                        </div>
                      </TabsContent>

                      <TabsContent value="physical" className="space-y-4">
                        <div>
                          <Label>Altura (cm)</Label>
                          <Input type="number" value={fighterData.height_cm} onChange={(e) => handleFighterDataChange('height_cm', parseInt(e.target.value))} />
                        </div>
                        <div>
                          <Label>Peso (kg)</Label>
                          <Input type="number" value={fighterData.weight_kg} onChange={(e) => handleFighterDataChange('weight_kg', parseFloat(e.target.value))} />
                        </div>
                        <div>
                          <Label>Alcance (cm)</Label>
                          <Input type="number" value={fighterData.reach_cm} onChange={(e) => handleFighterDataChange('reach_cm', parseInt(e.target.value))} />
                        </div>
                        <div>
                          <Label>Tipo de Sangre</Label>
                          <Select value={fighterData.blood_type} onValueChange={(val) => handleFighterDataChange('blood_type', val)}>
                            <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                            <SelectContent>
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Guardia</Label>
                          <Select value={fighterData.stance} onValueChange={(val) => handleFighterDataChange('stance', val)}>
                            <SelectTrigger><SelectValue placeholder="Selecciona guardia" /></SelectTrigger>
                            <SelectContent>
                              {stances.map(stance => <SelectItem key={stance} value={stance}>{stance}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>

                      <TabsContent value="combat" className="space-y-4">
                        <div>
                          <Label>Categoría de Peso *</Label>
                          <Select value={fighterData.weight_class} onValueChange={(val) => handleFighterDataChange('weight_class', val)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {weightClasses.map(wc => <SelectItem key={wc} value={wc}>{wc}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Artes Marciales * (al menos una)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {martialArtsList.map(art => (
                              <div key={art} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`art-${art}`}
                                  checked={fighterData.martial_arts.includes(art)}
                                  onCheckedChange={(checked) => handleMartialArtsChange(art, checked as boolean)}
                                />
                                <label htmlFor={`art-${art}`} className="text-sm">{art}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Gimnasio/Academia</Label>
                          <Input value={fighterData.gym_name} onChange={(e) => handleFighterDataChange('gym_name', e.target.value)} />
                        </div>
                        <div>
                          <Label>Nivel</Label>
                          <Select value={fighterData.level} onValueChange={(val) => handleFighterDataChange('level', val)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {levels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Estilo de Pelea</Label>
                          <Input value={fighterData.fighting_style} onChange={(e) => handleFighterDataChange('fighting_style', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Victorias</Label>
                            <Input type="number" value={fighterData.record_wins} onChange={(e) => handleFighterDataChange('record_wins', parseInt(e.target.value))} />
                          </div>
                          <div>
                            <Label>Derrotas</Label>
                            <Input type="number" value={fighterData.record_losses} onChange={(e) => handleFighterDataChange('record_losses', parseInt(e.target.value))} />
                          </div>
                          <div>
                            <Label>Empates</Label>
                            <Input type="number" value={fighterData.record_draws} onChange={(e) => handleFighterDataChange('record_draws', parseInt(e.target.value))} />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="medical" className="space-y-4">
                        <div>
                          <Label>Alergias Médicas</Label>
                          <Textarea value={fighterData.medical_allergies} onChange={(e) => handleFighterDataChange('medical_allergies', e.target.value)} />
                        </div>
                        <div>
                          <Label>Condiciones Médicas</Label>
                          <Textarea value={fighterData.medical_conditions} onChange={(e) => handleFighterDataChange('medical_conditions', e.target.value)} />
                        </div>
                        <div>
                          <Label>Contacto de Emergencia (Nombre)</Label>
                          <Input value={fighterData.emergency_contact_name} onChange={(e) => handleFighterDataChange('emergency_contact_name', e.target.value)} />
                        </div>
                        <div>
                          <Label>Contacto de Emergencia (Teléfono)</Label>
                          <Input value={fighterData.emergency_contact_phone} onChange={(e) => handleFighterDataChange('emergency_contact_phone', e.target.value)} />
                        </div>
                        <div>
                          <Label>Relación con Contacto</Label>
                          <Input value={fighterData.emergency_contact_relation} onChange={(e) => handleFighterDataChange('emergency_contact_relation', e.target.value)} />
                        </div>
                        <div>
                          <Label>Compañía de Seguro</Label>
                          <Input value={fighterData.insurance_company} onChange={(e) => handleFighterDataChange('insurance_company', e.target.value)} />
                        </div>
                        <div>
                          <Label>Póliza de Seguro</Label>
                          <Input value={fighterData.insurance_policy} onChange={(e) => handleFighterDataChange('insurance_policy', e.target.value)} />
                        </div>
                      </TabsContent>

                      <TabsContent value="additional" className="space-y-4">
                        <div>
                          <Label>Biografía</Label>
                          <Textarea 
                            value={fighterData.bio} 
                            onChange={(e) => handleFighterDataChange('bio', e.target.value)} 
                            placeholder="Cuéntanos sobre tu trayectoria como peleador..."
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label>URL de Avatar/Foto</Label>
                          <Input value={fighterData.avatar_url} onChange={(e) => handleFighterDataChange('avatar_url', e.target.value)} placeholder="https://..." />
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setRegistrationStep(1)} className="flex-1">
                        Atrás
                      </Button>
                      <Button 
                        type="button" 
                        onClick={handleFinalSubmit} 
                        className="flex-1"
                        disabled={isSubmitting || !fighterData.weight_class || fighterData.martial_arts.length === 0}
                      >
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando Fighter ID...</> : 'Crear Fighter ID'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Back to login link */}
                {registrationStep === 0 && (
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setIsLogin(true)}>
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
