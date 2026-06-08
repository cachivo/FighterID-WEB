import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type OfficialType = 'judge' | 'referee' | 'doctor' | 'timekeeper' | 'inspector';
export type CertificationLevel = 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';

export interface Official {
  id: string;
  user_id: string | null;
  official_type: OfficialType;
  certification_level: CertificationLevel;
  first_name: string;
  last_name: string;
  document_id: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  license_number: string | null;
  certified_by: string | null;
  certification_date: string | null;
  certification_expires: string | null;
  specialization: string[];
  total_events_worked: number;
  total_fights_worked: number;
  average_rating: number;
  active: boolean;
  available: boolean;
  suspended: boolean;
  legacy_judge_id: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfficialCertification {
  id: string;
  official_id: string;
  discipline: string;
  certification_type: string;
  issuing_body: string;
  issue_date: string;
  expiry_date: string | null;
  document_url: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficialFormData {
  official_type: OfficialType;
  certification_level: CertificationLevel;
  first_name: string;
  last_name: string;
  document_id?: string;
  photo_url?: string;
  email?: string;
  phone?: string;
  country?: string;
  license_number?: string;
  certified_by?: string;
  certification_date?: string;
  certification_expires?: string;
  specialization: string[];
}

export function useOfficials() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOfficials = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('officials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOfficials((data || []) as unknown as Official[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar oficiales';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createOfficial = async (data: OfficialFormData): Promise<boolean> => {
    try {
      if (data.license_number) {
        const { data: existing } = await supabase
          .from('officials')
          .select('id, first_name, last_name')
          .eq('license_number', data.license_number)
          .maybeSingle();

        if (existing) {
          toast({
            title: '⚠️ Licencia Duplicada',
            description: `La licencia "${data.license_number}" ya pertenece a ${(existing as any).first_name} ${(existing as any).last_name}`,
            variant: 'destructive',
          });
          return false;
        }
      }

      // Multi-module: link officials.user_id to an existing app_user when
      // the email matches, so the same identity can stack modules.
      let linkedUserId: string | null = null;
      if (data.email) {
        const { data: linkedAppUser } = await supabase
          .from('app_user')
          .select('id')
          .eq('email', data.email)
          .maybeSingle();
        if (linkedAppUser) linkedUserId = linkedAppUser.id;
      }

      const { error } = await supabase
        .from('officials')
        .insert([{ ...data, ...(linkedUserId ? { user_id: linkedUserId } : {}) }]);
      if (error) throw error;

      toast({
        title: 'Éxito',
        description: linkedUserId
          ? 'Oficial creado y vinculado a la cuenta existente'
          : 'Oficial creado correctamente',
      });
      await fetchOfficials();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear oficial';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  const updateOfficial = async (id: string, data: Partial<OfficialFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase.from('officials').update(data).eq('id', id);
      if (error) throw error;

      toast({ title: 'Éxito', description: 'Oficial actualizado correctamente' });
      await fetchOfficials();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar oficial';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  const toggleOfficialStatus = async (id: string, active: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase.from('officials').update({ active }).eq('id', id);
      if (error) throw error;

      toast({ title: 'Éxito', description: `Oficial ${active ? 'activado' : 'desactivado'} correctamente` });
      await fetchOfficials();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  const deleteOfficial = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('officials').delete().eq('id', id);
      if (error) throw error;

      toast({ title: 'Éxito', description: 'Oficial eliminado correctamente' });
      await fetchOfficials();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar oficial';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    fetchOfficials();
  }, [fetchOfficials]);

  return {
    officials,
    loading,
    error,
    fetchOfficials,
    createOfficial,
    updateOfficial,
    toggleOfficialStatus,
    deleteOfficial,
  };
}

export function useOfficialCertifications(officialId: string | null) {
  const [certifications, setCertifications] = useState<OfficialCertification[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCertifications = useCallback(async () => {
    if (!officialId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('official_certifications')
        .select('*')
        .eq('official_id', officialId)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setCertifications((data || []) as unknown as OfficialCertification[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar certificaciones';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [officialId, toast]);

  useEffect(() => {
    fetchCertifications();
  }, [fetchCertifications]);

  return { certifications, loading, fetchCertifications };
}
