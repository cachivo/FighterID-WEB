import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSystemStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const [eventosDeportivos, eventosDigitales, estadisticas] = await Promise.all([
        supabase.from('eventos_deportivos').select('id').eq('activo', true),
        supabase.from('eventos_digitales').select('id').eq('activo', true),
        supabase.from('estadisticas').select('id').eq('activo', true)
      ]);

      return {
        eventosDeportivos: eventosDeportivos.data?.length || 0,
        eventosDigitales: eventosDigitales.data?.length || 0,
        estadisticas: estadisticas.data?.length || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  return { stats, isLoading };
}