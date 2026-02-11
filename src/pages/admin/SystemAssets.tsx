import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSystemAssets } from '@/hooks/useSystemAssets';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Image, Loader2 } from 'lucide-react';

const ASSET_CONFIG = [
  { key: 'system_logo_url', label: 'Logo Principal', description: 'Logo que aparece en el Header y Footer' },
  { key: 'system_ranking_bg_url', label: 'Fondo del Ranking', description: 'Imagen de fondo de la sección de ranking' },
  { key: 'system_ucc_logo_url', label: 'Logo UCC', description: 'Logo de la organización UCC' },
  { key: 'system_hoodfights_logo_url', label: 'Logo Hoodfights', description: 'Logo de Honduras Hoodfights' },
  { key: 'system_octagon_bg_url', label: 'Fondo Octágono', description: 'Fondo para perfiles y secciones' },
];

export default function SystemAssets() {
  const { logoUrl, rankingBgUrl, uccLogoUrl, hoodfightsLogoUrl, octagonBgUrl } = useSystemAssets();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);

  const currentValues: Record<string, string> = {
    system_logo_url: logoUrl,
    system_ranking_bg_url: rankingBgUrl,
    system_ucc_logo_url: uccLogoUrl,
    system_hoodfights_logo_url: hoodfightsLogoUrl,
    system_octagon_bg_url: octagonBgUrl,
  };

  const handleUpload = async (key: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(key);
      try {
        const ext = file.name.split('.').pop();
        const filePath = `${key}.${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('system-assets')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('system-assets')
          .getPublicUrl(filePath);

        // Update configuracion_sitio
        const { error: updateError } = await supabase
          .from('configuracion_sitio')
          .update({ valor: urlData.publicUrl, updated_at: new Date().toISOString() })
          .eq('clave', key);

        if (updateError) throw updateError;

        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ['system-assets'] });
        toast.success('Imagen actualizada correctamente');
      } catch (err: any) {
        console.error('Upload error:', err);
        toast.error(err.message || 'Error al subir imagen');
      } finally {
        setUploading(null);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Assets del Sistema</h1>
        <p className="text-muted-foreground">Actualiza los logos, fondos e imágenes del sistema. Solo la cuenta maestra puede modificar estos valores.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ASSET_CONFIG.map((asset) => (
          <Card key={asset.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{asset.label}</CardTitle>
              <p className="text-xs text-muted-foreground">{asset.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden flex items-center justify-center border">
                {currentValues[asset.key] ? (
                  <img
                    src={currentValues[asset.key]}
                    alt={asset.label}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Image className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading === asset.key}
                onClick={() => handleUpload(asset.key)}
              >
                {uploading === asset.key ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Cambiar Imagen</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
