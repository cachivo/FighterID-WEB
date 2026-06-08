import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';

interface CreateProfileResult {
  success: boolean;
  user_id: string;
  fighter_id: string;
  license_id: string;
  license_number: string;
}

interface OnboardingData {
  firstName: string;
  lastName: string;
  nickname?: string;
  country: string;
  weightClass: string;
  heightCm: string;
  weightKg: string;
  reachCm?: string;
  martialArts: string[];
  gymName?: string;
  fightingStyle?: string;
  stance?: string;
  level?: string;
  bio?: string;
  phone?: string;
  birthdate?: string;
  gender?: string;
  // Records
  amateurWins?: string;
  amateurLosses?: string;
  amateurDraws?: string;
  proWins?: string;
  proLosses?: string;
  proDraws?: string;
}

export function useOptimizedOnboarding() {
  const { user, refreshLicense } = useLicenseAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const createProfile = async (formData: OnboardingData, files?: {
    identityDocument?: File;
    fighterPhoto?: File;
  }) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return { success: false };
    }

    setLoading(true);

    // Validate numeric inputs
    const heightCm = parseInt(formData.heightCm);
    const weightKg = parseFloat(formData.weightKg);
    const reachCm = formData.reachCm ? parseInt(formData.reachCm) : null;

    if (isNaN(heightCm) || heightCm <= 0 || heightCm > 300) {
      toast.error('Por favor ingresa una altura válida (1-300 cm)');
      setLoading(false);
      return { success: false };
    }
    if (isNaN(weightKg) || weightKg <= 0 || weightKg > 600) {
      toast.error('Por favor ingresa un peso válido (1-600 kg)');
      setLoading(false);
      return { success: false };
    }
    if (reachCm !== null && (isNaN(reachCm) || reachCm <= 0 || reachCm > 300)) {
      toast.error('Por favor ingresa un alcance válido (1-300 cm)');
      setLoading(false);
      return { success: false };
    }

    try {
      // Prepare discipline based on martial arts - ensure it's a valid enum value
      const validDisciplines = ['MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'] as const;
      type ValidDiscipline = typeof validDisciplines[number];
      const discipline: ValidDiscipline = formData.martialArts.length > 0 && validDisciplines.includes(formData.martialArts[0] as ValidDiscipline)
        ? formData.martialArts[0] as ValidDiscipline
        : 'MMA';

      // Calculate record based on level
      const isProLevel = formData.level === 'Profesional';
      const recordWins = isProLevel 
        ? parseInt(formData.proWins || '0') || 0
        : parseInt(formData.amateurWins || '0') || 0;
      const recordLosses = isProLevel
        ? parseInt(formData.proLosses || '0') || 0
        : parseInt(formData.amateurLosses || '0') || 0;
      const recordDraws = isProLevel
        ? parseInt(formData.proDraws || '0') || 0
        : parseInt(formData.amateurDraws || '0') || 0;

      const { data: result, error } = await supabase.rpc(
        'create_fighter_profile_with_license',
        {
          p_auth_user_id: user.id,
          p_email: user.email || '',
          p_first_name: formData.firstName,
          p_last_name: formData.lastName,
          p_country: formData.country,
          p_weight_class: formData.weightClass,
          p_height_cm: heightCm,
          p_weight_kg: weightKg,
          p_phone: formData.phone || null,
          p_birthdate: formData.birthdate || null,
          p_nickname: formData.nickname || null,
          p_reach_cm: reachCm,
          p_discipline: discipline,
          p_martial_arts: formData.martialArts,
          p_gym_name: formData.gymName || null,
          p_fighting_style: formData.fightingStyle || null,
          p_stance: formData.stance || null,
          p_level: formData.level || null,
          p_record_wins: recordWins,
          p_record_losses: recordLosses,
          p_record_draws: recordDraws,
          p_record_type: isProLevel ? 'Profesional' : 'Amateur',
          p_gender: formData.gender || null,
          p_bio: formData.bio || null
        }
      ) as { data: CreateProfileResult | null; error: any };

      if (error) {
        console.error('Error creating profile:', error);

        // FIX H4: "Already has profile" is an idempotent navigation, NOT a successful
        // create. Don't return success (caller would wipe the draft + show success toast).
        if (error.message?.includes('already has an active fighter profile')) {
          toast.info('Ya tienes un perfil de peleador activo. Para solicitar otra licencia con otro perfil, usa una cuenta diferente.');
          navigate('/license/pending', { replace: true });
          return { success: false, alreadyExists: true };
        }

        throw error;
      }

      if (!result?.success) {
        throw new Error('Error creating profile: Invalid response');
      }

      console.log('Profile created successfully:', result);

      // Discipline-specific records are now written atomically by the RPC function.
      // No separate update needed.

      // Upload files in background (non-blocking)
      if (files?.identityDocument || files?.fighterPhoto) {
        uploadFilesInBackground(result.license_id, result.fighter_id, files);
      }

      // Refresh license data
      refreshLicense().catch(error => 
        console.error('Error refreshing license (non-blocking):', error)
      );

      toast.success('¡Perfil creado exitosamente! Tu Fighter ID está pendiente de revisión.');
      navigate('/license/pending', { replace: true });
      
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('Profile creation error:', error);
      
      let errorMessage = 'Error al crear el perfil. Por favor verifica los datos e intenta nuevamente.';
      
      if (error?.code === '23505') {
        toast.info('Ya tienes un perfil de peleador activo. Para solicitar otra licencia con otro perfil, usa una cuenta diferente.');
        navigate('/license/pending', { replace: true });
        return { success: false, alreadyExists: true };
      } else if (error?.message?.includes('Unauthorized')) {
        errorMessage = 'Error de autorización. Inicia sesión nuevamente.';
      } else if (error?.message?.includes('invalid input syntax')) {
        errorMessage = 'Error en los datos: verifica que altura, peso y récord sean números válidos.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
      
    } finally {
      setLoading(false);
    }
  };

  // Background file upload function
  const uploadFilesInBackground = async (
    licenseId: string, 
    profileId: string, 
    files: { identityDocument?: File; fighterPhoto?: File }
  ) => {
    try {
      // Upload identity document
      if (files.identityDocument && user) {
        const identityFileName = `${user.id}/identity-${Date.now()}.${files.identityDocument.type.split('/')[1]}`;
        
        const { error: uploadError } = await supabase.storage
          .from('license-documents')
          .upload(identityFileName, files.identityDocument);

        if (!uploadError) {
          await supabase
            .from('license_documents')
            .insert({
              license_id: licenseId,
              document_type: 'identity',
              file_path: identityFileName,
              file_name: files.identityDocument.name,
              file_size: files.identityDocument.size,
              mime_type: files.identityDocument.type,
              uploaded_by: user.id
            });
          
          console.log('Identity document uploaded successfully');
        }
      }

      // Upload fighter photo
      if (files.fighterPhoto && user) {
        const photoFileName = `${user.id}/photo-${Date.now()}.${files.fighterPhoto.type.split('/')[1]}`;
        
        const { error: uploadError } = await supabase.storage
          .from('fighter-photos')
          .upload(photoFileName, files.fighterPhoto);

        if (!uploadError) {
          const { data: publicUrl } = supabase.storage
            .from('fighter-photos')
            .getPublicUrl(photoFileName);

          await supabase
            .from('fighter_profiles')
            .update({ avatar_url: publicUrl.publicUrl })
            .eq('id', profileId);
            
          console.log('Fighter photo uploaded successfully');
        }
      }
    } catch (error) {
      console.error('Background file upload error (non-blocking):', error);
    }
  };

  return {
    createProfile,
    loading
  };
}