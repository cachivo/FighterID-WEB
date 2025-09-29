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
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: UpdateUserProfileData) => {
    if (!user || !profile) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('app_user')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, ...data } : null);
      
      toast({
        title: 'Perfil actualizado',
        description: 'Tu información ha sido guardada correctamente'
      });

      return true;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil: ' + err.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
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