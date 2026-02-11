import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FALLBACKS: Record<string, string> = {
  system_logo_url: '/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png',
  system_ranking_bg_url: '/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png',
  system_ucc_logo_url: '/lovable-uploads/ucc-logo-transparent.png',
  system_hoodfights_logo_url: '/lovable-uploads/honduras-hoodfights-logo.png',
  system_octagon_bg_url: '/lovable-uploads/octagon-background.png',
};

export function useSystemAssets() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-assets'],
    queryFn: async () => {
      const { data } = await supabase
        .from('configuracion_sitio')
        .select('clave, valor')
        .like('clave', 'system_%');
      
      const map: Record<string, string> = {};
      data?.forEach(row => { map[row.clave] = row.valor; });
      return map;
    },
    staleTime: 30 * 60 * 1000, // 30 min
    gcTime: 60 * 60 * 1000,
  });

  const get = (key: string) => data?.[key] || FALLBACKS[key] || '';

  return {
    logoUrl: get('system_logo_url'),
    rankingBgUrl: get('system_ranking_bg_url'),
    uccLogoUrl: get('system_ucc_logo_url'),
    hoodfightsLogoUrl: get('system_hoodfights_logo_url'),
    octagonBgUrl: get('system_octagon_bg_url'),
    isLoading,
  };
}
