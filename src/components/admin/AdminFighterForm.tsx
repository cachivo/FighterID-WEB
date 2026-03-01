import { useState, useEffect } from 'react';
import { Loader2, CalendarIcon, Trophy, Info, ImageIcon, Wand2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGymsList } from '@/hooks/useGymsList';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FileUpload } from '@/components/ui/file-upload';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useFighterProfiles, FighterProfile, AdminFighterFormData } from '@/hooks/useFighterProfiles';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ENABLED_DISCIPLINES, MARTIAL_ARTS_TRAINING, WEIGHT_CLASSES, FIGHTER_LEVELS, STANCES, COUNTRIES } from '@/lib/constants/disciplines';
import { useRankingOrganizations } from '@/hooks/useRankingOrganizations';
import { useFighterRankingMembership } from '@/hooks/useFighterRankingMembership';
 
 const GENDERS = [
   { value: 'M', label: 'Masculino' },
   { value: 'F', label: 'Femenino' },
 ];
 
 interface AdminFighterFormProps {
   mode: 'create' | 'edit';
   existingFighter?: FighterProfile;
   onSuccess?: () => void;
   onCancel?: () => void;
 }
 
 export function AdminFighterForm({ mode, existingFighter, onSuccess, onCancel }: AdminFighterFormProps) {
    const { adminCreateFighterProfile, adminUpdateFighterProfile } = useFighterProfiles();
  const { data: organizations } = useRankingOrganizations();
  const { enrollFighter } = useFighterRankingMembership();
  const { data: gymsList = [] } = useGymsList();
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  
  // Initial league enrollment (only for create mode)
  const [initialOrg, setInitialOrg] = useState('');
  const [initialLevel, setInitialLevel] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeBackground, setRemoveBackground] = useState(false);
  // Gym selector state
  const [selectedGymMode, setSelectedGymMode] = useState<string>('__none__'); // gym id, '__none__' (independiente), '__other__' (texto libre)

  const [formData, setFormData] = useState<Partial<AdminFighterFormData>>({
     first_name: '',
     last_name: '',
     nickname: '',
     country: 'Honduras',
     weight_class: 'Peso Ligero',
    discipline: undefined,
     martial_arts: [],
     record_wins: 0,
     record_losses: 0,
     record_draws: 0,
     mma_record_wins: 0,
     mma_record_losses: 0,
     mma_record_draws: 0,
     boxeo_record_wins: 0,
     boxeo_record_losses: 0,
     boxeo_record_draws: 0,
     record_type: 'Amateur',
     level: 'Amateur',
     gender: '',
     height_cm: 0,
     weight_kg: 0,
     reach_cm: 0,
     bio: '',
     fighting_style: '',
     gym_name: '',
     gym_id: undefined,
     birthdate: '',
     birthplace: '',
     stance: '',
     avatar_url: '',
     blood_type: '',
     document_type: '',
     document_number: '',
     emergency_contact_name: '',
     emergency_contact_relation: '',
     emergency_contact_phone: '',
     medical_allergies: '',
     medical_conditions: '',
     insurance_company: '',
     insurance_policy: '',
   });
 
    useEffect(() => {
      if (existingFighter && mode === 'edit') {
        const fighterBirthdate = existingFighter.birthdate ? new Date(existingFighter.birthdate) : undefined;
        setBirthDate(fighterBirthdate);
        
        // Determine gym selector mode
        if (existingFighter.gym_id) {
          setSelectedGymMode(existingFighter.gym_id);
        } else if (existingFighter.gym_name) {
          setSelectedGymMode('__other__');
        } else {
          setSelectedGymMode('__none__');
        }
        
        setFormData({
          first_name: existingFighter.first_name,
          last_name: existingFighter.last_name,
          nickname: existingFighter.nickname || '',
          country: existingFighter.country || 'Honduras',
          weight_class: existingFighter.weight_class,
          avatar_url: existingFighter.avatar_url || '',
          discipline: existingFighter.discipline || undefined,
          martial_arts: existingFighter.martial_arts || [],
          record_wins: existingFighter.record_wins,
          record_losses: existingFighter.record_losses,
          record_draws: existingFighter.record_draws,
          mma_record_wins: (existingFighter as any).mma_record_wins || 0,
          mma_record_losses: (existingFighter as any).mma_record_losses || 0,
          mma_record_draws: (existingFighter as any).mma_record_draws || 0,
          boxeo_record_wins: (existingFighter as any).boxeo_record_wins || 0,
          boxeo_record_losses: (existingFighter as any).boxeo_record_losses || 0,
          boxeo_record_draws: (existingFighter as any).boxeo_record_draws || 0,
          record_type: existingFighter.record_type || 'Amateur',
          level: existingFighter.level || 'Amateur',
          gender: existingFighter.gender || '',
          height_cm: existingFighter.height_cm || 0,
          weight_kg: Number(existingFighter.weight_kg) || 0,
          reach_cm: existingFighter.reach_cm || 0,
          bio: existingFighter.bio || '',
          fighting_style: existingFighter.fighting_style || '',
          gym_name: existingFighter.gym_name || '',
          gym_id: existingFighter.gym_id || undefined,
          birthdate: existingFighter.birthdate || '',
          birthplace: existingFighter.birthplace || '',
          stance: existingFighter.stance || '',
          blood_type: (existingFighter as any).blood_type || '',
          document_type: (existingFighter as any).document_type || '',
          document_number: (existingFighter as any).document_number || '',
          emergency_contact_name: (existingFighter as any).emergency_contact_name || '',
          emergency_contact_relation: (existingFighter as any).emergency_contact_relation || '',
          emergency_contact_phone: (existingFighter as any).emergency_contact_phone || '',
          medical_allergies: (existingFighter as any).medical_allergies || '',
          medical_conditions: (existingFighter as any).medical_conditions || '',
          insurance_company: (existingFighter as any).insurance_company || '',
          insurance_policy: (existingFighter as any).insurance_policy || '',
        });
      }
    }, [existingFighter, mode]);
 
  // Get selected organization data
  const selectedOrgData = organizations?.find(o => o.code === initialOrg);

  // Auto-select first allowed level when organization changes
  useEffect(() => {
    if (selectedOrgData && selectedOrgData.allowed_levels.length > 0) {
      setInitialLevel(selectedOrgData.allowed_levels[0]);
    }
  }, [selectedOrgData]);

   const handleChange = (field: keyof AdminFighterFormData, value: any) => {
     setFormData(prev => ({
       ...prev,
       [field]: value
     }));
   };
 
  // Handle competition discipline change (single select)
  const handleDisciplineChange = (discipline: string) => {
    setFormData(prev => ({
      ...prev,
      discipline: discipline as any
    }));
  };

  // Handle training arts change (multiple checkboxes)
  const handleTrainingArtsChange = (art: string, checked: boolean) => {
    const currentArts = formData.martial_arts || [];
    if (checked) {
      setFormData(prev => ({
        ...prev,
        martial_arts: [...currentArts, art]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        martial_arts: currentArts.filter(a => a !== art)
      }));
    }
  };
 
   const handleDateSelect = (date: Date | undefined) => {
     setBirthDate(date);
     if (date) {
       handleChange('birthdate', date.toISOString().split('T')[0]);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.weight_class) {
       toast({
         title: "Error de validación",
         description: "Nombre, apellido y categoría de peso son obligatorios",
         variant: "destructive",
       });
       return;
     }
 
      if (!formData.discipline) {
       toast({
         title: "Error de validación",
          description: "Selecciona una disciplina de competencia",
         variant: "destructive",
       });
       return;
     }
 
    // Validate initial league selection for create mode
    if (mode === 'create' && (!initialOrg || !initialLevel)) {
      toast({
        title: "Error de validación",
        description: "Selecciona una liga inicial para el peleador",
        variant: "destructive",
      });
      return;
    }

     setIsSubmitting(true);
     
     try {
       if (mode === 'create') {
        const newFighterId = await adminCreateFighterProfile(formData);
        
        // Upload avatar if selected
        if (newFighterId && avatarFile) {
          try {
            const { uploadFighterAvatar } = await import('@/lib/photoUtils');
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (currentUser) {
              await uploadFighterAvatar(
                avatarFile,
                currentUser.id,
                newFighterId,
                undefined, // No existing avatar
                removeBackground // Pass the background removal option
              );
            }
          } catch (avatarError) {
            console.error('Avatar upload error:', avatarError);
            toast({
              title: "Advertencia",
              description: "Perfil creado pero hubo un error al subir la foto. Puedes agregarla después.",
              variant: "destructive",
            });
          }
        }
        
        // Enroll in initial league
        if (newFighterId && initialOrg && initialLevel) {
          await enrollFighter({
            fighterId: newFighterId,
            organizationCode: initialOrg,
            level: initialLevel,
            weightClass: formData.weight_class || 'Peso Ligero',
          });
        }
        
         toast({
           title: "¡Perfil creado!",
          description: avatarFile 
            ? "Perfil creado con foto e inscrito en el ranking correctamente."
            : "Perfil creado e inscrito en el ranking correctamente.",
         });
       } else if (mode === 'edit' && existingFighter) {
         const success = await adminUpdateFighterProfile(existingFighter.id, formData as AdminFighterFormData);
         if (success) {
           toast({
             title: "¡Perfil actualizado!",
             description: "El perfil del peleador ha sido actualizado correctamente.",
           });
         }
       }
       
       // Cleanup preview URL
       if (avatarPreview) {
         URL.revokeObjectURL(avatarPreview);
       }
       
       onSuccess?.();
     } catch (error) {
       console.error('Error en handleSubmit:', error);
       const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
       toast({
         title: "Error",
         description: errorMessage,
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <form onSubmit={handleSubmit} className="space-y-6">
       <Tabs defaultValue="personal" className="w-full">
         <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="personal">Personal</TabsTrigger>
           <TabsTrigger value="physical">Físico</TabsTrigger>
           <TabsTrigger value="combat">Combate</TabsTrigger>
         </TabsList>
 
         {/* Personal Information Tab */}
         <TabsContent value="personal" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Información Personal</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="first_name">Nombre *</Label>
                   <Input
                     id="first_name"
                     value={formData.first_name}
                     onChange={(e) => handleChange('first_name', e.target.value)}
                     required
                   />
                 </div>
                 <div>
                   <Label htmlFor="last_name">Apellido *</Label>
                   <Input
                     id="last_name"
                     value={formData.last_name}
                     onChange={(e) => handleChange('last_name', e.target.value)}
                     required
                   />
                 </div>
               </div>
 
               <div>
                 <Label htmlFor="nickname">Apodo</Label>
                 <Input
                   id="nickname"
                   value={formData.nickname}
                   onChange={(e) => handleChange('nickname', e.target.value)}
                   placeholder="Ej: El Destructor"
                 />
               </div>
 
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="gender">Género</Label>
                   <Select value={formData.gender || undefined} onValueChange={(value) => handleChange('gender', value)}>
                     <SelectTrigger>
                       <SelectValue placeholder="Seleccionar género" />
                     </SelectTrigger>
                     <SelectContent>
                       {GENDERS.map(gender => (
                         <SelectItem key={gender.value} value={gender.value}>
                           {gender.label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label htmlFor="country">País</Label>
                   <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
                     <SelectTrigger>
                       <SelectValue placeholder="Seleccionar país" />
                     </SelectTrigger>
                     <SelectContent>
                       {COUNTRIES.map(c => (
                         <SelectItem key={c.value} value={c.value}>
                           {c.label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
 
               <div>
                 <Label>Fecha de Nacimiento</Label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant="outline"
                       className={cn(
                         "w-full justify-start text-left font-normal",
                         !birthDate && "text-muted-foreground"
                       )}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {birthDate ? format(birthDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={birthDate}
                       onSelect={handleDateSelect}
                       disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
               </div>
 
                <div>
                  <Label htmlFor="birthplace">Lugar de Nacimiento</Label>
                  <Input
                    id="birthplace"
                    value={formData.birthplace || ''}
                    onChange={(e) => handleChange('birthplace', e.target.value)}
                    placeholder="Ciudad, País"
                  />
                </div>
               </CardContent>
             </Card>

            {/* Medical & Emergency Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Médica y de Emergencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="blood_type">Tipo de Sangre</Label>
                    <Select value={formData.blood_type || undefined} onValueChange={(value) => handleChange('blood_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                          <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="document_type">Tipo de Documento</Label>
                    <Select value={formData.document_type || undefined} onValueChange={(value) => handleChange('document_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        <SelectItem value="Licencia">Licencia de Conducir</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="document_number">Número de Documento</Label>
                    <Input
                      id="document_number"
                      value={formData.document_number || ''}
                      onChange={(e) => handleChange('document_number', e.target.value)}
                      placeholder="0801-1990-12345"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergency_contact_name">Contacto de Emergencia</Label>
                    <Input
                      id="emergency_contact_name"
                      value={formData.emergency_contact_name || ''}
                      onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_relation">Relación</Label>
                    <Input
                      id="emergency_contact_relation"
                      value={formData.emergency_contact_relation || ''}
                      onChange={(e) => handleChange('emergency_contact_relation', e.target.value)}
                      placeholder="Ej: Madre, Esposa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_phone">Teléfono Emergencia</Label>
                    <Input
                      id="emergency_contact_phone"
                      value={formData.emergency_contact_phone || ''}
                      onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                      placeholder="+504 9999-9999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="medical_allergies">Alergias</Label>
                    <Textarea
                      id="medical_allergies"
                      value={formData.medical_allergies || ''}
                      onChange={(e) => handleChange('medical_allergies', e.target.value)}
                      placeholder="Alergias conocidas..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medical_conditions">Condiciones Médicas</Label>
                    <Textarea
                      id="medical_conditions"
                      value={formData.medical_conditions || ''}
                      onChange={(e) => handleChange('medical_conditions', e.target.value)}
                      placeholder="Condiciones médicas relevantes..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insurance_company">Compañía de Seguro</Label>
                    <Input
                      id="insurance_company"
                      value={formData.insurance_company || ''}
                      onChange={(e) => handleChange('insurance_company', e.target.value)}
                      placeholder="Nombre de la aseguradora"
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance_policy">Número de Póliza</Label>
                    <Input
                      id="insurance_policy"
                      value={formData.insurance_policy || ''}
                      onChange={(e) => handleChange('insurance_policy', e.target.value)}
                      placeholder="Número de póliza"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photo Upload Card - Create mode only */}
            {mode === 'create' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Foto de Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUpload
                    accept="image/*"
                    onFileSelect={(file) => {
                      setAvatarFile(file);
                      const previewUrl = URL.createObjectURL(file);
                      setAvatarPreview(previewUrl);
                    }}
                    onRemoveFile={() => {
                      setAvatarFile(null);
                      if (avatarPreview) {
                        URL.revokeObjectURL(avatarPreview);
                        setAvatarPreview(null);
                      }
                    }}
                    preview={avatarPreview || undefined}
                    maxSize={5}
                    className="mt-2"
                  />
                  
                  {/* Toggle for AI background removal */}
                  <div className="flex items-center space-x-2 mt-3 p-3 rounded-lg bg-muted/50 border">
                    <Switch
                      id="remove-bg-create"
                      checked={removeBackground}
                      onCheckedChange={setRemoveBackground}
                    />
                    <Label htmlFor="remove-bg-create" className="flex items-center gap-2 cursor-pointer">
                      <Wand2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">Remover fondo automáticamente (IA)</span>
                    </Label>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Sube una foto del peleador. Activa la opción de IA para fotos sin fondo.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
 
         {/* Physical Tab */}
         <TabsContent value="physical" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Información Física</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-3 gap-4">
                 <div>
                   <Label htmlFor="height_cm">Altura (cm)</Label>
                   <Input
                     id="height_cm"
                     type="number"
                     value={formData.height_cm || ''}
                     onChange={(e) => {
                       const height = parseInt(e.target.value) || 0;
                       handleChange('height_cm', height);
                       if (height > 0 && (!formData.reach_cm || formData.reach_cm === formData.height_cm)) {
                         handleChange('reach_cm', height);
                       }
                     }}
                     placeholder="180"
                   />
                 </div>
                 <div>
                   <Label htmlFor="weight_kg">Peso (kg)</Label>
                   <Input
                     id="weight_kg"
                     type="number"
                     step="0.1"
                     value={formData.weight_kg || ''}
                     onChange={(e) => handleChange('weight_kg', parseFloat(e.target.value) || 0)}
                     placeholder="70.5"
                   />
                 </div>
                 <div>
                   <Label htmlFor="reach_cm">Alcance (cm)</Label>
                   <Input
                     id="reach_cm"
                     type="number"
                     value={formData.reach_cm || ''}
                     onChange={(e) => handleChange('reach_cm', parseInt(e.target.value) || 0)}
                     placeholder="185"
                   />
                   <p className="text-xs text-muted-foreground mt-1">
                     Estimado según altura. Ajústalo si conoces tu medida.
                   </p>
                 </div>
               </div>
 
               <div>
                 <Label htmlFor="stance">Guardia</Label>
                 <Select value={formData.stance || undefined} onValueChange={(value) => handleChange('stance', value)}>
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccionar guardia" />
                   </SelectTrigger>
                   <SelectContent>
                     {STANCES.map(stance => (
                       <SelectItem key={stance.value} value={stance.value}>
                         {stance.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Combat Tab */}
         <TabsContent value="combat" className="space-y-6">
          {/* Initial League Enrollment - Only for Create mode */}
          {mode === 'create' && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Inscripción a Liga Inicial *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Este peleador comenzará a competir en la liga seleccionada con 0 puntos.
                    Un administrador puede agregar ligas adicionales después.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Liga/Organización *</Label>
                    <Select value={initialOrg} onValueChange={setInitialOrg}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar liga" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations
                          ?.filter(org => !formData.discipline || org.discipline === formData.discipline)
                          .map((org) => (
                          <SelectItem key={org.code} value={org.code}>
                            {org.short_name} ({org.discipline})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedOrgData && (
                    <div>
                      <Label>Nivel *</Label>
                      <Select value={initialLevel} onValueChange={setInitialLevel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedOrgData.allowed_levels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {initialOrg && initialLevel && (
                  <p className="text-sm font-medium text-primary">
                    ✓ Se inscribirá en {selectedOrgData?.name} - {initialLevel}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

           <Card>
             <CardHeader>
               <CardTitle>Información de Combate</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                 <Label htmlFor="weight_class">Categoría de Peso *</Label>
                 <Select value={formData.weight_class} onValueChange={(value) => handleChange('weight_class', value)}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {WEIGHT_CLASSES.map(wc => (
                       <SelectItem key={wc.value} value={wc.value}>{wc.label}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 <p className="text-xs text-muted-foreground mt-1">
                   Selecciona según tu peso de competencia
                 </p>
               </div>
 
               <div>
                  <Label>Disciplina de Competencia *</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Define en qué ranking aparecerá el peleador
                  </p>
                  <Select value={formData.discipline || undefined} onValueChange={handleDisciplineChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENABLED_DISCIPLINES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
 
               <div>
                 <Label htmlFor="level">Nivel</Label>
                 <Select value={formData.level} onValueChange={(value) => handleChange('level', value)}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {FIGHTER_LEVELS.map(level => (
                       <SelectItem key={level.value} value={level.value}>
                         {level.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
 
               <div>
                 <Label htmlFor="fighting_style">Estilo de Pelea</Label>
                 <Input
                   id="fighting_style"
                   value={formData.fighting_style || ''}
                   onChange={(e) => handleChange('fighting_style', e.target.value)}
                   placeholder="Ej: Striker, Grappler"
                 />
               </div>
 
               <div>
                 <Label htmlFor="gym_select" className="flex items-center gap-1.5">
                   <Building2 className="h-4 w-4" />
                   Gimnasio/Academia
                 </Label>
                 <Select
                   value={selectedGymMode}
                   onValueChange={(value) => {
                     setSelectedGymMode(value);
                     if (value === '__none__') {
                       handleChange('gym_id', undefined);
                       handleChange('gym_name', '');
                     } else if (value === '__other__') {
                       handleChange('gym_id', undefined);
                     } else {
                       const gym = gymsList.find(g => g.id === value);
                       if (gym) {
                         handleChange('gym_id', gym.id);
                         handleChange('gym_name', gym.nombre);
                       }
                     }
                   }}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccionar gimnasio" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="__none__">Independiente</SelectItem>
                     {gymsList.map(g => (
                       <SelectItem key={g.id} value={g.id}>
                         {g.nombre}
                       </SelectItem>
                     ))}
                     <SelectItem value="__other__">Otro (escribir nombre)</SelectItem>
                   </SelectContent>
                 </Select>
                 {selectedGymMode === '__other__' && (
                   <Input
                     className="mt-2"
                     value={formData.gym_name || ''}
                     onChange={(e) => handleChange('gym_name', e.target.value)}
                     placeholder="Escribir nombre del gimnasio"
                   />
                 )}
               </div>
 
               <div className="grid grid-cols-4 gap-4">
                 <div className="col-span-1">
                   <Label htmlFor="record_wins">Victorias</Label>
                   <Input
                     id="record_wins"
                     type="number"
                     min="0"
                     value={formData.record_wins}
                     onChange={(e) => handleChange('record_wins', parseInt(e.target.value) || 0)}
                     disabled
                     className="bg-muted/50"
                   />
                   <p className="text-xs text-muted-foreground mt-1">Legacy (no editar)</p>
                 </div>
                 <div className="col-span-1">
                   <Label htmlFor="record_losses">Derrotas</Label>
                   <Input
                     id="record_losses"
                     type="number"
                     min="0"
                     value={formData.record_losses}
                     onChange={(e) => handleChange('record_losses', parseInt(e.target.value) || 0)}
                     disabled
                     className="bg-muted/50"
                   />
                 </div>
                 <div className="col-span-1">
                   <Label htmlFor="record_draws">Empates</Label>
                   <Input
                     id="record_draws"
                     type="number"
                     min="0"
                     value={formData.record_draws}
                     onChange={(e) => handleChange('record_draws', parseInt(e.target.value) || 0)}
                     disabled
                     className="bg-muted/50"
                   />
                 </div>
                 <div className="col-span-1">
                   <Label htmlFor="record_type">Tipo</Label>
                   <Select value={formData.record_type} onValueChange={(value) => handleChange('record_type', value)}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Amateur">Amateur</SelectItem>
                       <SelectItem value="Profesional">Profesional</SelectItem>
                       <SelectItem value="Mixto">Mixto</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
 
               {/* Récords por Disciplina */}
               <div className="space-y-4 pt-4 border-t">
                 <h4 className="font-semibold text-sm text-muted-foreground">Récords por Disciplina</h4>
                 
                  {formData.discipline === 'MMA' && (
                   <div className="p-4 border rounded-lg bg-muted/30">
                     <h4 className="font-semibold mb-3">Récord MMA</h4>
                     <div className="grid grid-cols-3 gap-4">
                       <div>
                         <Label htmlFor="mma_record_wins">Victorias</Label>
                         <Input
                           id="mma_record_wins"
                           type="number"
                           min="0"
                           value={formData.mma_record_wins || 0}
                           onChange={(e) => handleChange('mma_record_wins', parseInt(e.target.value) || 0)}
                         />
                       </div>
                       <div>
                         <Label htmlFor="mma_record_losses">Derrotas</Label>
                         <Input
                           id="mma_record_losses"
                           type="number"
                           min="0"
                           value={formData.mma_record_losses || 0}
                           onChange={(e) => handleChange('mma_record_losses', parseInt(e.target.value) || 0)}
                         />
                       </div>
                       <div>
                         <Label htmlFor="mma_record_draws">Empates</Label>
                         <Input
                           id="mma_record_draws"
                           type="number"
                           min="0"
                           value={formData.mma_record_draws || 0}
                           onChange={(e) => handleChange('mma_record_draws', parseInt(e.target.value) || 0)}
                         />
                       </div>
                     </div>
                     <p className="text-sm text-muted-foreground mt-2">
                       Record: {formData.mma_record_wins || 0}-{formData.mma_record_losses || 0}-{formData.mma_record_draws || 0}
                     </p>
                   </div>
                 )}
 
                  {formData.discipline === 'Boxeo' && (
                   <div className="p-4 border rounded-lg bg-muted/30">
                     <h4 className="font-semibold mb-3">Récord Boxeo</h4>
                     <div className="grid grid-cols-3 gap-4">
                       <div>
                         <Label htmlFor="boxeo_record_wins">Victorias</Label>
                         <Input
                           id="boxeo_record_wins"
                           type="number"
                           min="0"
                           value={formData.boxeo_record_wins || 0}
                           onChange={(e) => handleChange('boxeo_record_wins', parseInt(e.target.value) || 0)}
                         />
                       </div>
                       <div>
                         <Label htmlFor="boxeo_record_losses">Derrotas</Label>
                         <Input
                           id="boxeo_record_losses"
                           type="number"
                           min="0"
                           value={formData.boxeo_record_losses || 0}
                           onChange={(e) => handleChange('boxeo_record_losses', parseInt(e.target.value) || 0)}
                         />
                       </div>
                       <div>
                         <Label htmlFor="boxeo_record_draws">Empates</Label>
                         <Input
                           id="boxeo_record_draws"
                           type="number"
                           min="0"
                           value={formData.boxeo_record_draws || 0}
                           onChange={(e) => handleChange('boxeo_record_draws', parseInt(e.target.value) || 0)}
                         />
                       </div>
                     </div>
                     <p className="text-sm text-muted-foreground mt-2">
                       Record: {formData.boxeo_record_wins || 0}-{formData.boxeo_record_losses || 0}-{formData.boxeo_record_draws || 0}
                     </p>
                   </div>
                 )}
 
                  {!formData.discipline && (
                   <div className="text-center p-6 text-muted-foreground border rounded-lg border-dashed">
                      Selecciona una disciplina de competencia para editar récords
                   </div>
                 )}
               </div>
 
             </CardContent>
           </Card>

            {/* Training Arts Card */}
            <Card>
              <CardHeader>
                <CardTitle>Artes Marciales de Entrenamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Artes que practica para su preparación (informativo)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MARTIAL_ARTS_TRAINING.map((art) => (
                    <div
                      key={art.value}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        formData.martial_arts?.includes(art.value)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/30'
                      }`}
                      onClick={() => handleTrainingArtsChange(art.value, !formData.martial_arts?.includes(art.value))}
                    >
                      <Checkbox
                        id={`training-${art.value}`}
                        checked={formData.martial_arts?.includes(art.value) || false}
                        onCheckedChange={(checked) => handleTrainingArtsChange(art.value, checked as boolean)}
                      />
                      <Label htmlFor={`training-${art.value}`} className="text-sm cursor-pointer">
                        {art.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.martial_arts && formData.martial_arts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.martial_arts.map((art) => (
                      <Badge key={art} variant="secondary">
                        {MARTIAL_ARTS_TRAINING.find(a => a.value === art)?.label || art}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bio Card */}
            <Card>
              <CardHeader>
                <CardTitle>Biografía</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Describe la trayectoria del peleador..."
                  rows={4}
                />
              </CardContent>
            </Card>
         </TabsContent>
       </Tabs>
 
       <div className="flex justify-end gap-4">
         {onCancel && (
           <Button
             type="button"
             variant="outline"
             onClick={onCancel}
             disabled={isSubmitting}
              className="min-h-[44px] touch-manipulation"
           >
             Cancelar
           </Button>
         )}
          <Button type="submit" disabled={isSubmitting} className="min-h-[44px] touch-manipulation">
           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           {mode === 'create' ? 'Crear Perfil' : 'Actualizar Perfil'}
         </Button>
       </div>
     </form>
   );
 }