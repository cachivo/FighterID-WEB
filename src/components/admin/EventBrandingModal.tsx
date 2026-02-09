import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Palette, Upload, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BdgEvent } from '@/hooks/useEvents';

interface EventBranding {
  key: 'ucc' | 'hoodfights' | 'custom';
  logo_url?: string;
  watermark_url?: string;
  require_billboard_images: boolean;
}

interface EventBrandingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: BdgEvent | null;
  onSave: (eventId: string, meta: any) => Promise<void>;
}

// Default logos for predefined brands
const BRAND_LOGOS: Record<string, { logo: string; watermark: string }> = {
  ucc: {
    logo: '/lovable-uploads/ucc-logo-transparent.png',
    watermark: '/lovable-uploads/ucc-logo-transparent.png'
  },
  hoodfights: {
    logo: '/lovable-uploads/honduras-hoodfights-logo.png',
    watermark: '/lovable-uploads/honduras-hoodfights-logo.png'
  }
};

export function EventBrandingModal({ open, onOpenChange, event, onSave }: EventBrandingModalProps) {
  const [saving, setSaving] = useState(false);
  const [brandKey, setBrandKey] = useState<'ucc' | 'hoodfights' | 'custom'>('ucc');
  const [requireBillboardImages, setRequireBillboardImages] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [customWatermarkUrl, setCustomWatermarkUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);

  // Load existing branding from event meta
  useEffect(() => {
    if (event?.meta && typeof event.meta === 'object') {
      const meta = event.meta as { branding?: EventBranding };
      if (meta.branding) {
        setBrandKey(meta.branding.key || 'ucc');
        setRequireBillboardImages(meta.branding.require_billboard_images || false);
        setCustomLogoUrl(meta.branding.logo_url || '');
        setCustomWatermarkUrl(meta.branding.watermark_url || '');
      }
    } else {
      // Reset to defaults
      setBrandKey('ucc');
      setRequireBillboardImages(false);
      setCustomLogoUrl('');
      setCustomWatermarkUrl('');
    }
  }, [event]);

  // Auto-enable billboard requirement for Hoodfights
  useEffect(() => {
    if (brandKey === 'hoodfights') {
      setRequireBillboardImages(true);
    }
  }, [brandKey]);

  const handleFileUpload = async (file: File, type: 'logo' | 'watermark'): Promise<string | null> => {
    const fileName = `${Date.now()}-${type}-${Math.random().toString(36).substring(7)}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('event-fighter-images')
      .upload(`branding/${fileName}`, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('event-fighter-images')
      .getPublicUrl(`branding/${fileName}`);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!event) return;
    
    setSaving(true);
    try {
      let logoUrl = customLogoUrl;
      let watermarkUrl = customWatermarkUrl;

      // If using predefined brand, use default logos
      if (brandKey !== 'custom') {
        logoUrl = BRAND_LOGOS[brandKey]?.logo || '';
        watermarkUrl = BRAND_LOGOS[brandKey]?.watermark || '';
      }

      // Upload custom files if provided
      if (logoFile) {
        const uploadedUrl = await handleFileUpload(logoFile, 'logo');
        if (uploadedUrl) logoUrl = uploadedUrl;
      }
      if (watermarkFile) {
        const uploadedUrl = await handleFileUpload(watermarkFile, 'watermark');
        if (uploadedUrl) watermarkUrl = uploadedUrl;
      }

      const branding: EventBranding = {
        key: brandKey,
        logo_url: logoUrl,
        watermark_url: watermarkUrl,
        require_billboard_images: requireBillboardImages
      };

      const newMeta = {
        ...(typeof event.meta === 'object' ? event.meta : {}),
        branding
      };

      await onSave(event.id, newMeta);
      toast.success('Branding del evento actualizado');
      onOpenChange(false);
    } catch (error) {
      console.error('Save branding error:', error);
      toast.error('Error al guardar el branding');
    } finally {
      setSaving(false);
    }
  };

  const currentLogo = brandKey === 'custom' 
    ? (logoFile ? URL.createObjectURL(logoFile) : customLogoUrl)
    : BRAND_LOGOS[brandKey]?.logo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Branding del Evento
          </DialogTitle>
          <DialogDescription>
            Configura la marca y logos que se mostrarán en la cartelera pública
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Brand Selection */}
          <div className="space-y-2">
            <Label>Marca del Evento</Label>
            <Select value={brandKey} onValueChange={(v: 'ucc' | 'hoodfights' | 'custom') => setBrandKey(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ucc">
                  <div className="flex items-center gap-2">
                    <span>UCC (Urban Combat Championship)</span>
                  </div>
                </SelectItem>
                <SelectItem value="hoodfights">
                  <div className="flex items-center gap-2">
                    <span>Hoodfights</span>
                    <Badge variant="secondary" className="text-xs">Requiere imágenes</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logo Preview */}
          {currentLogo && (
            <div className="flex justify-center p-4 bg-black/80 rounded-lg">
              <img 
                src={currentLogo} 
                alt="Logo preview" 
                className="max-h-24 object-contain"
              />
            </div>
          )}

          {/* Custom Logo Upload (only for custom brand) */}
          {brandKey === 'custom' && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="custom-logo" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Logo Principal (PNG transparente)
                </Label>
                <input
                  id="custom-logo"
                  type="file"
                  accept="image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setLogoFile(file);
                  }}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-watermark" className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Watermark (opcional)
                </Label>
                <input
                  id="custom-watermark"
                  type="file"
                  accept="image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setWatermarkFile(file);
                  }}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground"
                />
              </div>
            </div>
          )}

          {/* Billboard Images Requirement */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Requerir imágenes de cartelera
              </Label>
              <p className="text-xs text-muted-foreground">
                Las peleas necesitarán imagen específica por peleador
              </p>
            </div>
            <Switch
              checked={requireBillboardImages}
              onCheckedChange={setRequireBillboardImages}
              disabled={brandKey === 'hoodfights'} // Always required for Hoodfights
            />
          </div>

          {requireBillboardImages && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-amber-200">
                Al crear peleas, deberás subir una imagen de cartelera para cada peleador 
                o seleccionar "Usar foto de perfil" explícitamente.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Branding'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
