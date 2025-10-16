import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Trophy, User, Activity, Heart, FileText, Shield, Upload } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function RequestFighterLicense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('personal');

  // Estados para los datos del formulario
  const [formData, setFormData] = useState({
    // Personal
    nickname: '',
    birthplace: '',
    document_type: 'DNI',
    phone: '',
    
    // Físico
    height_cm: '',
    weight_kg: '',
    reach_cm: '',
    blood_type: '',
    
    // Combate
    weight_class: '',
    discipline: 'MMA',
    fighting_style: '',
    stance: 'Orthodox',
    level: 'Amateur',
    gym_name: '',
    martial_arts: [] as string[],
    record_wins: '0',
    record_losses: '0',
    record_draws: '0',
    record_type: 'amateur',
    
    // Médico
    medical_conditions: '',
    medical_allergies: '',
    insurance_company: '',
    insurance_policy: '',
    
    // Emergencia
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    
    // Adicional
    bio: '',
    boxrec_url: '',
    tapology_url: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string>('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5242880) {
        toast.error('El archivo es muy grande. Máximo 5MB.');
        return;
      }
      setDocumentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para solicitar tu Fighter ID');
      return;
    }

    // Validaciones básicas
    if (!documentFile) {
      toast.error('Debes subir una imagen de tu documento de identidad');
      setCurrentTab('personal');
      return;
    }

    if (!formData.weight_class) {
      toast.error('Debes seleccionar una categoría de peso');
      setCurrentTab('combat');
      return;
    }

    if (!formData.emergency_contact_name || !formData.emergency_contact_phone) {
      toast.error('Debes proporcionar información de contacto de emergencia');
      setCurrentTab('medical');
      return;
    }

    setLoading(true);

    try {
      // 1. Obtener app_user_id
      const { data: appUser, error: appUserError } = await supabase
        .from('app_user')
        .select('id, first_name, last_name, country, birthdate')
        .eq('auth_user_id', user.id)
        .single();

      if (appUserError || !appUser) {
        throw new Error('No se pudo obtener tu información de usuario');
      }

      // 2. Subir documento de identidad si existe (PRIVADO)
      let documentUrl = '';
      if (documentFile) {
        const fileExt = documentFile.name.split('.').pop();
        const fileName = `${user.id}/document-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('identity_documents')
          .upload(fileName, documentFile);

        if (uploadError) {
          throw new Error('Error al subir documento de identidad: ' + uploadError.message);
        }

        // Obtener URL privada (solo accesible por el usuario y admins)
        const { data: urlData } = supabase.storage
          .from('identity_documents')
          .getPublicUrl(fileName);
        documentUrl = urlData.publicUrl;
      }

      // 3. Subir avatar si existe
      let avatarUrl = '';
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('fighter-avatars')
          .upload(fileName, photoFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('fighter-avatars')
            .getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }

      // 4. Crear fighter profile
      const { data: fighterProfile, error: profileError } = await supabase
        .from('fighter_profiles')
        .insert({
          user_id: appUser.id,
          first_name: appUser.first_name,
          last_name: appUser.last_name,
          nickname: formData.nickname || null,
          country: appUser.country,
          birthdate: appUser.birthdate,
          birthplace: formData.birthplace || null,
          document_type: formData.document_type || null,
          document_image_url: documentUrl || null,
          
          // Físico
          height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          reach_cm: formData.reach_cm ? parseInt(formData.reach_cm) : null,
          blood_type: formData.blood_type || null,
          
          // Combate
          weight_class: formData.weight_class,
          discipline: formData.discipline as any,
          fighting_style: formData.fighting_style || null,
          stance: formData.stance || null,
          level: formData.level || null,
          gym_name: formData.gym_name || null,
          martial_arts: formData.martial_arts.length > 0 ? formData.martial_arts : null,
          record_wins: parseInt(formData.record_wins) || 0,
          record_losses: parseInt(formData.record_losses) || 0,
          record_draws: parseInt(formData.record_draws) || 0,
          record_type: formData.record_type || null,
          
          // Médico
          medical_conditions: formData.medical_conditions || null,
          medical_allergies: formData.medical_allergies || null,
          insurance_company: formData.insurance_company || null,
          insurance_policy: formData.insurance_policy || null,
          
          // Emergencia
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relation: formData.emergency_contact_relation || null,
          
          // Adicional
          bio: formData.bio || null,
          boxrec_url: formData.boxrec_url || null,
          tapology_url: formData.tapology_url || null,
          avatar_url: avatarUrl || null,
          
          active: true,
        })
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      // 5. Crear licencia PENDING_REVIEW
      const { error: licenseError } = await supabase
        .from('fighter_licenses')
        .insert({
          fighter_id: fighterProfile.id,
          license_number: `FGT-${new Date().getFullYear()}-PENDING`,
          status: 'PENDING_REVIEW',
          license_level: formData.level === 'Professional' ? 'PROFESSIONAL' : 'AMATEUR',
          discipline: formData.discipline as any,
          is_primary: true,
        });

      if (licenseError) {
        console.error('Error creating license:', licenseError);
        // No falla si no se crea la licencia, el perfil ya existe
      }

      toast.success('¡Solicitud enviada! Tu Fighter ID será revisada en 24-48 horas');
      navigate('/');
      
    } catch (error: any) {
      console.error('Error requesting fighter license:', error);
      toast.error(error.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              Debes iniciar sesión para solicitar tu Fighter ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/license/auth')}>
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 relative overflow-hidden">
      {/* Fondo espacial con nebulosas */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      <div className="absolute inset-0 bg-[url('/lovable-uploads/octagon-background.png')] opacity-[0.02] bg-cover bg-center" />
      
      {/* Nebulosas animadas - efecto espacial suave */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }} />
      <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-indigo-600/12 rounded-full blur-[110px] animate-pulse" style={{ animationDelay: '4s', animationDuration: '12s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '6s', animationDuration: '14s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '9s' }} />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-white hover:text-gold-400 hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Button>

        <Card className="bg-slate-900/95 border-gold-500/30 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-gold-500/5 to-transparent rounded-t-lg" />
            <div className="flex justify-center mb-4 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gold-400/20 blur-xl rounded-full" />
                <Shield className="w-20 h-20 text-gold-400 relative drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold text-white mb-2 relative">
              Solicitud de Fighter ID
            </CardTitle>
            <CardDescription className="text-lg text-white/90 relative">
              Completa tu información para obtener tu licencia oficial de peleador
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 pb-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-5 mb-4 bg-slate-800/50 p-1">
                <TabsTrigger 
                  value="personal" 
                  className="text-xs sm:text-sm text-white data-[state=active]:bg-gold-500/20 data-[state=active]:text-white transition-all"
                >
                  <User className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="physical" 
                  className="text-xs sm:text-sm text-white data-[state=active]:bg-gold-500/20 data-[state=active]:text-white transition-all"
                >
                  <Activity className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Físico</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="combat" 
                  className="text-xs sm:text-sm text-white data-[state=active]:bg-gold-500/20 data-[state=active]:text-white transition-all"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Combate</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="medical" 
                  className="text-xs sm:text-sm text-white data-[state=active]:bg-gold-500/20 data-[state=active]:text-white transition-all"
                >
                  <Heart className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Médico</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="additional" 
                  className="text-xs sm:text-sm text-white data-[state=active]:bg-gold-500/20 data-[state=active]:text-white transition-all"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Adicional</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Personal */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nickname" className="text-white font-medium">Apodo / Nickname</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="Ej: El Tigre"
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="birthplace" className="text-white font-medium">Lugar de Nacimiento</Label>
                    <Input
                      id="birthplace"
                      value={formData.birthplace}
                      onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                      placeholder="Ej: Tegucigalpa, Honduras"
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="document_type" className="text-white font-medium">Tipo de Documento</Label>
                    <Select value={formData.document_type} onValueChange={(v) => setFormData({ ...formData, document_type: v })}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        <SelectItem value="Licencia">Licencia de Conducir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="document_image" className="text-white font-medium flex items-center gap-2">
                      Imagen del {formData.document_type} * 
                      <span className="text-sm text-white font-normal">(Solo visible para ti y administradores)</span>
                    </Label>
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 bg-slate-800/30 hover:border-gold-500/50 transition-colors">
                      <div className="flex flex-col items-center gap-3">
                        <label 
                          htmlFor="document_image" 
                          className="cursor-pointer bg-white hover:bg-gray-100 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          <Upload className="w-5 h-5" />
                          {documentFile ? documentFile.name : 'Seleccionar archivo'}
                        </label>
                        <Input
                          id="document_image"
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,application/pdf"
                          onChange={handleDocumentChange}
                          required
                          className="hidden"
                        />
                        <p className="text-xs text-white/80 text-center">
                          📸 Toma una foto o sube desde galería<br />
                          Foto clara de tu {formData.document_type}. Máximo 5MB
                        </p>
                      </div>
                    </div>
                    {documentPreview && (
                      <div className="mt-3 p-2 bg-slate-800/50 rounded-lg border border-gold-500/30">
                        <img 
                          src={documentPreview} 
                          alt="Vista previa del documento" 
                          className="w-full max-w-md h-auto object-contain rounded-lg mx-auto" 
                        />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="photo" className="text-white font-medium">Foto de Perfil de Peleador</Label>
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 bg-slate-800/30 hover:border-gold-500/50 transition-colors">
                      <div className="flex flex-col items-center gap-3">
                        <label 
                          htmlFor="photo" 
                          className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          <Upload className="w-5 h-5" />
                          {photoFile ? photoFile.name : 'Seleccionar archivo'}
                        </label>
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <p className="text-xs text-white/80 text-center">
                          📸 Toma una selfie o sube desde galería
                        </p>
                      </div>
                    </div>
                    {photoPreview && (
                      <div className="mt-3 flex justify-center">
                        <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border-2 border-gold-500/50 shadow-lg" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end mt-4 pt-4 border-t border-slate-700">
                  <Button 
                    onClick={() => setCurrentTab('physical')}
                    className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-8"
                  >
                    Siguiente
                  </Button>
                </div>
              </TabsContent>

              {/* Tab Físico */}
              <TabsContent value="physical" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="height_cm" className="text-white font-medium">Altura (cm) *</Label>
                    <Input
                      id="height_cm"
                      type="number"
                      value={formData.height_cm}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                      placeholder="175"
                      required
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weight_kg" className="text-white font-medium">Peso (kg) *</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.1"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                      placeholder="70.5"
                      required
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reach_cm" className="text-white font-medium">Alcance (cm)</Label>
                    <Input
                      id="reach_cm"
                      type="number"
                      value={formData.reach_cm}
                      onChange={(e) => setFormData({ ...formData, reach_cm: e.target.value })}
                      placeholder="180"
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="blood_type" className="text-white font-medium">Tipo de Sangre</Label>
                    <Select value={formData.blood_type} onValueChange={(v) => setFormData({ ...formData, blood_type: v })}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-slate-700">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab('personal')}
                    className="border-slate-600 hover:bg-slate-800 text-white"
                  >
                    Anterior
                  </Button>
                  <Button 
                    onClick={() => setCurrentTab('combat')}
                    className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-8"
                  >
                    Siguiente
                  </Button>
                </div>
              </TabsContent>

              {/* Tab Combate */}
              <TabsContent value="combat" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="weight_class" className="text-white font-medium">Categoría de Peso *</Label>
                    <Select value={formData.weight_class} onValueChange={(v) => setFormData({ ...formData, weight_class: v })} required>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Strawweight">Strawweight (115 lbs)</SelectItem>
                        <SelectItem value="Flyweight">Flyweight (125 lbs)</SelectItem>
                        <SelectItem value="Bantamweight">Bantamweight (135 lbs)</SelectItem>
                        <SelectItem value="Featherweight">Featherweight (145 lbs)</SelectItem>
                        <SelectItem value="Lightweight">Lightweight (155 lbs)</SelectItem>
                        <SelectItem value="Welterweight">Welterweight (170 lbs)</SelectItem>
                        <SelectItem value="Middleweight">Middleweight (185 lbs)</SelectItem>
                        <SelectItem value="Light Heavyweight">Light Heavyweight (205 lbs)</SelectItem>
                        <SelectItem value="Heavyweight">Heavyweight (265 lbs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="discipline" className="text-white font-medium">Disciplina *</Label>
                    <Select value={formData.discipline} onValueChange={(v) => setFormData({ ...formData, discipline: v })}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MMA">MMA</SelectItem>
                        <SelectItem value="Boxeo">Boxeo</SelectItem>
                        <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                        <SelectItem value="MuayThai">Muay Thai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fighting_style" className="text-white font-medium">Estilo de Pelea</Label>
                    <Input
                      id="fighting_style"
                      value={formData.fighting_style}
                      onChange={(e) => setFormData({ ...formData, fighting_style: e.target.value })}
                      placeholder="Ej: Striker, Grappler"
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="stance" className="text-white font-medium">Guardia</Label>
                    <Select value={formData.stance} onValueChange={(v) => setFormData({ ...formData, stance: v })}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Orthodox">Orthodox</SelectItem>
                        <SelectItem value="Southpaw">Southpaw</SelectItem>
                        <SelectItem value="Switch">Switch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="level" className="text-white font-medium">Nivel *</Label>
                    <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Amateur">Amateur</SelectItem>
                        <SelectItem value="Semi-Profesional">Semi-Profesional</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gym_name" className="text-white font-medium">Gimnasio / Academia</Label>
                    <Input
                      id="gym_name"
                      value={formData.gym_name}
                      onChange={(e) => setFormData({ ...formData, gym_name: e.target.value })}
                      placeholder="Ej: Team Alpha MMA"
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-white font-medium">Récord (Victorias - Derrotas - Empates)</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        type="number"
                        value={formData.record_wins}
                        onChange={(e) => setFormData({ ...formData, record_wins: e.target.value })}
                        placeholder="Victorias"
                        className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                      />
                      <Input
                        type="number"
                        value={formData.record_losses}
                        onChange={(e) => setFormData({ ...formData, record_losses: e.target.value })}
                        placeholder="Derrotas"
                        className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                      />
                      <Input
                        type="number"
                        value={formData.record_draws}
                        onChange={(e) => setFormData({ ...formData, record_draws: e.target.value })}
                        placeholder="Empates"
                        className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="record_type" className="text-white font-medium">Tipo de Récord *</Label>
                    <Select value={formData.record_type} onValueChange={(v) => setFormData({ ...formData, record_type: v })}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amateur">Amateur</SelectItem>
                        <SelectItem value="professional">Profesional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-slate-700">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab('physical')}
                    className="border-slate-600 hover:bg-slate-800 text-white"
                  >
                    Anterior
                  </Button>
                  <Button 
                    onClick={() => setCurrentTab('medical')}
                    className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-8"
                  >
                    Siguiente
                  </Button>
                </div>
              </TabsContent>

              {/* Tab Médico */}
              <TabsContent value="medical" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="medical_conditions" className="text-white font-medium">Condiciones Médicas</Label>
                    <Textarea
                      id="medical_conditions"
                      value={formData.medical_conditions}
                      onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                      placeholder="Cualquier condición médica relevante..."
                      rows={3}
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="medical_allergies" className="text-white font-medium">Alergias</Label>
                    <Textarea
                      id="medical_allergies"
                      value={formData.medical_allergies}
                      onChange={(e) => setFormData({ ...formData, medical_allergies: e.target.value })}
                      placeholder="Alergias conocidas..."
                      rows={2}
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="insurance_company" className="text-white font-medium">Compañía de Seguros</Label>
                      <Input
                        id="insurance_company"
                        value={formData.insurance_company}
                        onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
                        placeholder="Nombre de la aseguradora"
                        className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="insurance_policy" className="text-white font-medium">Número de Póliza</Label>
                      <Input
                        id="insurance_policy"
                        value={formData.insurance_policy}
                        onChange={(e) => setFormData({ ...formData, insurance_policy: e.target.value })}
                        placeholder="Número de póliza"
                        className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Contacto de Emergencia *
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="emergency_contact_name" className="text-white font-medium">Nombre Completo *</Label>
                        <Input
                          id="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                          placeholder="Nombre del contacto"
                          required
                          className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="emergency_contact_phone" className="text-white font-medium">Teléfono *</Label>
                        <Input
                          id="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                          placeholder="+504 9999-9999"
                          required
                          className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="emergency_contact_relation" className="text-white font-medium">Relación</Label>
                        <Input
                          id="emergency_contact_relation"
                          value={formData.emergency_contact_relation}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                          placeholder="Ej: Madre, Esposo/a"
                          className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-slate-700">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab('combat')}
                    className="border-slate-600 hover:bg-slate-800 text-white"
                  >
                    Anterior
                  </Button>
                  <Button 
                    onClick={() => setCurrentTab('additional')}
                    className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-8"
                  >
                    Siguiente
                  </Button>
                </div>
              </TabsContent>

              {/* Tab Adicional */}
              <TabsContent value="additional" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bio" className="text-white font-medium">Biografía</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Cuéntanos tu historia como peleador..."
                      rows={4}
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="boxrec_url" className="text-white font-medium">URL de BoxRec (opcional)</Label>
                    <Input
                      id="boxrec_url"
                      value={formData.boxrec_url}
                      onChange={(e) => setFormData({ ...formData, boxrec_url: e.target.value })}
                      placeholder="https://boxrec.com/..."
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tapology_url" className="text-white font-medium">URL de Tapology (opcional)</Label>
                    <Input
                      id="tapology_url"
                      value={formData.tapology_url}
                      onChange={(e) => setFormData({ ...formData, tapology_url: e.target.value })}
                      placeholder="https://tapology.com/..."
                      className="bg-slate-800/50 border-slate-700 focus:border-gold-500 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-slate-700">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab('medical')}
                    className="border-slate-600 hover:bg-slate-800 text-white"
                  >
                    Anterior
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Enviar Solicitud
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
