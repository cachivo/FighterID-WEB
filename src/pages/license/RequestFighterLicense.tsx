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
import { z } from 'zod';

export default function RequestFighterLicense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('personal');

  // Estados para los datos del formulario
  const [formData, setFormData] = useState({
    // Personal
    first_name: '',
    last_name: '',
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
    record_type: 'Amateur',
    
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
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string>('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 50MB)
      if (file.size > 52428800) {
        toast.error('La foto es muy grande. Máximo 50MB.');
        return;
      }
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
      // Validar tamaño (máximo 50MB)
      if (file.size > 52428800) {
        toast.error('El documento es muy grande. Máximo 50MB.');
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

    setLoading(true);

    try {
      // 1. Pre-check: verificar si ya tiene una licencia activa
      const { data: appUserData } = await supabase
        .from('app_user')
        .select('id, first_name, last_name, country, birthdate')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!appUserData) {
        throw new Error('No se pudo obtener tu información de usuario');
      }

      const { data: existingProfile } = await supabase
        .from('fighter_profiles')
        .select('id, license_number')
        .eq('user_id', appUserData.id)
        .eq('active', true)
        .maybeSingle();

      if (existingProfile) {
        toast.error(
          `Ya tienes una Fighter ID activa${existingProfile.license_number ? ` (${existingProfile.license_number})` : ''}. No puedes solicitar otra.`
        );
        setLoading(false);
        return;
      }

      // 2. Validaciones básicas
      if (!formData.first_name.trim() || !formData.last_name.trim()) {
        toast.error('Por favor completa tu nombre y apellido');
        setCurrentTab('personal');
        setLoading(false);
        return;
      }

      if (!documentFile) {
        toast.error('Debes subir una imagen de tu documento de identidad');
        setCurrentTab('personal');
        setLoading(false);
        return;
      }

      if (!formData.weight_class) {
        toast.error('Debes seleccionar una categoría de peso');
        setCurrentTab('combat');
        setLoading(false);
        return;
      }

      if (!formData.emergency_contact_name || !formData.emergency_contact_phone) {
        toast.error('Debes proporcionar información de contacto de emergencia');
        setCurrentTab('medical');
        setLoading(false);
        return;
      }

      // 3. Actualizar app_user con nombre y apellido
      const { error: updateUserError } = await supabase
        .from('app_user')
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);

      if (updateUserError) {
        console.error('Error actualizando usuario:', updateUserError);
        toast.error('Error actualizando tu perfil');
        setLoading(false);
        return;
      }

      // 4. Sanitizar payload: convertir strings vacíos a null
      const sanitizeOptionalNumber = (value: string): string | null => {
        const cleaned = value.replace(/[^0-9]/g, '');
        return cleaned || null;
      };

      const sanitizeWeight = (value: string): string | null => {
        const cleaned = value.replace(',', '.').replace(/[^0-9.]/g, '');
        return cleaned || null;
      };

      // Helpers para convertir a número real para el RPC (evitar "invalid input syntax")
      const toIntOrNull = (value: string | null): number | null => {
        if (value == null || value === '') return null;
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
      };

      const toFloatOrNull = (value: string | null): number | null => {
        if (value == null || value === '') return null;
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? null : parsed;
      };

      const sanitizeIntegerWithDefault = (value: string, defaultValue = 0): number => {
        const cleaned = value.replace(/[^0-9]/g, '');
        if (!cleaned) return defaultValue;
        const parsed = parseInt(cleaned, 10);
        return Number.isNaN(parsed) ? defaultValue : parsed;
      };

      // 5. Subir documentos
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

        const { data: urlData } = supabase.storage
          .from('identity_documents')
          .getPublicUrl(fileName);
        documentUrl = urlData.publicUrl;
      }

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

      // 6. Preparar payload sanitizado
      const fighterProfileData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        nickname: formData.nickname || null,
        country: appUserData.country,
        birthdate: appUserData.birthdate || null,
        birthplace: formData.birthplace || null,
        document_type: formData.document_type || null,
        document_image_url: documentUrl || null,
        
        // Físico - enviar null si vacío
        height_cm: toIntOrNull(sanitizeOptionalNumber(formData.height_cm)),
        weight_kg: toFloatOrNull(sanitizeWeight(formData.weight_kg)),
        reach_cm: toIntOrNull(sanitizeOptionalNumber(formData.reach_cm)),
        blood_type: formData.blood_type || null,
        
        // Combate
        weight_class: formData.weight_class,
        discipline: formData.discipline || null,
        fighting_style: formData.fighting_style || null,
        stance: formData.stance || null,
        level: formData.level || null,
        gym_name: formData.gym_name || null,
        martial_arts: formData.martial_arts.length > 0 ? formData.martial_arts : null,
        
        // Récord (siempre números)
        record_wins: sanitizeIntegerWithDefault(formData.record_wins, 0),
        record_losses: sanitizeIntegerWithDefault(formData.record_losses, 0),
        record_draws: sanitizeIntegerWithDefault(formData.record_draws, 0),
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
        avatar_url: avatarUrl || null,
      };

      const licenseData = {
        license_level: formData.level === 'Professional' ? 'PROFESSIONAL' : 'AMATEUR',
        discipline: formData.discipline || null,
      };

      // Construir arreglo de documentos para evitar ambigüedad en el RPC
      const documentUrls = documentUrl
        ? [{ type: 'ID_DOCUMENT', url: documentUrl }]
        : [];

      // 7. Debug logging
      console.log('[DEBUG] Payload completo a enviar:', {
        ...fighterProfileData,
        types: {
          height_cm: typeof fighterProfileData.height_cm,
          weight_kg: typeof fighterProfileData.weight_kg,
          reach_cm: typeof fighterProfileData.reach_cm,
          record_wins: typeof fighterProfileData.record_wins,
          record_losses: typeof fighterProfileData.record_losses,
          record_draws: typeof fighterProfileData.record_draws,
        }
      });

      // 8. Llamar RPC (pasando siempre p_document_urls para evitar overload)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('request_fighter_license', {
        p_fighter_profile_data: fighterProfileData,
        p_license_data: licenseData,
        p_document_urls: documentUrls,
      });

      if (rpcError) {
        console.error('[ERROR] Error en RPC:', rpcError);
        
        // Mensajes de error mejorados según tipo
        if (rpcError.message.includes('invalid input syntax for type integer')) {
          toast.error('Error: Revisa los campos numéricos (récord, altura, alcance). Usa solo números enteros (ej: 5, 2, 0).');
          setCurrentTab('combat');
        } else if (rpcError.message.includes('invalid input syntax for type numeric')) {
          toast.error('Error: Revisa el peso. Usa decimales con punto (ej: 70.5).');
          setCurrentTab('physical');
        } else {
          toast.error(`Error: ${rpcError.message}`);
        }
        
        setLoading(false);
        return;
      }

      // 9. Manejar respuesta del RPC
      console.log('[DEBUG] Respuesta RPC:', rpcResult);

      // Type cast para la respuesta
      const resultData = rpcResult as { success?: boolean; message?: string } | null;

      if (resultData && resultData.success === false) {
        toast.error(resultData.message || 'Error al procesar la solicitud');
        setLoading(false);
        return;
      }

      if (resultData && resultData.success === true) {
        toast.success(resultData.message || '¡Solicitud enviada exitosamente!');
        navigate('/license/pending');
        return;
      }

      // Fallback
      toast.success('¡Solicitud enviada exitosamente! Te contactaremos pronto.');
      navigate('/license/pending');
      
    } catch (error: any) {
      console.error('[LICENSE REQUEST] Error completo:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      
      toast.error(error.message || 'Error inesperado. Verifica tu conexión e intenta nuevamente');
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
    <div className="min-h-screen bg-black py-4 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 relative overflow-hidden">
      {/* Fondo espacial con nebulosas - optimizado para móvil */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      <div className="absolute inset-0 bg-[url('/lovable-uploads/octagon-background.png')] opacity-[0.02] bg-cover bg-center" />
      
      {/* Nebulosas animadas - reducidas en móvil para mejor rendimiento */}
      <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-600/15 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-1/4 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-blue-600/10 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }} />
      <div className="absolute bottom-0 left-1/4 w-[280px] sm:w-[450px] h-[280px] sm:h-[450px] bg-indigo-600/12 rounded-full blur-[90px] sm:blur-[110px] animate-pulse" style={{ animationDelay: '4s', animationDuration: '12s' }} />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 sm:mb-6 text-white/70 hover:text-white hover:bg-purple-900/30 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Button>

        <Card className="bg-slate-950/95 border-purple-500/30 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] relative z-10 animate-fade-in">
          <CardHeader className="text-center pb-4 sm:pb-6 md:pb-8 relative px-4 sm:px-6">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent rounded-t-lg" />
            <div className="flex justify-center mb-3 sm:mb-4 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400/20 blur-xl rounded-full animate-pulse" />
                <Shield className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-purple-400 relative drop-shadow-[0_0_20px_rgba(192,132,252,0.5)]" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 relative leading-tight">
              Fighter ID
              <span className="block text-lg sm:text-xl md:text-2xl mt-1 text-purple-300">Licencia Universal de Peleador</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg text-white/90 relative px-2">
              Completa tu información para obtener tu licencia oficial
            </CardDescription>
          </CardHeader>

          <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-5 mb-4 bg-slate-900/50 p-0.5 sm:p-1 border border-purple-500/20 gap-0.5 sm:gap-1">
                <TabsTrigger 
                  value="personal" 
                  className="text-[10px] sm:text-xs md:text-sm text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-purple-500/50 transition-all duration-300 px-1 sm:px-2 py-2 flex-col sm:flex-row gap-0.5 sm:gap-1"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Personal</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="physical" 
                  className="text-[10px] sm:text-xs md:text-sm text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-purple-500/50 transition-all duration-300 px-1 sm:px-2 py-2 flex-col sm:flex-row gap-0.5 sm:gap-1"
                >
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Físico</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="combat" 
                  className="text-[10px] sm:text-xs md:text-sm text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-purple-500/50 transition-all duration-300 px-1 sm:px-2 py-2 flex-col sm:flex-row gap-0.5 sm:gap-1"
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Combate</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="medical" 
                  className="text-[10px] sm:text-xs md:text-sm text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-purple-500/50 transition-all duration-300 px-1 sm:px-2 py-2 flex-col sm:flex-row gap-0.5 sm:gap-1"
                >
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Médico</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="additional" 
                  className="text-[10px] sm:text-xs md:text-sm text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-purple-500/50 transition-all duration-300 px-1 sm:px-2 py-2 flex-col sm:flex-row gap-0.5 sm:gap-1"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Adicional</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Personal */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* NUEVOS CAMPOS: Nombre y Apellido */}
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-white font-medium">
                      Nombre <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Ej: Juan"
                      required
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-white font-medium">
                      Apellido <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Ej: Pérez"
                      required
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="nickname" className="text-white font-medium">Apodo / Nickname</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="Ej: El Tigre"
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="birthplace" className="text-white font-medium">Lugar de Nacimiento</Label>
                    <Input
                      id="birthplace"
                      value={formData.birthplace}
                      onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                      placeholder="Ej: Tegucigalpa, Honduras"
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="document_type" className="text-white font-medium">Tipo de Documento</Label>
                    <Select value={formData.document_type} onValueChange={(v) => setFormData({ ...formData, document_type: v })}>
                      <SelectTrigger className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
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
                    <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-6 bg-slate-900/30 hover:border-purple-500/50 hover:bg-slate-900/50 transition-all duration-300">
                      <div className="flex flex-col items-center gap-3">
                        <label 
                          htmlFor="document_image" 
                          className="cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 inline-flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
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
                          Foto clara de tu {formData.document_type}. Máximo 50MB
                        </p>
                      </div>
                    </div>
                    {documentPreview && (
                      <div className="mt-3 p-2 bg-slate-900/50 rounded-lg border border-purple-500/30">
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
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300"
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
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.height_cm}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, height_cm: value });
                      }}
                      placeholder="175"
                      required
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weight_kg" className="text-white font-medium">Peso (kg) *</Label>
                    <Input
                      id="weight_kg"
                      type="text"
                      inputMode="decimal"
                      value={formData.weight_kg}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Normalizar coma a punto
                        value = value.replace(/,/g, '.');
                        // Permitir solo números y punto
                        value = value.replace(/[^0-9.]/g, '');
                        // Permitir solo un punto decimal
                        const parts = value.split('.');
                        if (parts.length > 2) {
                          value = parts[0] + '.' + parts.slice(1).join('');
                        }
                        setFormData({ ...formData, weight_kg: value });
                      }}
                      placeholder="70.5 o 70,5"
                      required
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reach_cm" className="text-white font-medium">Alcance (cm)</Label>
                    <Input
                      id="reach_cm"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.reach_cm}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, reach_cm: value });
                      }}
                      placeholder="180"
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="blood_type" className="text-white font-medium">Tipo de Sangre</Label>
                    <Select value={formData.blood_type} onValueChange={(v) => setFormData({ ...formData, blood_type: v })}>
                      <SelectTrigger className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
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
                <div className="flex justify-between mt-4 pt-4 border-t border-purple-500/20">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab('personal')}
                    className="bg-slate-900/70 border-purple-500/50 hover:bg-purple-900/50 text-white hover:border-purple-400 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  >
                    Anterior
                  </Button>
                  <Button 
                    onClick={() => setCurrentTab('combat')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300"
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
                      <SelectTrigger className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
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
                      <SelectTrigger className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MMA">MMA</SelectItem>
                        <SelectItem value="Boxeo">Boxeo</SelectItem>
                        <SelectItem value="Judo">Judo</SelectItem>
                        <SelectItem value="JiuJitsu">Jiu-Jitsu</SelectItem>
                        <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                        <SelectItem value="MuayThai">Muay Thai</SelectItem>
                        <SelectItem value="Grappling">Grappling</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
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
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="stance" className="text-white font-medium">Guardia</Label>
                    <Select value={formData.stance} onValueChange={(v) => setFormData({ ...formData, stance: v })}>
                      <SelectTrigger className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
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
                      <SelectTrigger className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
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
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                    <div className="md:col-span-2 space-y-2">
                    <Label className="text-white font-medium">Récord de Peleas</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Victorias */}
                      <div className="space-y-2">
                        <Label className="text-xs text-white/70">Victorias</Label>
                        <div className="flex items-center gap-2 bg-slate-900/50 border border-purple-500/30 rounded-md p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = parseInt(formData.record_wins) || 0;
                              if (current > 0) {
                                setFormData({ ...formData, record_wins: String(current - 1) });
                              }
                            }}
                            className="h-8 w-8 p-0 text-white hover:bg-purple-600/30 hover:text-white"
                          >
                            -
                          </Button>
                          <div className="flex-1 text-center text-white font-semibold text-lg">
                            {formData.record_wins}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = parseInt(formData.record_wins) || 0;
                              setFormData({ ...formData, record_wins: String(current + 1) });
                            }}
                            className="h-8 w-8 p-0 text-white hover:bg-purple-600/30 hover:text-white"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Derrotas */}
                      <div className="space-y-2">
                        <Label className="text-xs text-white/70">Derrotas</Label>
                        <div className="flex items-center gap-2 bg-slate-900/50 border border-purple-500/30 rounded-md p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = parseInt(formData.record_losses) || 0;
                              if (current > 0) {
                                setFormData({ ...formData, record_losses: String(current - 1) });
                              }
                            }}
                            className="h-8 w-8 p-0 text-white hover:bg-purple-600/30 hover:text-white"
                          >
                            -
                          </Button>
                          <div className="flex-1 text-center text-white font-semibold text-lg">
                            {formData.record_losses}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = parseInt(formData.record_losses) || 0;
                              setFormData({ ...formData, record_losses: String(current + 1) });
                            }}
                            className="h-8 w-8 p-0 text-white hover:bg-purple-600/30 hover:text-white"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Empates */}
                      <div className="space-y-2">
                        <Label className="text-xs text-white/70">Empates</Label>
                        <div className="flex items-center gap-2 bg-slate-900/50 border border-purple-500/30 rounded-md p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = parseInt(formData.record_draws) || 0;
                              if (current > 0) {
                                setFormData({ ...formData, record_draws: String(current - 1) });
                              }
                            }}
                            className="h-8 w-8 p-0 text-white hover:bg-purple-600/30 hover:text-white"
                          >
                            -
                          </Button>
                          <div className="flex-1 text-center text-white font-semibold text-lg">
                            {formData.record_draws}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const current = parseInt(formData.record_draws) || 0;
                              setFormData({ ...formData, record_draws: String(current + 1) });
                            }}
                            className="h-8 w-8 p-0 text-white hover:bg-purple-600/30 hover:text-white"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 text-center">
                      Usa los botones + y - para ajustar tu récord
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="record_type" className="text-white font-medium">Tipo de Récord *</Label>
                    <Select value={formData.record_type} onValueChange={(v) => setFormData({ ...formData, record_type: v })}>
                      <SelectTrigger className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Amateur">Amateur</SelectItem>
                        <SelectItem value="Profesional">Profesional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-purple-500/20">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab('physical')}
                    className="bg-slate-900/70 border-purple-500/50 hover:bg-purple-900/50 text-white hover:border-purple-400 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  >
                    Anterior
                  </Button>
                  <Button 
                    onClick={() => setCurrentTab('medical')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300"
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
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
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
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
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
                        className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="insurance_policy" className="text-white font-medium">Número de Póliza</Label>
                      <Input
                        id="insurance_policy"
                        value={formData.insurance_policy}
                        onChange={(e) => setFormData({ ...formData, insurance_policy: e.target.value })}
                        placeholder="Número de póliza"
                        className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
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
                          className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
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
                          className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="emergency_contact_relation" className="text-white font-medium">Relación</Label>
                        <Input
                          id="emergency_contact_relation"
                          value={formData.emergency_contact_relation}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                          placeholder="Ej: Madre, Esposo/a"
                          className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-purple-500/20">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab('combat')}
                    className="bg-slate-900/70 border-purple-500/50 hover:bg-purple-900/50 text-white hover:border-purple-400 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  >
                    Anterior
                  </Button>
                  <Button 
                    onClick={() => setCurrentTab('additional')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300"
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
                      className="bg-slate-900/50 border-purple-500/30 focus:border-purple-500 text-white placeholder:text-white/40 transition-all duration-300 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-purple-500/20">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab('medical')}
                    className="bg-slate-900/70 border-purple-500/50 hover:bg-purple-900/50 text-white hover:border-purple-400 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  >
                    Anterior
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 px-8 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all duration-300 hover:scale-105"
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
