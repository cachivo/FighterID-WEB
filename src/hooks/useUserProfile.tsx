import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  birthdate: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  profile_visibility: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

interface UpdateUserProfileData {
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  birthdate?: string;
  profile_visibility?: Record<string, boolean>;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_user')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useUserProfile] Error fetching profile:', error);
        setError(error.message);
        setProfile(null);
        return;
      }

      if (!data) {
        // No profile row yet (pre-trigger / legacy account) — valid empty state
        setProfile(null);
        return;
      }

      // Convert profile_visibility from Json to Record<string, boolean>
      const profileData = {
        ...data,
        profile_visibility: typeof data.profile_visibility === 'object' && data.profile_visibility !== null
          ? data.profile_visibility as Record<string, boolean>
          : {
              bio: true,
              email: false,
              phone: false,
              avatar: true,
              birthdate: false,
              last_name: true,
              first_name: true
            }
      };
      
      setProfile(profileData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: UpdateUserProfileData) => {
    if (!user || !profile) {
      console.error('Update failed: Missing user or profile', { user: !!user, profile: !!profile });
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil - Usuario no autenticado',
        variant: 'destructive'
      });
      return false;
    }

    try {
      console.log('Updating profile:', { 
        profileId: profile.id, 
        authUserId: user.id,
        data 
      });

      const { data: updatedData, error } = await supabase
        .from('app_user')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)  // CRITICAL: Use profile.id instead of auth_user_id
        .select()
        .single();

      if (error) {
        console.error('Update error details:', error);
        throw error;
      }

      console.log('Profile updated successfully:', updatedData);

      // Update local state with returned data
      if (updatedData) {
        const profileData = {
          ...updatedData,
          profile_visibility: typeof updatedData.profile_visibility === 'object' && updatedData.profile_visibility !== null
            ? updatedData.profile_visibility as Record<string, boolean>
            : {
                bio: true,
                email: false,
                phone: false,
                avatar: true,
                birthdate: false,
                last_name: true,
                first_name: true
              }
        };
        setProfile(profileData);
      }
      
      toast({
        title: 'Perfil actualizado',
        description: 'Tu información ha sido guardada correctamente'
      });

      return true;
    } catch (err: any) {
      console.error('Full error details:', err);
      toast({
        title: 'Error al actualizar',
        description: err.message || 'No se pudo actualizar el perfil',
        variant: 'destructive'
      });
      return false;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return null;

    try {
      // 1. Validar tamaño máximo ANTES de procesar
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: 'Error',
          description: 'La imagen es demasiado grande (máximo 10MB)',
          variant: 'destructive'
        });
        return null;
      }

      // 2. Optimizar imagen automáticamente
      toast({
        title: 'Procesando imagen...',
        description: 'Optimizando tu foto de perfil'
      });

      const { optimizeAvatar } = await import('@/lib/avatarOptimizer');
      const optimizedFile = await optimizeAvatar(file, {
        maxSize: 512,        // 512x512 perfecto para avatares
        quality: 0.9,        // Alta calidad
        format: 'webp'       // Mejor compresión
      });

      console.log('Optimización completada:', {
        originalSize: file.size,
        optimizedSize: optimizedFile.size,
        reduction: Math.round((1 - optimizedFile.size / file.size) * 100) + '%'
      });

      // 3. Subir imagen optimizada
      const fileExt = 'webp'; // Siempre WebP
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(filePath, optimizedFile, {
          contentType: 'image/webp',
          upsert: true  // Reemplazar si existe
        });

      if (uploadError) throw uploadError;

      // 4. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('user-photos')
        .getPublicUrl(filePath);

      toast({
        title: 'Éxito',
        description: 'Foto de perfil actualizada correctamente'
      });

      return publicUrl;
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen: ' + err.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile
  };
};