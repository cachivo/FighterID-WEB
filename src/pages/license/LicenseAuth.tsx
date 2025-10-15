import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function LicenseAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, loading, user, resendConfirmation } = useAuth();

  // Estados del formulario
  const [showPassword, setShowPassword] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Datos básicos de registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('HN');
  const [birthdate, setBirthdate] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    // Si el usuario ya está autenticado, redirigir
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!email || !password) {
      toast.error('Email y contraseña son requeridos');
      return;
    }
    if (!firstName || !lastName) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }
    if (!birthdate) {
      toast.error('Fecha de nacimiento es requerida');
      return;
    }

    try {
      // Subir avatar si existe
      let avatarUrl = '';
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }

      // Registro con metadata mínima
      const { error } = await signUp(email, password);

      if (error) {
        toast.error(error.message || 'Error al registrarse');
        return;
      }

      // Éxito
      setEmailSuccess(true);
      toast.success('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');

    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Error al registrarse');
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    try {
      const { error } = await resendConfirmation(email);
      if (error) {
        toast.error(error.message || 'Error al reenviar email');
      } else {
        toast.success('Email reenviado correctamente');
        setResendCooldown(60);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al reenviar email');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message || 'Credenciales inválidas');
    } else {
      toast.success('Sesión iniciada correctamente');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto mb-4"></div>
          <p className="text-gold-200">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-red-900/40 to-orange-950/30 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[url('/lovable-uploads/octagon-background.png')] opacity-5 bg-cover bg-center" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
      
      <Card className="w-full max-w-md bg-slate-900/90 border-gold-500/30 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-gold-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Fighter ID Portal
          </CardTitle>
          <CardDescription className="text-gold-200">
            Accede a tu cuenta o crea una nueva
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue={searchParams.get('mode') === 'signup' ? 'signup' : 'login'} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div className="relative">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-6 h-9 w-9"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/license/forgot-password')}
                    className="text-gold-400 hover:text-gold-300"
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {emailSuccess ? (
                <div className="space-y-6 py-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-green-500/20 rounded-full p-4">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        ¡Revisa tu correo!
                      </h3>
                      <p className="text-gray-300">
                        Hemos enviado un email de confirmación a
                      </p>
                      <p className="text-gold-400 font-semibold mt-1">{email}</p>
                    </div>
                    <p className="text-sm text-gray-400 max-w-md">
                      Haz clic en el enlace del email para activar tu cuenta. Si no lo ves, revisa tu carpeta de spam.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full px-4">
                      <Button
                        variant="outline"
                        onClick={handleResendEmail}
                        disabled={resendCooldown > 0}
                        className="flex-1"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar email'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEmailSuccess(false);
                          setEmail('');
                        }}
                        className="flex-1 border border-gold-500/30 hover:bg-gold-500/10"
                      >
                        Cambiar correo
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Juan"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Pérez"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-6 h-9 w-9"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="birthdate">Fecha de Nacimiento</Label>
                      <Input
                        id="birthdate"
                        type="date"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="HN"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="avatar">Foto de Perfil (Opcional)</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                    {avatarPreview && (
                      <img 
                        src={avatarPreview} 
                        alt="Preview" 
                        className="mt-2 w-24 h-24 object-cover rounded-full border-2 border-gold-500" 
                      />
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>

                  <p className="text-sm text-center text-gray-400 mt-4">
                    ¿Eres peleador? Podrás solicitar tu Fighter ID después del registro.
                  </p>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
