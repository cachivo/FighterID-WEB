import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { FighterProfile } from '@/hooks/useFighterProfiles';
import { Upload, Save, X, Lock, AlertCircle, ImageIcon, Wand2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFighterAvatar } from '@/lib/photoUtils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { WEIGHT_CLASSES, FIGHTER_LEVELS, COUNTRIES } from '@/lib/constants/disciplines';
import { useGymsList } from '@/hooks/useGymsList';

const fighterProfileSchema = z.object({
  first_name: z.string().min(1, 'Nombre es requerido').max(50, 'Máximo 50 caracteres'),
  last_name: z.string().min(1, 'Apellido es requerido').max(50, 'Máximo 50 caracteres'),
  nickname: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  birthdate: z.string().optional().or(z.literal('')),
  birthplace: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  blood_type: z.string().optional().or(z.literal('')),
  weight_class: z.string().optional().or(z.literal('')),
  height_cm: z.string().optional().or(z.literal('')),
  weight_kg: z.string().optional().or(z.literal('')),
  reach_cm: z.string().optional().or(z.literal('')),
  stance: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  fighting_style: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  gym_name: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  gym_id: z.string().optional().or(z.literal('')),
  level: z.string().optional().or(z.literal('')),
  record_wins: z.string().optional().or(z.literal('')),
  record_losses: z.string().optional().or(z.literal('')),
  record_draws: z.string().optional().or(z.literal('')),
  record_type: z.string().optional().or(z.literal('')),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  emergency_contact_name: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  emergency_contact_phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  emergency_contact_relation: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  medical_conditions: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  medical_allergies: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  insurance_company: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  insurance_policy: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  boxrec_url: z.string().url('URL inválida').optional().or(z.literal('')),
  tapology_url: z.string().url('URL inválida').optional().or(z.literal('')),
  document_type: z.string().optional().or(z.literal('')),
  document_number: z.string().max(30, 'Máximo 30 caracteres').optional().or(z.literal(''))
});

type FighterProfileFormData = z.infer<typeof fighterProfileSchema>;

