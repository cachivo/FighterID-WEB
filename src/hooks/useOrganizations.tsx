import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Organization {
  id: string;
  code: string;
  name: string;
  short_name: string;
  discipline: string;
  allowed_levels: string[];
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  slug: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  can_create_events: boolean;
  can_sanction_fights: boolean;
  verified: boolean;
  website: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationFormData {
  code: string;
  name: string;
  short_name: string;
  discipline: string;
  allowed_levels: string[];
  description?: string;
  logo_url?: string;
  slug?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  can_create_events?: boolean;
  can_sanction_fights?: boolean;
  website?: string;
  country?: string;
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ranking_organizations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setOrganizations((data || []) as unknown as Organization[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar organizaciones';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrganization = async (data: OrganizationFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from('ranking_organizations').insert([data]);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Organización creada correctamente' });
      await fetchOrganizations();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear organización';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  const updateOrganization = async (id: string, data: Partial<OrganizationFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase.from('ranking_organizations').update(data).eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Organización actualizada correctamente' });
      await fetchOrganizations();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar organización';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  const toggleOrganizationActive = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase.from('ranking_organizations').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: `Organización ${isActive ? 'activada' : 'desactivada'}` });
      await fetchOrganizations();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  const verifyOrganization = async (id: string, verified: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase.from('ranking_organizations').update({ verified }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: `Organización ${verified ? 'verificada' : 'desverificada'}` });
      await fetchOrganizations();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al verificar organización';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    loading,
    error,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    toggleOrganizationActive,
    verifyOrganization,
  };
}
