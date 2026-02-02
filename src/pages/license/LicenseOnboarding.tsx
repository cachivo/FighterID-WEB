import { useState, useEffect } from 'react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { useOptimizedOnboarding } from '@/hooks/useOptimizedOnboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Award, Upload, FileText } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { ENABLED_DISCIPLINES, WEIGHT_CLASSES } from '@/lib/constants/disciplines';

export default function LicenseOnboarding() {
  const { user } = useLicenseAuth();
  const { createProfile, loading } = useOptimizedOnboarding();
  const navigate = useNavigate();
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    country: 'HN',
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

  // Save draft to localStorage whenever formData changes (skip initial draft load)
  useEffect(() => {
    if (!draftLoaded) return;
    if (formData.firstName || formData.lastName || formData.phone) {
      localStorage.setItem('license_onboarding_draft', JSON.stringify(formData));
    }
  }, [formData, draftLoaded]);

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
        // Quick check using optimized query
        const { data: existingProfile } = await supabase
          .from('fighter_profiles')
          .select(`
            id,
            user:user_id!inner(auth_user_id)
          `)
          .eq('user.auth_user_id', user.id)
          .eq('active', true)
          .maybeSingle();

        if (existingProfile && !cancelled) {
          navigate('/license/pending', { replace: true });
          return;
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
      console.log('Profile created successfully!');
    } else {
      console.error('Profile creation failed:', result.error);
    }
  };

  if (!user) {
    return <div>No autorizado</div>;
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-800" />
              <p className="text-muted-foreground">Verificando perfil existente...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {step === 1 ? (
              <User className="h-12 w-12 text-gray-800" />
            ) : (
              <Award className="h-12 w-12 text-gray-800" />
            )}
          </div>
          <CardTitle className="text-2xl">Configurar Tu Perfil de Peleador</CardTitle>
          <CardDescription>
            Necesitamos algunos datos para crear tu perfil y solicitar tu primera licencia
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <p className="text-sm text-muted-foreground mt-1">
                              {discipline.description}
                            </p>
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

                <div>
                  <Label htmlFor="gymName">Gimnasio/Academia</Label>
                  <Input
                    id="gymName"
                    value={formData.gymName}
                    onChange={(e) => setFormData({...formData, gymName: e.target.value})}
                    placeholder="Ej: Team Alpha, Gimnasio Central"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Opcional - Nombre de tu gimnasio o academia de entrenamiento
                  </p>
                </div>

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
                    <Label htmlFor="stance">Stance</Label>
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
                      const previewUrl = URL.createObjectURL(file);
                      setIdentityPreview(previewUrl);
                    }}
                    onRemoveFile={() => {
                      setIdentityDocument(null);
                      if (identityPreview) {
                        URL.revokeObjectURL(identityPreview);
                        setIdentityPreview(null);
                      }
                    }}
                    accept="image/*"
                    preview={identityPreview || undefined}
                    loading={uploading}
                    required
                    className="mb-4"
                  />
                </div>

                <div>
                  <Label htmlFor="fighterPhoto">Foto del Peleador <span className="text-sm text-gray-500">(Opcional - para tu perfil)</span></Label>
                  <FileUpload
                    onFileSelect={(file) => {
                      setFighterPhoto(file);
                      const previewUrl = URL.createObjectURL(file);
                      setFighterPhotoPreview(previewUrl);
                    }}
                    onRemoveFile={() => {
                      setFighterPhoto(null);
                      if (fighterPhotoPreview) {
                        URL.revokeObjectURL(fighterPhotoPreview);
                        setFighterPhotoPreview(null);
                      }
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