interface UserFighterProfileEditFormProps {
  profile: FighterProfile;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserFighterProfileEditForm({ profile, onSuccess, onCancel }: UserFighterProfileEditFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const { data: gymsList } = useGymsList();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [documentImageFile, setDocumentImageFile] = useState<File | null>(null);
  const [documentImagePreview, setDocumentImagePreview] = useState<string | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<string | null>(null);
  const [isRecordLocked, setIsRecordLocked] = useState(false);

  // ============================================================================
  // ARQUITECTURA DE RÉCORD DE PELEAS
  // ============================================================================
  // REGLA DE NEGOCIO:
  // - SIN licencia o licencia NO aprobada → Usuario puede editar récord libremente
  // - CON licencia ACTIVE (aprobada) → Récord BLOQUEADO, solo admin puede cambiar
  // Estados de licencia que BLOQUEAN el récord: ACTIVE, SUSPENDED, EXPIRED, REVOKED
  // Estados que PERMITEN edición: null, APPLIED, PENDING_REVIEW
  // ============================================================================

  // Obtener estado de la licencia primaria
  useEffect(() => {
    const fetchLicenseStatus = async () => {
      if (!profile.primary_license_id) {
        setLicenseStatus(null);
        setIsRecordLocked(false);
        return;
      }

      const { data, error } = await supabase
        .from('fighter_licenses')
        .select('status')
        .eq('id', profile.primary_license_id)
        .single();

      if (!error && data) {
        setLicenseStatus(data.status);
        
        // Bloquear récord si la licencia está ACTIVE o fue aprobada previamente
        const lockedStatuses = ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED'];
        setIsRecordLocked(lockedStatuses.includes(data.status));
      }
    };

    fetchLicenseStatus();
  }, [profile.primary_license_id]);

  const form = useForm<FighterProfileFormData>({
    resolver: zodResolver(fighterProfileSchema),
    defaultValues: {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      nickname: profile.nickname || '',
      gender: profile.gender || '',
      country: profile.country || 'Honduras',
      birthdate: profile.birthdate || '',
      birthplace: profile.birthplace || '',
      phone: profile.phone || '',
      blood_type: profile.blood_type || '',
      weight_class: profile.weight_class || '',
      height_cm: profile.height_cm ? profile.height_cm.toString() : '',
      weight_kg: profile.weight_kg ? profile.weight_kg.toString() : '',
      reach_cm: profile.reach_cm ? profile.reach_cm.toString() : '',
      stance: profile.stance || '',
      fighting_style: profile.fighting_style || '',
      gym_name: profile.gym_name || '',
      gym_id: (profile as any).gym_id || '',
      level: profile.level || '',
      record_wins: profile.record_wins ? profile.record_wins.toString() : '0',
      record_losses: profile.record_losses ? profile.record_losses.toString() : '0',
      record_draws: profile.record_draws ? profile.record_draws.toString() : '0',
      record_type: profile.record_type || 'Amateur',
      bio: profile.bio || '',
      emergency_contact_name: profile.emergency_contact_name || '',
      emergency_contact_phone: profile.emergency_contact_phone || '',
      emergency_contact_relation: profile.emergency_contact_relation || '',
      medical_conditions: profile.medical_conditions || '',
      medical_allergies: profile.medical_allergies || '',
      insurance_company: profile.insurance_company || '',
      insurance_policy: profile.insurance_policy || '',
      boxrec_url: profile.boxrec_url || '',
      tapology_url: profile.tapology_url || '',
      document_type: (profile as any).document_type || '',
      document_number: (profile as any).document_number || ''
    }
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "La imagen no puede superar los 5MB",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "La imagen no puede superar los 5MB",
          variant: "destructive",
        });
        return;
      }
      setDocumentImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setDocumentImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Gym Select sub-component
  const GymSelectField = ({ form: f }: { form: any }) => {
    const gymId = f.watch('gym_id');
    return (
      <FormField
        control={f.control}
        name="gym_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gimnasio/Academia</FormLabel>
            <Select
              value={field.value || '__independiente__'}
              onValueChange={(value) => {
                if (value === '__independiente__') {
                  f.setValue('gym_id', '');
                  f.setValue('gym_name', 'Independiente');
                } else {
                  const selectedGym = gymsList?.find(g => g.id === value);
                  f.setValue('gym_id', value);
                  f.setValue('gym_name', selectedGym?.nombre || '');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un gimnasio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__independiente__">Independiente</SelectItem>
                {gymsList?.map(gym => (
                  <SelectItem key={gym.id} value={gym.id}>{gym.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const onSubmit = async (data: FighterProfileFormData) => {
    if (!user || !profile.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes estar autenticado para actualizar tu perfil."
      });
      return;
    }

    setIsLoading(true);

    try {
      const profileId = profile.id;

      // ============================================================================
      // ARQUITECTURA: Campos de actualización inmediata vs récord bloqueado
      // ============================================================================
      // Campos que se actualizan INMEDIATAMENTE (sin aprobación):
      const immediateUpdateFields = [
        'bio', 'boxrec_url', 'tapology_url',
        'blood_type', 'medical_conditions', 'medical_allergies',
        'insurance_company', 'insurance_policy',
        'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
        'height_cm', 'weight_kg', 'reach_cm', 'stance',
        'weight_class', 'fighting_style', 'gym_name', 'gym_id', 'level',
        'first_name', 'last_name', 'nickname', 'country', 'birthdate', 'birthplace', 'gender',
        'document_type', 'document_number'
      ];

      // Campos de récord (bloqueados SI licencia está ACTIVE)
      const recordFields = ['record_wins', 'record_losses', 'record_draws', 'record_type'];

      // Separar cambios según lógica de licencia
      const immediateUpdates: any = {};
      const recordChanges: any = {};

      Object.entries(data).forEach(([key, value]) => {
        if (value !== profile[key as keyof typeof profile]) {
          if (immediateUpdateFields.includes(key)) {
            immediateUpdates[key] = value;
          } else if (recordFields.includes(key)) {
            // Si el récord está bloqueado, va a solicitud; si no, actualización directa
            if (isRecordLocked) {
              recordChanges[key] = value;
            } else {
              immediateUpdates[key] = value;
            }
          }
        }
      });

      // 1. APLICAR INMEDIATAMENTE todos los campos permitidos
      if (Object.keys(immediateUpdates).length > 0 || avatarFile || documentImageFile || data.phone !== profile.phone) {
        const updates = { ...immediateUpdates };

        // Incluir avatar si existe
        if (avatarFile) {
          const newAvatarUrl = await uploadFighterAvatar(avatarFile, user.id, profileId, profile.avatar_url, removeBackground);
          updates.avatar_url = newAvatarUrl;
        }

        // Incluir imagen de documento si existe
        if (documentImageFile) {
          const fileExt = documentImageFile.name.split('.').pop();
          const fileName = `${user.id}/document-${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('fighter-photos')
            .upload(fileName, documentImageFile, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('fighter-photos')
            .getPublicUrl(fileName);

          updates.document_image_url = publicUrl;
        }

        // Convertir valores numéricos
        if (updates.height_cm) updates.height_cm = Number(updates.height_cm);
        if (updates.weight_kg) updates.weight_kg = Number(updates.weight_kg);
        if (updates.reach_cm) updates.reach_cm = Number(updates.reach_cm);
        if (updates.record_wins) updates.record_wins = Number(updates.record_wins);
        if (updates.record_losses) updates.record_losses = Number(updates.record_losses);
        if (updates.record_draws) updates.record_draws = Number(updates.record_draws);

      // Usar RPC para sincronización automática a rankings
      const { error: updateError } = await supabase.rpc('user_update_fighter_profile', {
        p_fighter_id: profileId,
        p_profile_data: updates
      });

      if (updateError) throw updateError;

        // Actualizar teléfono en app_user si cambió
        if (data.phone !== profile.phone) {
          const { error: phoneError } = await supabase
            .from('app_user')
            .update({ phone: data.phone || null })
            .eq('id', profile.user_id);

          if (phoneError) throw phoneError;
        }

        console.log("[SUCCESS] Immediate updates applied, gamification score updated via trigger");
        
        // Invalidate all related caches for immediate UI sync
        queryClient.invalidateQueries({ queryKey: ['fighters'] });
        queryClient.invalidateQueries({ queryKey: ['fighter', profileId] });
        queryClient.invalidateQueries({ queryKey: ['fighter-profile', profileId] });
        queryClient.invalidateQueries({ queryKey: ['userFighterProfile'] });
        queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
        queryClient.invalidateQueries({ queryKey: ['ranking-data'] });
        queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues'] });
        queryClient.invalidateQueries({ queryKey: ['license'] });
        // React Query cache invalidation handles UI sync (no custom events needed)
      }

      // 2. CREAR SOLICITUD para récord (solo si está bloqueado Y hay cambios)
      if (isRecordLocked && Object.keys(recordChanges).length > 0) {
        const { data: appUser, error: userError } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (userError || !appUser) {
          toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "No se pudo verificar tu usuario."
          });
          return;
        }

        // Convertir valores numéricos del récord
        if (recordChanges.record_wins) recordChanges.record_wins = Number(recordChanges.record_wins);
        if (recordChanges.record_losses) recordChanges.record_losses = Number(recordChanges.record_losses);
        if (recordChanges.record_draws) recordChanges.record_draws = Number(recordChanges.record_draws);

        await supabase
          .from('profile_change_requests')
          .insert({
            fighter_profile_id: profileId,
            user_id: appUser.id,
            requested_changes: recordChanges,
            status: 'PENDING',
            admin_notes: 'CAMBIO DE RÉCORD - Licencia aprobada, requiere verificación administrativa'
          });

        toast({
          title: "Solicitud de cambio de récord enviada",
          description: "Los cambios en tu récord de peleas serán revisados por un administrador."
        });
      }

      // 3. Mensaje final al usuario
      if (Object.keys(immediateUpdates).length > 0 || avatarFile) {
        toast({
          title: "Perfil actualizado",
          description: "Los cambios se aplicaron inmediatamente y tu puntuación de gamificación se actualizó."
        });
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={avatarPreview || profile.avatar_url || '/placeholder-avatar.png'}
                    alt="Avatar"
                    className="h-24 w-24 rounded-xl object-cover border-2 border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4" />
                      Cambiar Foto
                    </div>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Máximo 5MB. Formatos: JPG, PNG, WebP
                  </p>
                  
                  {/* Toggle for AI background removal */}
                  <div className="flex items-center space-x-2 mt-3 p-3 rounded-lg bg-muted/50 border">
                    <Switch
                      id="remove-bg-user"
                      checked={removeBackground}
                      onCheckedChange={setRemoveBackground}
                    />
                    <Label htmlFor="remove-bg-user" className="flex items-center gap-2 cursor-pointer">
                      <Wand2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">Remover fondo con IA</span>
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apodo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthplace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lugar de Nacimiento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ciudad, País" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="+504 1234-5678" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="blood_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Sangre</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)} 
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Género</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)} 
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar género" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)} 
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger className="min-h-[44px] touch-manipulation">
                            <SelectValue placeholder="Seleccionar país" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Imagen de Identidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Imagen de Identidad
              </CardTitle>
              <CardDescription>
                Sube una foto clara de tu documento de identidad (DNI, Cédula, Pasaporte)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {(documentImagePreview || profile.document_image_url) && (
                    <div className="relative">
                      <img
                        src={documentImagePreview || profile.document_image_url || ''}
                        alt="Documento de identidad"
                        className="h-40 w-auto max-w-full rounded-lg object-contain border-2 border-border bg-muted"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Label htmlFor="document-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Upload className="h-4 w-4" />
                        {profile.document_image_url ? 'Cambiar Imagen' : 'Subir Imagen'}
                      </div>
                    </Label>
                    <input
                      id="document-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleDocumentImageChange}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Máximo 5MB. Formatos: JPG, PNG, WebP
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Asegúrate de que la imagen sea clara y legible
                    </p>
                  </div>
                </div>
              </div>

                {/* Document Type and Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="document_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)} 
                          value={field.value || '__none__'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
                            <SelectItem value="DNI">DNI</SelectItem>
                            <SelectItem value="Cédula">Cédula</SelectItem>
                            <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="document_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Documento</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: 0801-1990-12345" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
            </CardContent>
          </Card>

          {/* Información Física */}
          <Card>
            <CardHeader>
              <CardTitle>Información Física</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reach_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alcance (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="stance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardia</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)} 
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar postura" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
                          <SelectItem value="Ortodoxo">Ortodoxo</SelectItem>
                          <SelectItem value="Zurdo">Zurdo</SelectItem>
                          <SelectItem value="Switch">Switch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fighting_style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estilo de Pelea</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ej: Striker, Grappler" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <GymSelectField form={form} />
              </div>
            </CardContent>
          </Card>

          {/* Información de Combate */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Combate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight_class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría de Peso</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)} 
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
                          {WEIGHT_CLASSES.map((wc) => (
                            <SelectItem key={wc.value} value={wc.value}>
                              {wc.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)} 
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar nivel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-muted-foreground">-- Seleccionar --</SelectItem>
                          {FIGHTER_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Récord de Peleas - Condicional según estado de licencia */}
              <Card className={isRecordLocked ? "border-l-4 border-l-fighter-warning bg-muted/30" : ""}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isRecordLocked ? 'text-fighter-warning' : ''}`}>
                    {isRecordLocked && <Lock className="h-5 w-5" />}
                    Récord de Peleas
                  </CardTitle>
                  {isRecordLocked && (
                    <CardDescription className="flex items-center gap-2 text-fighter-warning/80">
                      <AlertCircle className="h-4 w-4" />
                      Tu licencia está aprobada. Los cambios en tu récord deben ser autorizados por un administrador.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${isRecordLocked ? 'opacity-60' : ''}`}>
                    <FormField
                      control={form.control}
                      name="record_wins"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Victorias</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field} 
                              disabled={isRecordLocked}
                              className={isRecordLocked ? 'cursor-not-allowed' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="record_losses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Derrotas</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field} 
                              disabled={isRecordLocked}
                              className={isRecordLocked ? 'cursor-not-allowed' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="record_draws"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empates</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field} 
                              disabled={isRecordLocked}
                              className={isRecordLocked ? 'cursor-not-allowed' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="record_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={isRecordLocked}
                          >
                            <FormControl>
                              <SelectTrigger className={isRecordLocked ? 'cursor-not-allowed' : ''}>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Amateur">Amateur</SelectItem>
                              <SelectItem value="Profesional">Profesional</SelectItem>
                              <SelectItem value="Mixto">Mixto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Cuéntanos sobre tu trayectoria en las artes marciales..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto de Emergencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_relation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relación</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ej: Padre, Madre, Hermano" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Médica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Médica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="medical_conditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condiciones Médicas</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe cualquier condición médica relevante" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medical_allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alergias</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe cualquier alergia conocida" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="insurance_company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compañía de Seguro</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insurance_policy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Póliza</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Enlaces de Perfil Deportivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="boxrec_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de BoxRec</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://boxrec.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tapology_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Tapology</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://tapology.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="min-h-[44px] w-full sm:w-auto touch-manipulation order-2 sm:order-1"
              >
                <X className="h-4 w-4 mr-2 flex-shrink-0" />
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="min-h-[44px] w-full sm:w-auto touch-manipulation order-1 sm:order-2"
            >
              <Save className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{isLoading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}