import { useState, useEffect } from 'react';
import { Loader2, CalendarIcon, Wand2, Building2 } from 'lucide-react';
import { useGymsList } from '@/hooks/useGymsList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useFighterProfiles, FighterProfile, AdminFighterFormData } from '@/hooks/useFighterProfiles';
import { useFighterActiveLeagues } from '@/hooks/useFighterActiveLeagues';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { ENABLED_DISCIPLINES, MARTIAL_ARTS_TRAINING, WEIGHT_CLASSES, FIGHTER_LEVELS, STANCES } from '@/lib/constants/disciplines';

const GENDERS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'Other', label: 'Otro' }
];

const BLOOD_TYPES = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
];

const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI' },
  { value: 'Passport', label: 'Pasaporte' },
  { value: 'License', label: 'Licencia' },
  { value: 'Other', label: 'Otro' }
];

interface FighterEditModalProps {
  fighter: FighterProfile;
  open: boolean;
  onClose: () => void;
}

export function FighterEditModal({ fighter, open, onClose }: FighterEditModalProps) {
  const { adminUpdateFighterProfile } = useFighterProfiles();
  const { data: activeLeagues = [] } = useFighterActiveLeagues(fighter?.id || null);
  const { data: gymsList = [] } = useGymsList();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [selectedGymMode, setSelectedGymMode] = useState<string>('__none__');
  const [formData, setFormData] = useState<AdminFighterFormData>({
    first_name: '',
    last_name: '',
    nickname: '',
     country: 'Honduras',
    weight_class: 'Peso Ligero',
    avatar_url: '',
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
    blood_type: '',
    medical_allergies: '',
    medical_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    insurance_company: '',
    insurance_policy: '',
    document_type: '',
    document_number: '',
    stance: '',
    boxrec_url: '',
    tapology_url: '',
    record_type: 'Amateur',
  });

  useEffect(() => {
    if (fighter) {
      const fighterBirthdate = fighter.birthdate ? new Date(fighter.birthdate) : undefined;
      setBirthDate(fighterBirthdate);
      
      // Determine gym selector mode
      if (fighter.gym_id) {
        setSelectedGymMode(fighter.gym_id);
      } else if (fighter.gym_name) {
        setSelectedGymMode('__other__');
      } else {
        setSelectedGymMode('__none__');
      }
      
      setFormData({
        first_name: fighter.first_name,
        last_name: fighter.last_name,
        nickname: fighter.nickname || '',
        country: fighter.country || 'Honduras',
        weight_class: fighter.weight_class,
        avatar_url: fighter.avatar_url || '',
        discipline: fighter.discipline || undefined,
        martial_arts: fighter.martial_arts || (fighter.discipline ? [fighter.discipline] : []),
        record_wins: fighter.record_wins,
        record_losses: fighter.record_losses,
        record_draws: fighter.record_draws,
        mma_record_wins: (fighter as any).mma_record_wins || 0,
        mma_record_losses: (fighter as any).mma_record_losses || 0,
        mma_record_draws: (fighter as any).mma_record_draws || 0,
        boxeo_record_wins: (fighter as any).boxeo_record_wins || 0,
        boxeo_record_losses: (fighter as any).boxeo_record_losses || 0,
        boxeo_record_draws: (fighter as any).boxeo_record_draws || 0,
        level: fighter.level || 'Amateur',
        gender: fighter.gender || '',
        height_cm: fighter.height_cm || 0,
        weight_kg: Number(fighter.weight_kg) || 0,
        reach_cm: fighter.reach_cm || 0,
        bio: fighter.bio || '',
        fighting_style: fighter.fighting_style || '',
        gym_name: fighter.gym_name || '',
        gym_id: fighter.gym_id || undefined,
        birthdate: fighter.birthdate || '',
        birthplace: fighter.birthplace || '',
        blood_type: fighter.blood_type || '',
        medical_allergies: fighter.medical_allergies || '',
        medical_conditions: fighter.medical_conditions || '',
        emergency_contact_name: fighter.emergency_contact_name || '',
        emergency_contact_phone: fighter.emergency_contact_phone || '',
        emergency_contact_relation: fighter.emergency_contact_relation || '',
        insurance_company: fighter.insurance_company || '',
        insurance_policy: fighter.insurance_policy || '',
        stance: fighter.stance || '',
        boxrec_url: fighter.boxrec_url || '',
        tapology_url: fighter.tapology_url || '',
        record_type: fighter.record_type || 'Amateur',
      });
    }
  }, [fighter]);

  const handleChange = (field: keyof AdminFighterFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDisciplineChange = (discipline: string) => {
    // Map placeholder back to null/undefined
    const actualValue = discipline === '__none__' ? undefined : discipline;
    setFormData(prev => ({
      ...prev,
      discipline: actualValue as any
    }));
  };

  const handleTrainingArtsChange = (art: string, checked: boolean) => {
    const currentArts = formData.martial_arts || [];
    if (checked) {
      setFormData(prev => ({
        ...prev,
        martial_arts: [...currentArts, art]
      }));
    } else {
      const newArts = currentArts.filter(a => a !== art);
      setFormData(prev => ({
        ...prev,
        martial_arts: newArts
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
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre y apellido son obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (!fighter.id) {
      toast({
        title: "Error de validación",
        description: "ID del peleador no válido",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let finalFormData = { ...formData };
      
      if ((formData as any)._avatarFile) {
        // Admin can upload avatar regardless of fighter.user_id
        // photoUtils now handles admin vs user folder paths via storage policies
        try {
          const { uploadFighterAvatar } = await import('@/lib/photoUtils');
          // Get current user's auth id for the upload function
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (!currentUser) {
            throw new Error('No authenticated user');
          }
          
          const avatarUrl = await uploadFighterAvatar(
            (formData as any)._avatarFile, 
            currentUser.id, // Pass current user's ID - photoUtils will determine folder based on admin status
            fighter.id,
            fighter.avatar_url,
            removeBackground // Pass the background removal option
          );
          
          if (avatarUrl) {
            finalFormData.avatar_url = avatarUrl;
          }
        } catch (avatarError) {
          console.error('Avatar upload error:', avatarError);
          toast({
            title: "Error de imagen",
            description: "Error al subir la imagen. Se actualizarán los demás datos.",
            variant: "destructive",
          });
        }
        
        delete (finalFormData as any)._avatarFile;
      }

      // Prepare sanitized data
      const sanitizedData = {
        ...finalFormData,
        discipline: finalFormData.discipline === undefined ? null : finalFormData.discipline,
        nickname: finalFormData.nickname === '' ? null : finalFormData.nickname,
        country: finalFormData.country === '' ? null : finalFormData.country,
        bio: finalFormData.bio === '' ? null : finalFormData.bio,
        fighting_style: finalFormData.fighting_style === '' ? null : finalFormData.fighting_style,
        gym_name: finalFormData.gym_name === '' ? null : finalFormData.gym_name,
        gym_id: finalFormData.gym_id === '' || finalFormData.gym_id === undefined ? null : finalFormData.gym_id,
        birthdate: finalFormData.birthdate === '' ? null : finalFormData.birthdate,
        birthplace: finalFormData.birthplace === '' ? null : finalFormData.birthplace,
        blood_type: finalFormData.blood_type === '' ? null : finalFormData.blood_type,
        medical_allergies: finalFormData.medical_allergies === '' ? null : finalFormData.medical_allergies,
        medical_conditions: finalFormData.medical_conditions === '' ? null : finalFormData.medical_conditions,
        emergency_contact_name: finalFormData.emergency_contact_name === '' ? null : finalFormData.emergency_contact_name,
        emergency_contact_phone: finalFormData.emergency_contact_phone === '' ? null : finalFormData.emergency_contact_phone,
        emergency_contact_relation: finalFormData.emergency_contact_relation === '' ? null : finalFormData.emergency_contact_relation,
        insurance_company: finalFormData.insurance_company === '' ? null : finalFormData.insurance_company,
        insurance_policy: finalFormData.insurance_policy === '' ? null : finalFormData.insurance_policy,
        document_type: finalFormData.document_type === '' ? null : finalFormData.document_type,
        document_number: finalFormData.document_number === '' ? null : finalFormData.document_number,
        stance: finalFormData.stance === '' ? null : finalFormData.stance,
        boxrec_url: finalFormData.boxrec_url === '' ? null : finalFormData.boxrec_url,
        tapology_url: finalFormData.tapology_url === '' ? null : finalFormData.tapology_url,
        record_type: finalFormData.record_type === '' ? null : finalFormData.record_type,
        gender: finalFormData.gender === '' ? null : finalFormData.gender,
        height_cm: finalFormData.height_cm === 0 ? null : finalFormData.height_cm,
        weight_kg: finalFormData.weight_kg === 0 ? null : finalFormData.weight_kg,
        reach_cm: finalFormData.reach_cm === 0 ? null : finalFormData.reach_cm,
      };
      
      const success = await adminUpdateFighterProfile(fighter.id, sanitizedData);
      if (success) {
        toast({
          title: "¡Actualización exitosa!",
          description: "El perfil del peleador ha sido actualizado correctamente.",
        });
        
        // Wait for cache invalidation before closing modal
        await new Promise(resolve => setTimeout(resolve, 300));
        
        onClose();
      } else {
        toast({
          title: "Error en la actualización",
          description: "Hubo un problema al actualizar el perfil. Revisa los logs para más detalles.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error inesperado",
        description: `Ocurrió un error inesperado: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl truncate">
            Editar Perfil: {fighter.first_name} {fighter.last_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-5 gap-1">
              <TabsTrigger value="personal" className="flex-shrink-0 text-xs md:text-sm">Personal</TabsTrigger>
              <TabsTrigger value="physical" className="flex-shrink-0 text-xs md:text-sm">Físico</TabsTrigger>
              <TabsTrigger value="combat" className="flex-shrink-0 text-xs md:text-sm">Combate</TabsTrigger>
              <TabsTrigger value="medical" className="flex-shrink-0 text-xs md:text-sm">Médico</TabsTrigger>
              <TabsTrigger value="admin" className="flex-shrink-0 text-xs md:text-sm">Admin</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                        <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
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
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => handleChange('country', e.target.value)}
                        />
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
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="birthplace">Lugar de Nacimiento</Label>
                      <Input
                        id="birthplace"
                        value={formData.birthplace}
                        onChange={(e) => handleChange('birthplace', e.target.value)}
                        placeholder="Ciudad, País"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documentación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="document_type">Tipo de Documento</Label>
                      <Select value={formData.document_type} onValueChange={(value) => handleChange('document_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map(docType => (
                            <SelectItem key={docType.value} value={docType.value}>
                              {docType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="document_number">Número de Documento</Label>
                      <Input
                        id="document_number"
                        value={formData.document_number}
                        onChange={(e) => handleChange('document_number', e.target.value)}
                        placeholder="Número de identificación"
                      />
                    </div>

                    <div>
                      <Label>Foto de Perfil</Label>
                      <FileUpload
                        accept="image/*" 
                        onFileSelect={async (file) => {
                          try {
                            (formData as any)._avatarFile = file;
                            const tempUrl = URL.createObjectURL(file);
                            handleChange('avatar_url', tempUrl);
                          } catch (error) {
                            console.error('Error handling file selection:', error);
                          }
                        }}
                        maxSize={5 * 1024 * 1024}
                        className="mt-2"
                      />
                      
                      {/* Toggle for AI background removal */}
                      <div className="flex items-center space-x-2 mt-3 p-3 rounded-lg bg-muted/50 border">
                        <Switch
                          id="remove-bg"
                          checked={removeBackground}
                          onCheckedChange={setRemoveBackground}
                        />
                        <Label htmlFor="remove-bg" className="flex items-center gap-2 cursor-pointer">
                          <Wand2 className="w-4 h-4 text-primary" />
                          <span className="text-sm">Remover fondo automáticamente (IA)</span>
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Activa esta opción para fotos de cartelera sin fondo
                      </p>
                      
                      {formData.avatar_url && (
                        <div className="mt-2">
                          <img 
                            src={formData.avatar_url} 
                            alt="Preview" 
                            className="w-20 h-20 rounded-full object-cover border"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="bio">Biografía</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Describe al peleador..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Physical Attributes Tab */}
            <TabsContent value="physical" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Medidas Físicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="height_cm">Altura (cm)</Label>
                        <Input
                          id="height_cm"
                          type="number"
                          min="0"
                          max="250"
                          value={formData.height_cm}
                          onChange={(e) => handleChange('height_cm', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight_kg">Peso (kg)</Label>
                        <Input
                          id="weight_kg"
                          type="number"
                          min="0"
                          max="200"
                          step="0.1"
                          value={formData.weight_kg}
                          onChange={(e) => handleChange('weight_kg', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="reach_cm">Alcance (cm)</Label>
                      <Input
                        id="reach_cm"
                        type="number"
                        min="0"
                        max="250"
                        value={formData.reach_cm}
                        onChange={(e) => handleChange('reach_cm', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="weight_class">Categoría de Peso *</Label>
                      <Select 
                        value={formData.weight_class} 
                        onValueChange={(value) => handleChange('weight_class', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEIGHT_CLASSES.map(wc => (
                            <SelectItem key={wc.value} value={wc.value}>
                              {wc.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Weight class change sync alert */}
                    {fighter.weight_class !== formData.weight_class && activeLeagues.length > 0 && (
                      <Alert className="border-primary/30 bg-primary/5">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-foreground">
                          <span className="font-medium">Sincronización automática:</span> La categoría de peso se actualizará en{' '}
                          <span className="font-bold">{activeLeagues.length}</span> ranking(s):{' '}
                          {activeLeagues.map(l => l.organization_short_name).join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="stance">Guardia</Label>
                      <Select value={formData.stance} onValueChange={(value) => handleChange('stance', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar postura" />
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

                <Card>
                  <CardHeader>
                    <CardTitle>Información de Gimnasio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                          value={formData.gym_name}
                          onChange={(e) => handleChange('gym_name', e.target.value)}
                          placeholder="Escribir nombre del gimnasio"
                        />
                      )}
                    </div>

                    <div>
                      <Label htmlFor="fighting_style">Estilo de Pelea</Label>
                      <Input
                        id="fighting_style"
                        value={formData.fighting_style}
                        onChange={(e) => handleChange('fighting_style', e.target.value)}
                        placeholder="Ej: Striker, Grappler, All-Around"
                      />
                    </div>

                    <div>
                      <Label htmlFor="boxrec_url">BoxRec URL</Label>
                      <Input
                        id="boxrec_url"
                        value={formData.boxrec_url}
                        onChange={(e) => handleChange('boxrec_url', e.target.value)}
                        placeholder="https://boxrec.com/..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="tapology_url">Tapology URL</Label>
                      <Input
                        id="tapology_url"
                        value={formData.tapology_url}
                        onChange={(e) => handleChange('tapology_url', e.target.value)}
                        placeholder="https://tapology.com/..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Combat Information Tab */}
            <TabsContent value="combat" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1: Disciplina de Competencia */}
                <Card>
                  <CardHeader>
                    <CardTitle>Disciplina de Competencia</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="discipline">Disciplina *</Label>
                      <Select 
                        value={formData.discipline || '__none__'} 
                        onValueChange={handleDisciplineChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sin selección</SelectItem>
                          {ENABLED_DISCIPLINES.map(disc => (
                            <SelectItem key={disc.value} value={disc.value}>
                              {disc.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Define en qué ranking aparece el peleador
                      </p>
                      {/* Warning when discipline changes */}
                      {fighter.discipline !== formData.discipline && 
                       (fighter.discipline !== undefined || formData.discipline !== undefined) && (
                        <div className="bg-fighter-warning/10 border border-fighter-warning/30 rounded-md p-3 mt-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-fighter-warning mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-fighter-warning text-sm">
                                Cambio de disciplina detectado
                              </p>
                              <p className="text-fighter-warning/80 text-xs mt-1">
                                Las membresías de ranking existentes no se modificarán automáticamente. 
                                Utiliza la pestaña "Ligas" del peleador para gestionar sus rankings.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="level">Nivel Competitivo</Label>
                      <Select 
                        value={formData.level || 'AMATEUR'} 
                        onValueChange={(value) => handleChange('level', value)}
                      >
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

                    {/* Level change sync alert */}
                    {fighter.level !== formData.level && activeLeagues.length > 0 && (
                      <Alert className="border-primary/30 bg-primary/5">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-foreground">
                          <span className="font-medium">Sincronización automática:</span> El nivel se actualizará en{' '}
                          <span className="font-bold">{activeLeagues.length}</span> ranking(s):{' '}
                          {activeLeagues.map(l => l.organization_short_name).join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Card 2: Artes Marciales de Entrenamiento */}
                <Card>
                  <CardHeader>
                    <CardTitle>Artes Marciales de Entrenamiento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Selecciona las artes que practica para su preparación (informativo)
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {MARTIAL_ARTS_TRAINING.map((art) => (
                          <div key={art.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={art.value}
                              checked={formData.martial_arts?.includes(art.value) || false}
                              onCheckedChange={(checked) => handleTrainingArtsChange(art.value, checked as boolean)}
                            />
                            <Label htmlFor={art.value} className="text-sm font-normal cursor-pointer">
                              {art.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.martial_arts && formData.martial_arts.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.martial_arts.map((art) => (
                            <Badge key={art} variant="secondary" className="text-xs">
                              {MARTIAL_ARTS_TRAINING.find(a => a.value === art)?.label || art}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Records Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Récord de Combate</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* MMA Record - Solo si MMA está seleccionado */}
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

                    {/* Boxeo Record - Solo si Boxeo está seleccionado */}
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

                    {/* Mensaje si no hay disciplina seleccionada */}
                    {!formData.discipline && (
                      <div className="text-center p-6 text-muted-foreground border rounded-lg border-dashed">
                        Selecciona una disciplina en la sección "Disciplinas y Estilo" para editar récords
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Medical & Emergency Tab */}
            <TabsContent value="medical" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Médica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="blood_type">Tipo de Sangre</Label>
                      <Select value={formData.blood_type} onValueChange={(value) => handleChange('blood_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo de sangre" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_TYPES.map(bloodType => (
                            <SelectItem key={bloodType.value} value={bloodType.value}>
                              {bloodType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="medical_allergies">Alergias</Label>
                      <Textarea
                        id="medical_allergies"
                        value={formData.medical_allergies}
                        onChange={(e) => handleChange('medical_allergies', e.target.value)}
                        placeholder="Describir alergias conocidas..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="medical_conditions">Condiciones Médicas</Label>
                      <Textarea
                        id="medical_conditions"
                        value={formData.medical_conditions}
                        onChange={(e) => handleChange('medical_conditions', e.target.value)}
                        placeholder="Describir condiciones médicas relevantes..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contacto de Emergencia</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">Nombre de Contacto</Label>
                      <Input
                        id="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergency_contact_relation">Relación</Label>
                      <Input
                        id="emergency_contact_relation"
                        value={formData.emergency_contact_relation}
                        onChange={(e) => handleChange('emergency_contact_relation', e.target.value)}
                        placeholder="Ej: Esposa, Padre, Hermano"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergency_contact_phone">Teléfono de Emergencia</Label>
                      <Input
                        id="emergency_contact_phone"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                        placeholder="+504 9999-9999"
                      />
                    </div>

                    <div>
                      <Label htmlFor="insurance_company">Compañía de Seguros</Label>
                      <Input
                        id="insurance_company"
                        value={formData.insurance_company}
                        onChange={(e) => handleChange('insurance_company', e.target.value)}
                        placeholder="Nombre de la aseguradora"
                      />
                    </div>

                    <div>
                      <Label htmlFor="insurance_policy">Póliza de Seguro</Label>
                      <Input
                        id="insurance_policy"
                        value={formData.insurance_policy}
                        onChange={(e) => handleChange('insurance_policy', e.target.value)}
                        placeholder="Número de póliza"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Admin Tab */}
            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle>Configuraciones de Administrador</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Estas configuraciones solo están disponibles para administradores y afectan el comportamiento del sistema.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Las configuraciones administrativas adicionales se pueden agregar aquí según sea necesario.
                      Por ahora, toda la información del peleador se gestiona desde las pestañas anteriores.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions - Sticky Footer for Mobile */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background pb-4 -mb-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] touch-manipulation w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-h-[44px] touch-manipulation w-full sm:w-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}