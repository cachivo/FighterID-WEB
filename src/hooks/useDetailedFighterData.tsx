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
    console.log('Fetching detailed data for fighter:', fighterId);
    setLoading(true);
    setError(null);

    try {
      // Obtener perfil principal
      console.log('Fetching fighter profile...');
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
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }
      if (!profile) {
        throw new Error('Fighter not found');
      }
      console.log('Profile fetched:', profile);

      // Obtener licencias
      console.log('Fetching licenses...');
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

      if (licensesError) {
        console.error('Licenses error:', licensesError);
        throw licensesError;
      }
      console.log('Licenses fetched:', licenses);

      // Obtener documentos - solo si hay licencias
      let documents = [];
      if (licenses && licenses.length > 0) {
        console.log('Fetching documents...');
        const licenseIds = licenses.map(l => l.id);
        const { data: documentsData, error: documentsError } = await supabase
          .from('license_documents')
          .select('*')
          .in('license_id', licenseIds)
          .order('created_at', { ascending: false });

        if (documentsError) {
          console.error('Documents error:', documentsError);
          throw documentsError;
        }
        documents = documentsData || [];
        console.log('Documents fetched:', documents);
      } else {
        console.log('No licenses found, skipping documents');
      }

      // Obtener certificaciones médicas - solo si hay licencias
      let medicalCertifications = [];
      if (licenses && licenses.length > 0) {
        console.log('Fetching medical certifications...');
        const licenseIds = licenses.map(l => l.id);
        const { data: medicalData, error: medicalError } = await supabase
          .from('medical_certifications')
          .select('*')
          .in('license_id', licenseIds)
          .order('created_at', { ascending: false });

        if (medicalError) {
          console.error('Medical certifications error:', medicalError);
          throw medicalError;
        }
        medicalCertifications = medicalData || [];
        console.log('Medical certifications fetched:', medicalCertifications);
      } else {
        console.log('No licenses found, skipping medical certifications');
      }

      // Obtener actualizaciones de estado
      console.log('Fetching status updates...');
      const { data: statusUpdates, error: statusError } = await supabase
        .from('fighter_status_updates')
        .select('*')
        .eq('fighter_id', fighterId)
        .order('created_at', { ascending: false });

      if (statusError) {
        console.error('Status updates error:', statusError);
        throw statusError;
      }
      console.log('Status updates fetched:', statusUpdates);

      // Obtener solicitudes de cambio
      console.log('Fetching change requests...');
      const { data: changeRequests, error: changeError } = await supabase
        .from('profile_change_requests')
        .select('*')
        .eq('fighter_profile_id', fighterId)
        .order('created_at', { ascending: false });

      if (changeError) {
        console.error('Change requests error:', changeError);
        throw changeError;
      }
      console.log('Change requests fetched:', changeRequests);

      const finalData = {
        profile: profile || null,
        licenses: licenses || [],
        documents: documents || [],
        medicalCertifications: medicalCertifications || [],
        statusUpdates: statusUpdates || [],
        changeRequests: changeRequests || []
      };

      console.log('Final data assembled:', finalData);
      setData(finalData);

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