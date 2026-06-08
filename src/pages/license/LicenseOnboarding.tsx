import { useState, useEffect, useRef } from 'react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { useOptimizedOnboarding } from '@/hooks/useOptimizedOnboarding';
import { useDebounce } from '@/hooks/useDebounce';
import { useGymsList } from '@/hooks/useGymsList';
import { useUserModules } from '@/hooks/useUserModules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Award, Upload, FileText, CheckCircle, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FileUpload } from '@/components/ui/file-upload';
import { ENABLED_DISCIPLINES, WEIGHT_CLASSES } from '@/lib/constants/disciplines';

function GymSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: gyms, isLoading } = useGymsList();
  
  return (
    <div>
      <Label>Gimnasio/Academia</Label>
      <Select 
        value={value || '__none__'} 
        onValueChange={(v) => onChange(v === '__none__' || v === '__independiente__' ? (v === '__independiente__' ? 'Independiente' : '') : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona tu gimnasio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__" className="text-muted-foreground">-- Sin gimnasio --</SelectItem>
          <SelectItem value="__independiente__">Independiente</SelectItem>
          {isLoading ? (
            <SelectItem value="__loading__" disabled>Cargando...</SelectItem>
          ) : (
            gyms?.map((gym) => (
              <SelectItem key={gym.id} value={gym.nombre}>
                {gym.nombre}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        Selecciona el gimnasio donde entrenas
      </p>
    </div>
  );
}

export default function LicenseOnboarding() {
  const { user } = useLicenseAuth();
  const { user: authUser } = useAuth();
  const { appUser } = useUserModules();
  const { createProfile, loading } = useOptimizedOnboarding();
  const navigate = useNavigate();
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
     country: 'Honduras',
    weightClass: '',
    heightCm: '',
    weightKg: '',
    reachCm: '',
    martialArts: [] as string[],
    gymName: '',
    fightingStyle: '',
    stance: '' as 'Ortodoxo' | 'Zurdo' | 'Switch' | '',
    level: '' as 'Amateur' | 'Semi-profesional' | 'Profesional' | '',
    bio: '',
    phone: '',
    birthdate: '',
    gender: '' as 'M' | 'F' | 'Otro' | '',
    // Amateur record
    amateurWins: '',
    amateurLosses: '',
    amateurDraws: '',
    // Professional record  
    proWins: '',
    proLosses: '',
    proDraws: ''
  });

  const [draftLoaded, setDraftLoaded] = useState(false);

  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [fighterPhoto, setFighterPhoto] = useState<File | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [fighterPhotoPreview, setFighterPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const identityObjectUrlRef = useRef<string | null>(null);
  const fighterPhotoObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (identityObjectUrlRef.current) URL.revokeObjectURL(identityObjectUrlRef.current);
      if (fighterPhotoObjectUrlRef.current) URL.revokeObjectURL(fighterPhotoObjectUrlRef.current);
    };
  }, []);



  const handleMartialArtsChange = (art: string, checked: boolean) => {
    if (checked) {
      setFormData({...formData, martialArts: [...formData.martialArts, art]});
    } else {
      setFormData({...formData, martialArts: formData.martialArts.filter(a => a !== art)});
    }
  };

  // Load draft from localStorage on mount (only once)
  useEffect(() => {
    if (draftLoaded) return;
    
    const draft = localStorage.getItem('license_onboarding_draft');
    if (draft) {
      try {
        const savedData = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...savedData }));
        console.info('[LicenseOnboarding] Loaded draft from localStorage');
      } catch (e) {
        console.error('[LicenseOnboarding] Failed to parse draft:', e);
      }
    }
    setDraftLoaded(true);
  }, [draftLoaded]);

  // Prefill identity from existing app_user (set by another module like gym/judge).
  // Only fills empty fields — never overwrites whatever the user typed or what
  // was restored from the local draft.
  useEffect(() => {
    if (!draftLoaded || !appUser) return;
    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || appUser.first_name || '',
      lastName: prev.lastName || appUser.last_name || '',
      phone: prev.phone || appUser.phone || '',
      birthdate: prev.birthdate || (appUser as any).birthdate || '',
    }));
  }, [draftLoaded, appUser]);

  // Debounce draft saves to avoid blocking UI on low-end devices
  const debouncedFormData = useDebounce(formData, 500);
  
  useEffect(() => {
    if (!draftLoaded) return;
    if (debouncedFormData.firstName || debouncedFormData.lastName || debouncedFormData.phone) {
      localStorage.setItem('license_onboarding_draft', JSON.stringify(debouncedFormData));
    }
  }, [debouncedFormData, draftLoaded]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formData.firstName || formData.lastName) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData]);

  // Simplified check for existing profile
  useEffect(() => {
    let cancelled = false;

    const quickProfileCheck = async () => {
      if (!user) {
        setCheckingExisting(false);
        navigate('/license/auth?mode=signin', { replace: true });
        return;
      }

      try {
        // FIX H1: PostgREST does NOT support dot-notation on joined aliases in .eq().
        // Resolve app_user.id first, then filter fighter_profiles directly.
        const { data: appUser } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (appUser) {
          const { data: existingProfile } = await supabase
            .from('fighter_profiles')
            .select('id')
            .eq('user_id', appUser.id)
            .eq('active', true)
            .maybeSingle();

          if (existingProfile && !cancelled) {
            navigate('/license/pending', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking existing profile:', error);
        // Allow onboarding to continue even with errors
      } finally {
        if (!cancelled) {
          setCheckingExisting(false);
        }
      }
    };

    quickProfileCheck();

    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  // Optimized form submission using the new transactional function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const files = {
      identityDocument: identityDocument || undefined,
      fighterPhoto: fighterPhoto || undefined
    };

    const result = await createProfile(formData, files);
    
    if (result.success) {
      // Clear the draft after successful submission
      localStorage.removeItem('license_onboarding_draft');
    } else {
      console.error('Profile creation failed:', result.error);
    }
  };

  if (!user) {
    return <div>No autorizado</div>;
  }

  if (authUser && !authUser.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle>Verificación Requerida</CardTitle>
            <CardDescription>
              Debes verificar tu correo electrónico antes de solicitar una licencia de peleador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Revisa tu bandeja de entrada y haz clic en el enlace de verificación.
            </p>
            <Button onClick={() => navigate('/profile')} variant="outline" className="w-full">
              Volver a Mi Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }



  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-foreground" />
              <p className="text-muted-foreground">Verificando perfil existente...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    let filledFields = 0;
    const totalFields = 10; // firstName, lastName, gender, phone, birthdate, discipline, level, height, weight, weightClass
    
    if (formData.firstName) filledFields++;
    if (formData.lastName) filledFields++;
    if (formData.gender) filledFields++;
    if (formData.phone) filledFields++;
    if (formData.birthdate) filledFields++;
    if (formData.martialArts.length > 0) filledFields++;
    if (formData.level) filledFields++;
    if (formData.heightCm) filledFields++;
    if (formData.weightKg) filledFields++;
    if (formData.weightClass) filledFields++;
    
    // Add step 2 fields if on step 2
    if (step === 2) {
      const totalStep2 = 2; // identity doc + submission
      if (identityDocument) filledFields++;
      return Math.round(((filledFields + 1) / (totalFields + totalStep2)) * 100);
    }
    
    return Math.round((filledFields / totalFields) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Paso {step} de 2</span>
              <span className="text-xs font-medium text-primary">{progress}% completado</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex justify-between mt-3 sm:mt-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {step > 1 ? <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> : '1'}
                </div>
                <span className={`text-xs sm:text-sm ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <span className="hidden xs:inline">Datos personales</span>
                  <span className="xs:hidden">Datos</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
                <span className={`text-xs sm:text-sm ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <span className="hidden xs:inline">Documentos</span>
                  <span className="xs:hidden">Docs</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center mb-4">
            {step === 1 ? (
              <User className="h-12 w-12 text-foreground" />
            ) : (
              <Award className="h-12 w-12 text-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">Configurar Tu Perfil de Peleador</CardTitle>
          <CardDescription>
            {step === 1 
              ? 'Completa tus datos personales y deportivos'
              : 'Sube tu documentación para verificar tu identidad'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="nickname">Apodo (Opcional)</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                      placeholder="Ej: El Tigre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Género *</Label>
                    <Select 
                      value={formData.gender || '__none__'} 
                      onValueChange={(value) => {
                        setFormData({...formData, gender: value === '__none__' ? '' : value as 'M' | 'F' | 'Otro'});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+504 9999-9999"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthdate">Fecha de Nacimiento *</Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={formData.birthdate}
                      onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>¿En qué disciplina(s) deseas competir? *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecciona las disciplinas para las cuales deseas obtener tu Fighter ID
                  </p>
                  <div className="space-y-3">
                    {ENABLED_DISCIPLINES.map((discipline) => (
                      <Card 
                        key={discipline.value} 
                        className={`cursor-pointer transition-all ${
                          formData.martialArts.includes(discipline.value) 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-muted-foreground/30'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMartialArtsChange(discipline.value, !formData.martialArts.includes(discipline.value));
                        }}
                      >
                        <CardContent className="flex items-start gap-3 p-4">
                          <Checkbox
                            id={discipline.value}
                            checked={formData.martialArts.includes(discipline.value)}
                            onCheckedChange={(checked) => handleMartialArtsChange(discipline.value, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <Label htmlFor={discipline.value} className="text-base font-medium cursor-pointer">
                              {discipline.label}
                            </Label>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {formData.martialArts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.martialArts.map((art) => (
                        <Badge key={art} variant="secondary" className="text-xs">
                          {ENABLED_DISCIPLINES.find(d => d.value === art)?.label || art}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="level">Nivel *</Label>
                  <Select 
                    value={formData.level || '__none__'} 
                    onValueChange={(value) => {
                      // Clear record fields when level changes
                      setFormData({
                        ...formData, 
                        level: value === '__none__' ? '' : value as 'Amateur' | 'Semi-profesional' | 'Profesional',
                        amateurWins: '',
                        amateurLosses: '',
                        amateurDraws: '',
                        proWins: '',
                        proLosses: '',
                        proDraws: ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
                      <SelectItem value="Amateur">Amateur</SelectItem>
                      <SelectItem value="Semi-profesional">Semi-profesional</SelectItem>
                      <SelectItem value="Profesional">Profesional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <GymSelector 
                  value={formData.gymName}
                  onChange={(value) => setFormData({...formData, gymName: value})}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="heightCm">Altura (cm) *</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => {
                        const height = e.target.value;
                        setFormData(prev => ({
                          ...prev, 
                          heightCm: height,
                          // Auto-calculate reach if not manually set
                          reachCm: (!prev.reachCm || prev.reachCm === prev.heightCm) ? height : prev.reachCm
                        }));
                      }}
                      placeholder="170"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="weightKg">Peso (kg) *</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      step="0.1"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({...formData, weightKg: e.target.value})}
                      placeholder="70.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reachCm">Alcance (cm)</Label>
                    <Input
                      id="reachCm"
                      type="number"
                      value={formData.reachCm}
                      onChange={(e) => setFormData({...formData, reachCm: e.target.value})}
                      placeholder="175"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimado según altura. Ajústalo si conoces tu medida.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weightClass">Categoría de Peso *</Label>
                    <Select 
                      value={formData.weightClass || '__none__'} 
                      onValueChange={(value) => setFormData({...formData, weightClass: value === '__none__' ? '' : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
                        {WEIGHT_CLASSES.map((wc) => (
                          <SelectItem key={wc.value} value={wc.value}>
                            {wc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecciona según tu peso de competencia
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="stance">Guardia</Label>
                    <Select 
                      value={formData.stance || '__none__'} 
                      onValueChange={(value) => setFormData({...formData, stance: value === '__none__' ? '' : value as 'Ortodoxo' | 'Zurdo' | 'Switch'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu stance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
                        <SelectItem value="Ortodoxo">Ortodoxo</SelectItem>
                        <SelectItem value="Zurdo">Zurdo</SelectItem>
                        <SelectItem value="Switch">Switch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setStep(2)}
                    className="min-h-[44px] px-6 touch-manipulation"
                    disabled={!formData.firstName || !formData.lastName || !formData.heightCm || !formData.weightKg || !formData.weightClass || !formData.phone || !formData.martialArts.length || !formData.gender || !formData.birthdate || !formData.level}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="identityDocument">
                    Documento de Identidad (Imagen) * 
                    <span className="text-sm text-muted-foreground ml-2">(Cédula, pasaporte, etc.)</span>
                  </Label>
                  <FileUpload
                    onFileSelect={(file) => {
                      setIdentityDocument(file);
                      if (identityObjectUrlRef.current) URL.revokeObjectURL(identityObjectUrlRef.current);
                      const previewUrl = URL.createObjectURL(file);
                      identityObjectUrlRef.current = previewUrl;
                      setIdentityPreview(previewUrl);
                    }}
                    onRemoveFile={() => {
                      setIdentityDocument(null);
                      if (identityObjectUrlRef.current) {
                        URL.revokeObjectURL(identityObjectUrlRef.current);
                        identityObjectUrlRef.current = null;
                      }
                      setIdentityPreview(null);
                    }}
                    accept="image/*"
                    preview={identityPreview || undefined}
                    loading={uploading}
                    required
                    className="mb-4"
                  />
                </div>

                <div>
                  <Label htmlFor="fighterPhoto">Foto del Peleador <span className="text-sm text-muted-foreground">(Opcional - para tu perfil)</span></Label>
                  <FileUpload
                    onFileSelect={(file) => {
                      setFighterPhoto(file);
                      if (fighterPhotoObjectUrlRef.current) URL.revokeObjectURL(fighterPhotoObjectUrlRef.current);
                      const previewUrl = URL.createObjectURL(file);
                      fighterPhotoObjectUrlRef.current = previewUrl;
                      setFighterPhotoPreview(previewUrl);
                    }}
                    onRemoveFile={() => {
                      setFighterPhoto(null);
                      if (fighterPhotoObjectUrlRef.current) {
                        URL.revokeObjectURL(fighterPhotoObjectUrlRef.current);
                        fighterPhotoObjectUrlRef.current = null;
                      }
                      setFighterPhotoPreview(null);
                    }}
                    accept="image/*"
                    preview={fighterPhotoPreview || undefined}
                    loading={uploading}
                    className="mb-4"
                  />
                </div>


                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="font-medium text-sm">Récord de Peleas</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ingresa tu récord correspondiente al nivel seleccionado: {formData.level || 'No seleccionado'}
                    </p>
                  </div>
                  
                  {/* Show record fields based on selected level */}
                  {formData.level && (
                    <div className="border rounded-lg p-4 bg-card">
                      <h5 className="font-medium text-sm mb-3 text-primary">
                        Récord {formData.level === 'Profesional' ? 'Profesional' : 'Amateur/Semi-profesional'}
                      </h5>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="recordWins">Victorias</Label>
                          <Input
                            id="recordWins"
                            type="number"
                            min="0"
                            value={formData.level === 'Profesional' ? formData.proWins : formData.amateurWins}
                            onChange={(e) => {
                              if (formData.level === 'Profesional') {
                                setFormData({...formData, proWins: e.target.value, amateurWins: ''});
                              } else {
                                setFormData({...formData, amateurWins: e.target.value, proWins: ''});
                              }
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="recordLosses">Derrotas</Label>
                          <Input
                            id="recordLosses"
                            type="number"
                            min="0"
                            value={formData.level === 'Profesional' ? formData.proLosses : formData.amateurLosses}
                            onChange={(e) => {
                              if (formData.level === 'Profesional') {
                                setFormData({...formData, proLosses: e.target.value, amateurLosses: ''});
                              } else {
                                setFormData({...formData, amateurLosses: e.target.value, proLosses: ''});
                              }
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="recordDraws">Empates</Label>
                          <Input
                            id="recordDraws"
                            type="number"
                            min="0"
                            value={formData.level === 'Profesional' ? formData.proDraws : formData.amateurDraws}
                            onChange={(e) => {
                              if (formData.level === 'Profesional') {
                                setFormData({...formData, proDraws: e.target.value, amateurDraws: ''});
                              } else {
                                setFormData({...formData, amateurDraws: e.target.value, proDraws: ''});
                              }
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!formData.level && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Selecciona tu nivel en el paso anterior para ingresar tu récord
                    </div>
                  )}
                </div>


                <div>
                  <Label htmlFor="fightingStyle">Estilo de Pelea</Label>
                  <Input
                    id="fightingStyle"
                    value={formData.fightingStyle}
                    onChange={(e) => setFormData({...formData, fightingStyle: e.target.value})}
                    placeholder="Ej: Muay Thai, BJJ, Boxing"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Biografía (Opcional)</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Cuéntanos sobre tu experiencia en artes marciales..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-between gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="min-h-[44px] px-5 touch-manipulation"
                  >
                    Atrás
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !identityDocument || !formData.level}
                    className="min-h-[44px] px-5 touch-manipulation"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando Perfil...
                      </>
                    ) : (
                      'Crear Perfil y Solicitar Licencia'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}