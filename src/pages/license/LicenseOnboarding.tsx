import { useState, useEffect } from 'react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
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

export default function LicenseOnboarding() {
  const { user, refreshLicense } = useLicenseAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    proDraws: '',
    boxrecUrl: '',
    tapologyUrl: ''
  });

  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [fighterPhoto, setFighterPhoto] = useState<File | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [fighterPhotoPreview, setFighterPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const weightClasses = [
    'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight',
    'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
  ];

  const martialArts = [
    'MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'
  ];

  const handleMartialArtsChange = (art: string, checked: boolean) => {
    if (checked) {
      setFormData({...formData, martialArts: [...formData.martialArts, art]});
    } else {
      setFormData({...formData, martialArts: formData.martialArts.filter(a => a !== art)});
    }
  };

  // Check if user already has a profile
  useEffect(() => {
    let cancelled = false;
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        console.log('Safety timeout triggered, stopping check');
        setCheckingExisting(false);
      }
    }, 8000);

    const checkExistingProfile = async () => {
      if (!user) {
        console.log('No user available, redirecting to auth...');
        setCheckingExisting(false);
        navigate('/license/auth', { replace: true });
        return;
      }

      try {
        console.log('Checking for existing profile...');
        
        // Check for app_user
        const { data: appUser } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (appUser) {
          console.log('App user found, checking for fighter profile...');
          
          // Check for fighter profile
          const { data: profile } = await supabase
            .from('fighter_profiles')
            .select('id')
            .eq('user_id', appUser.id)
            .eq('active', true)
            .maybeSingle();

          if (profile) {
            console.log('Fighter profile found, redirecting to pending...');
            navigate('/license/pending', { replace: true });
            return;
          }
        }

        console.log('No existing profile found, can proceed with onboarding');
      } catch (error) {
        console.error('Error checking existing profile:', error);
      } finally {
        if (!cancelled) {
          setCheckingExisting(false);
        }
      }
    };

    checkExistingProfile();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
    };
  }, [user, navigate]);

  // Helper function to add timeout to promises
  const withTimeout = (promise: Promise<any>, timeoutMs: number): Promise<any> => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out after ' + timeoutMs + 'ms')), timeoutMs)
      )
    ]);
  };

  // Background upload function
  const uploadDocumentsInBackground = async (license: any, profileId: string) => {
    try {
      // Upload identity document
      if (identityDocument) {
        console.log('Background: Uploading identity document...');
        const identityFileName = user.id + '/identity-' + Date.now() + '.' + identityDocument.type.split('/')[1];
        
        await withTimeout(
          (async () => {
            const result = await supabase.storage
              .from('license-documents')
              .upload(identityFileName, identityDocument, {
                contentType: identityDocument.type,
                upsert: false
              });
            return result;
          })(),
          15000
        );

        // Create document record
        await supabase
          .from('license_documents')
          .insert({
            license_id: license.id,
            document_type: 'identity',
            file_path: identityFileName,
            file_name: identityDocument.name,
            file_size: identityDocument.size,
            mime_type: identityDocument.type,
            uploaded_by: user.id
          });

        console.log('Background: Identity document uploaded successfully');
      }

      // Upload fighter photo
      if (fighterPhoto) {
        console.log('Background: Uploading fighter photo...');
        const photoFileName = user.id + '/photo-' + Date.now() + '.' + fighterPhoto.type.split('/')[1];
        
        await withTimeout(
          (async () => {
            const result = await supabase.storage
              .from('fighter-photos')
              .upload(photoFileName, fighterPhoto, {
                contentType: fighterPhoto.type,
                upsert: false
              });
            return result;
          })(),
          15000
        );

        // Get public URL and update profile
        const { data: publicUrl } = supabase.storage
          .from('fighter-photos')
          .getPublicUrl(photoFileName);

        await supabase
          .from('fighter_profiles')
          .update({ avatar_url: publicUrl.publicUrl })
          .eq('id', profileId);

        console.log('Background: Fighter photo uploaded successfully');
      }
    } catch (error) {
      console.error('Background upload error (non-blocking):', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      // Quick check if user already has a profile
      const { data: existingAppUser } = await withTimeout(
        (async () => {
          const result = await supabase
            .from('app_user')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          return result;
        })(),
        5000
      );

      if (existingAppUser) {
        const { data: existingProfile } = await withTimeout(
          (async () => {
            const result = await supabase
              .from('fighter_profiles')
              .select('id')
              .eq('user_id', existingAppUser.id)
              .eq('active', true)
              .maybeSingle();
            return result;
          })(),
          5000
        );

        if (existingProfile) {
          toast.success('Ya tienes un perfil creado. Redirigiendo...');
          navigate('/license/pending', { replace: true });
          return;
        }
      }

      // Create or get app_user
      let userId = existingAppUser?.id;
      
      if (!userId) {
        console.log('Creating new app_user...');
        const { data: newAppUser, error: appUserError } = await withTimeout(
          (async () => {
            const result = await supabase
              .from('app_user')
              .insert({
                auth_user_id: user.id,
                email: user.email,
                phone: formData.phone,
                birthdate: formData.birthdate || null,
                handle: (formData.firstName + '_' + formData.lastName + '_' + Date.now()).toLowerCase().replace(/\s+/g, '_')
              })
              .select('id')
              .single();
            return result;
          })(),
          10000
        );

        if (appUserError) {
          console.error('Error creating app_user:', appUserError);
          throw appUserError;
        }
        userId = newAppUser.id;
      } else {
        // Update existing app_user (non-blocking)
        supabase
          .from('app_user')
          .update({
            phone: formData.phone,
            birthdate: formData.birthdate || null
          })
          .eq('id', userId)
          .then(({ error }) => {
            if (error) console.error('Error updating app_user (non-blocking):', error);
          });
      }

      // Create fighter profile
      console.log('Creating fighter profile...');
      const profileData = {
        user_id: userId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        nickname: formData.nickname || null,
        country: formData.country,
        weight_class: formData.weightClass,
        height_cm: parseInt(formData.heightCm),
        weight_kg: parseFloat(formData.weightKg),
        reach_cm: formData.reachCm ? parseInt(formData.reachCm) : null,
        discipline: formData.martialArts.length > 0 ? formData.martialArts[0] as 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro' : null,
        martial_arts: formData.martialArts,
        gym_name: formData.gymName || null,
        fighting_style: formData.fightingStyle || null,
        stance: formData.stance || null,
        level: formData.level || null,
        record_wins: formData.level === 'Profesional' 
          ? (formData.proWins ? parseInt(formData.proWins) : 0)
          : (formData.amateurWins ? parseInt(formData.amateurWins) : 0),
        record_losses: formData.level === 'Profesional'
          ? (formData.proLosses ? parseInt(formData.proLosses) : 0) 
          : (formData.amateurLosses ? parseInt(formData.amateurLosses) : 0),
        record_draws: formData.level === 'Profesional'
          ? (formData.proDraws ? parseInt(formData.proDraws) : 0)
          : (formData.amateurDraws ? parseInt(formData.amateurDraws) : 0),
        record_type: formData.level === 'Profesional' ? 'Profesional' : 'Amateur',
        gender: formData.gender || null,
        boxrec_url: formData.boxrecUrl || null,
        tapology_url: formData.tapologyUrl || null,
        bio: formData.bio || null
      };
      
      const { data: profile, error: profileError } = await withTimeout(
        (async () => {
          const result = await supabase
            .from('fighter_profiles')
            .insert(profileData)
            .select('id')
            .single();
          return result;
        })(),
        10000
      );

      if (profileError) {
        console.error('Error creating fighter profile:', profileError);
        throw profileError;
      }

      // Generate license number and create license
      console.log('Generating license and creating license record...');
      const { data: licenseNumber, error: licenseGenError } = await withTimeout(
        (async () => {
          const result = await supabase.rpc('generate_license_number');
          return result;
        })(),
        10000
      );

      if (licenseGenError) {
        console.error('Error generating license number:', licenseGenError);
        throw licenseGenError;
      }

      const licenseData = {
        fighter_id: profile.id,
        discipline: formData.martialArts.length > 0 ? formData.martialArts[0] as 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro' : null,
        license_level: 'AMATEUR' as const,
        status: 'PENDING_REVIEW' as const,
        is_primary: true,
        license_number: licenseNumber
      };
      
      const { data: license, error: licenseError } = await withTimeout(
        (async () => {
          const result = await supabase
            .from('fighter_licenses')
            .insert(licenseData)
            .select('id')
            .single();
          return result;
        })(),
        10000
      );

      if (licenseError) {
        console.error('Error creating fighter license:', licenseError);
        throw licenseError;
      }

      console.log('Profile and license created successfully!');

      // Start background uploads (don't await)
      uploadDocumentsInBackground(license, profile.id);

      // Update auth context (with timeout, non-blocking)
      refreshLicense().catch(error => 
        console.error('Error refreshing license (non-blocking):', error)
      );

      toast.success('¡Perfil creado exitosamente! Tu Fighter ID está pendiente de revisión.');
      
      // Navigate immediately to prevent infinite loading
      navigate('/license/pending', { replace: true });
      
    } catch (error) {
      console.error('Error creating profile:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as any;
        
        if (supabaseError.code === '23505') {
          toast.success('Ya tienes un perfil de peleador. Redirigiendo...');
          navigate('/license/dashboard', { replace: true });
          return;
        } else if (supabaseError.code === '23514') {
          toast.error('Error en los datos del perfil. Verifica que el tipo de récord sea Amateur o Profesional.');
          return;
        } else if (supabaseError.code === '42501') {
          toast.error('Tu perfil se creó pero hubo un problema con la licencia. Contacta al administrador.');
          navigate('/license/dashboard', { replace: true });
          return;
        }
      }
      
      // Check if it's a timeout error
      if (error instanceof Error && error.message.includes('timed out')) {
        toast.error('La operación está tardando más de lo normal. Por favor, revisa tu conexión y reintenta.');
      } else {
        toast.error('Error al crear el perfil: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    } finally {
      setLoading(false);
      setUploading(false);
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
                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value as any})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu género" />
                      </SelectTrigger>
                      <SelectContent>
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
                  <Label>Artes Marciales / Estilos de Pelea *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecciona todas las artes marciales que practicas
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {martialArts.map((art) => (
                      <div key={art} className="flex items-center space-x-2">
                        <Checkbox
                          id={art}
                          checked={formData.martialArts.includes(art)}
                          onCheckedChange={(checked) => handleMartialArtsChange(art, checked as boolean)}
                        />
                        <Label htmlFor={art} className="text-sm font-normal cursor-pointer">
                          {art}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.martialArts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.martialArts.map((art) => (
                        <Badge key={art} variant="secondary" className="text-xs">
                          {art}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="level">Nivel *</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu nivel" />
                    </SelectTrigger>
                    <SelectContent>
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
                      onChange={(e) => setFormData({...formData, heightCm: e.target.value})}
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
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weightClass">Categoría de Peso *</Label>
                    <Select value={formData.weightClass} onValueChange={(value) => setFormData({...formData, weightClass: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {weightClasses.map((weightClass) => (
                          <SelectItem key={weightClass} value={weightClass}>
                            {weightClass}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stance">Stance</Label>
                    <Select value={formData.stance} onValueChange={(value) => setFormData({...formData, stance: value as any})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu stance" />
                      </SelectTrigger>
                      <SelectContent>
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
                  <Label htmlFor="identityDocument">Documento de Identidad * <span className="text-sm text-gray-500">(Cédula, pasaporte, etc.)</span></Label>
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
                  <h4 className="font-medium text-sm text-center">Récord de Peleas</h4>
                  
                  {/* Amateur Record Section */}
                  <div className="border rounded-lg p-4 bg-card">
                    <h5 className="font-medium text-sm mb-3 text-primary">Récord Amateur</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="amateurWins">Victorias</Label>
                        <Input
                          id="amateurWins"
                          type="number"
                          min="0"
                          value={formData.amateurWins}
                          onChange={(e) => setFormData({...formData, amateurWins: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="amateurLosses">Derrotas</Label>
                        <Input
                          id="amateurLosses"
                          type="number"
                          min="0"
                          value={formData.amateurLosses}
                          onChange={(e) => setFormData({...formData, amateurLosses: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="amateurDraws">Empates</Label>
                        <Input
                          id="amateurDraws"
                          type="number"
                          min="0"
                          value={formData.amateurDraws}
                          onChange={(e) => setFormData({...formData, amateurDraws: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Record Section */}
                  <div className="border rounded-lg p-4 bg-card">
                    <h5 className="font-medium text-sm mb-3 text-primary">Récord Profesional</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="proWins">Victorias</Label>
                        <Input
                          id="proWins"
                          type="number"
                          min="0"
                          value={formData.proWins}
                          onChange={(e) => setFormData({...formData, proWins: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="proLosses">Derrotas</Label>
                        <Input
                          id="proLosses"
                          type="number"
                          min="0"
                          value={formData.proLosses}
                          onChange={(e) => setFormData({...formData, proLosses: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="proDraws">Empates</Label>
                        <Input
                          id="proDraws"
                          type="number"
                          min="0"
                          value={formData.proDraws}
                          onChange={(e) => setFormData({...formData, proDraws: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Enlaces de Verificación (Opcional)</h4>
                  <div>
                    <Label htmlFor="boxrecUrl">Perfil BoxRec</Label>
                    <Input
                      id="boxrecUrl"
                      type="url"
                      value={formData.boxrecUrl}
                      onChange={(e) => setFormData({...formData, boxrecUrl: e.target.value})}
                      placeholder="https://boxrec.com/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enlace a tu perfil en BoxRec para verificar tu récord profesional
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="tapologyUrl">Perfil Tapology</Label>
                    <Input
                      id="tapologyUrl"
                      type="url"
                      value={formData.tapologyUrl}
                      onChange={(e) => setFormData({...formData, tapologyUrl: e.target.value})}
                      placeholder="https://www.tapology.com/fightcenter/fighters/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enlace a tu perfil en Tapology para verificar tu récord
                    </p>
                  </div>
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

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Atrás
                  </Button>
                  <Button type="submit" disabled={loading || !identityDocument}>
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