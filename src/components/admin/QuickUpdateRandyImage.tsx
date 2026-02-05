import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export const QuickUpdateRandyImage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const updateRandyImage = async () => {
    setLoading(true);
    try {
      const newImageUrl = `https://eeshomcqztvjkvycdfwi.supabase.co/storage/v1/object/public/lovable-uploads/randy-tercero-new.jpg?t=${Date.now()}`;
      
      // Actualizar imagen de Randy en external_fighters
      const { error } = await supabase
        .from('external_fighters')
        .update({ 
          image_url: newImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'cadb0704-7e4e-4033-8efd-1bc5aacf233d');

      if (error) throw error;

      // Forzar actualización del fight para refrescar cache
      await supabase
        .from('fights')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', 'ee7851bd-e53f-4ef6-a0d8-d5dec4920986');

      toast({
        title: 'Imagen de Randy actualizada',
        description: 'Recarga la página del evento (F5) para ver el cambio',
      });
      
      // Esperar 1 segundo y recargar la página automáticamente
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la imagen',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-amber-500/10 border-amber-500/20">
      <h4 className="font-semibold mb-2 flex items-center gap-2">
        🔧 Actualización rápida - Randy Tercero
      </h4>
      <p className="text-sm text-muted-foreground mb-3">
        Actualiza la imagen de Randy con la nueva foto que subiste
      </p>
      <Button 
        onClick={updateRandyImage} 
        disabled={loading}
        size="sm"
        className="bg-amber-600 hover:bg-amber-700"
      >
        {loading ? 'Actualizando...' : '🖼️ Actualizar Imagen de Randy'}
      </Button>
    </div>
  );
};
