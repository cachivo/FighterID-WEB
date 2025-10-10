import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, Eye, EyeOff, User, Mail, Phone, CalendarDays, FileText } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

const profileSchema = z.object({
  first_name: z.string().max(50, 'Máximo 50 caracteres').optional(),
  last_name: z.string().max(50, 'Máximo 50 caracteres').optional(),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional(),
  phone: z.string().optional(),
  birthdate: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserProfileFormProps {
  onSuccess?: () => void;
}

export const UserProfileForm = ({ onSuccess }: UserProfileFormProps) => {
  const { profile, updateProfile, uploadAvatar } = useUserProfile();
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [privacySettings, setPrivacySettings] = useState(
    profile?.profile_visibility || {
      first_name: true,
      last_name: true,
      email: false,
      phone: false,
      birthdate: false,
      bio: true,
      avatar: true
    }
  );

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      bio: profile?.bio || '',
      phone: profile?.phone || '',
      birthdate: profile?.birthdate || '',
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    const success = await updateProfile({
      ...data,
      profile_visibility: privacySettings
    });

    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validación de tamaño ANTES de procesar
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen debe ser menor a 10MB');
      return;
    }

    // Validación de tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Mostrar preview mientras se procesa
    try {
      const { getAvatarPreview } = await import('@/lib/avatarOptimizer');
      const preview = await getAvatarPreview(file);
      setAvatarPreview(preview);
    } catch (err) {
      console.error('Error generating preview:', err);
    }

    setUploading(true);
    const avatarUrl = await uploadAvatar(file);
    
    if (avatarUrl) {
      await updateProfile({ avatar_url: avatarUrl });
      setAvatarPreview(null); // Limpiar preview
    }
    
    setUploading(false);
  };

  const togglePrivacy = (field: string) => {
    const newSettings = {
      ...privacySettings,
      [field]: !privacySettings[field]
    };
    setPrivacySettings(newSettings);
  };

  const PrivacyToggle = ({ field, label }: { field: string; label: string }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        {privacySettings[field] ? (
          <Eye className="h-4 w-4 text-green-600" />
        ) : (
          <EyeOff className="h-4 w-4 text-gray-400" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Switch
        checked={privacySettings[field] || false}
        onCheckedChange={() => togglePrivacy(field)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarPreview || profile?.avatar_url || ''} alt="Avatar" />
            <AvatarFallback className="text-lg font-bold">
              {profile?.first_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <label htmlFor="avatar-upload">
              <Button variant="outline" disabled={uploading} className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Subiendo...' : 'Cambiar Foto'}
              </Button>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Máximo 10MB, formatos: JPG, PNG, WEBP
            </p>
            {avatarPreview && (
              <p className="text-xs text-primary font-medium">
                ✓ Vista previa cargada
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Completa tu perfil con información básica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nombre
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Apellido
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Tu apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+504 9999-9999" {...field} />
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
                    <FormLabel className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Fecha de Nacimiento
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Biografía
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Cuéntanos un poco sobre ti..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Información
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Configuración de Privacidad
          </CardTitle>
          <CardDescription>
            Controla qué información es visible para otros usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PrivacyToggle field="avatar" label="Foto de perfil" />
          <PrivacyToggle field="first_name" label="Nombre" />
          <PrivacyToggle field="last_name" label="Apellido" />
          <PrivacyToggle field="email" label="Correo electrónico" />
          <PrivacyToggle field="phone" label="Teléfono" />
          <PrivacyToggle field="birthdate" label="Fecha de nacimiento" />
          <PrivacyToggle field="bio" label="Biografía" />
          
          <Button 
            onClick={() => updateProfile({ profile_visibility: privacySettings })}
            variant="outline" 
            className="w-full mt-4"
          >
            Guardar Configuración de Privacidad
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};