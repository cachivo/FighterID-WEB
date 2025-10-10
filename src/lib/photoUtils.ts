import { supabase } from '@/integrations/supabase/client';
import { removeBackground, loadImage } from './backgroundRemoval';
import { toast } from 'sonner';

export async function uploadFighterAvatar(
  file: File, 
  userId: string, 
  fighterProfileId: string,
  currentAvatarUrl?: string
): Promise<string | null> {
  console.log('uploadFighterAvatar called with:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    userId,
    fighterProfileId,
    hasCurrentAvatar: !!currentAvatarUrl
  });

  try {
    // Input validation
    if (!file) {
      console.error('No file provided');
      toast.error('Error: No se proporcionó archivo');
      return null;
    }

    if (!userId) {
      console.error('No userId provided');
      toast.error('Error: ID de usuario no válido');
      return null;
    }

    if (!fighterProfileId) {
      console.error('No fighterProfileId provided');
      toast.error('Error: ID de perfil de peleador no válido');
      return null;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.error('File too large:', file.size);
      toast.error('Error: El archivo es demasiado grande (máximo 10MB)');
      return null;
    }

    // Clean up old avatar if exists
    if (currentAvatarUrl) {
      console.log('Cleaning up old avatar:', currentAvatarUrl);
      await cleanupOldAvatar(currentAvatarUrl);
    }

    let processedFile = file;

    // Apply background removal for image files
    if (file.type.startsWith('image/')) {
      try {
        toast.info('Procesando imagen, removiendo fondo...');
        
        // Load image and remove background
        const imageElement = await loadImage(file);
        const processedBlob = await removeBackground(imageElement);
        
        // Convert blob to file
        const tempFile = new File([processedBlob], file.name, {
          type: 'image/png',
          lastModified: Date.now()
        });

        // Optimize size after background removal
        toast.info('Optimizando imagen...');
        const { resizeImage } = await import('./imageUtils');
        const optimized = await resizeImage(tempFile, {
          maxWidth: 1024,      // 1024x1024 para peleadores (más grande que avatares normales)
          maxHeight: 1024,
          quality: 0.95,       // Muy alta calidad para profesionales
          format: 'png',       // PNG para mantener transparencia
          maintainAspectRatio: true
        });

        processedFile = optimized.file;
        
        toast.success('Imagen procesada y optimizada');
      } catch (bgError) {
        console.warn('Background removal failed, using original image:', bgError);
        toast.warning('No se pudo remover el fondo, usando imagen original');
        // Continue with original file if background removal fails
      }
    }

    // Upload processed photo
    const photoFileName = `${userId}/photo-${Date.now()}.png`;
    console.log('Starting upload to storage:', photoFileName);
    
    const { error: uploadError } = await supabase.storage
      .from('fighter-photos')
      .upload(photoFileName, processedFile, {
        contentType: processedFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      toast.error(`Error subiendo foto: ${uploadError.message}`);
      return null;
    }

    console.log('Photo uploaded successfully to storage');

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('fighter-photos')
      .getPublicUrl(photoFileName);

    console.log('Generated public URL:', publicUrl.publicUrl);

    // Update fighter profile with new avatar URL
    const { error: updateError } = await supabase
      .from('fighter_profiles')
      .update({ avatar_url: publicUrl.publicUrl })
      .eq('id', fighterProfileId);

    if (updateError) {
      console.error('Error updating avatar URL:', updateError);
      toast.error(`Error actualizando perfil: ${updateError.message}`);
      return null;
    }

    console.log('Fighter profile updated successfully with new avatar URL');
    toast.success('Avatar actualizado correctamente');
    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error in uploadFighterAvatar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    toast.error(`Error procesando avatar: ${errorMessage}`);
    return null;
  }
}

async function cleanupOldAvatar(avatarUrl: string): Promise<void> {
  try {
    // Extract file path from public URL
    const urlParts = avatarUrl.split('/fighter-photos/');
    if (urlParts.length !== 2) return;
    
    const filePath = urlParts[1];
    
    // Delete old file from storage
    await supabase.storage
      .from('fighter-photos')
      .remove([filePath]);

  } catch (error) {
    console.error('Error cleaning up old avatar:', error);
    // Don't throw, this is cleanup and shouldn't block the main operation
  }
}