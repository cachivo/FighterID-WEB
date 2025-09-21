import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DetailedFighterData {
  profile: any;
  licenses: any[];
  documents: any[];
  medicalCertifications: any[];
  statusUpdates: any[];
  changeRequests: any[];
}

export const useDetailedFighterData = () => {
  const [data, setData] = useState<DetailedFighterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetailedData = useCallback(async (fighterId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Obtener perfil principal
      const { data: profile, error: profileError } = await supabase
        .from('fighter_profiles')
        .select(`
          *,
          app_user (
            email,
            phone,
            country,
            handle
          )
        `)
        .eq('id', fighterId)
        .single();

      if (profileError) throw profileError;

      // Obtener licencias
      const { data: licenses, error: licensesError } = await supabase
        .from('fighter_licenses')
        .select(`
          *,
          organizations (
            name,
            country,
            short_code
          )
        `)
        .eq('fighter_id', fighterId)
        .order('created_at', { ascending: false });

      if (licensesError) throw licensesError;

      // Obtener documentos
      const { data: documents, error: documentsError } = await supabase
        .from('license_documents')
        .select('*')
        .in('license_id', (licenses || []).map(l => l.id))
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      // Obtener certificaciones médicas
      const { data: medicalCertifications, error: medicalError } = await supabase
        .from('medical_certifications')
        .select('*')
        .in('license_id', (licenses || []).map(l => l.id))
        .order('created_at', { ascending: false });

      if (medicalError) throw medicalError;

      // Obtener actualizaciones de estado
      const { data: statusUpdates, error: statusError } = await supabase
        .from('fighter_status_updates')
        .select('*')
        .eq('fighter_id', fighterId)
        .order('created_at', { ascending: false });

      if (statusError) throw statusError;

      // Obtener solicitudes de cambio
      const { data: changeRequests, error: changeError } = await supabase
        .from('profile_change_requests')
        .select('*')
        .eq('fighter_profile_id', fighterId)
        .order('created_at', { ascending: false });

      if (changeError) throw changeError;

      setData({
        profile: profile || null,
        licenses: licenses || [],
        documents: documents || [],
        medicalCertifications: medicalCertifications || [],
        statusUpdates: statusUpdates || [],
        changeRequests: changeRequests || []
      });

    } catch (err) {
      console.error('Error fetching detailed fighter data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    fetchDetailedData,
    clearData
  };
};