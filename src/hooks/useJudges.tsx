import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Use Supabase generated types
export type Judge = Database['public']['Tables']['judges']['Row'];
export type JudgeInsert = Database['public']['Tables']['judges']['Insert'];
export type JudgeUpdate = Database['public']['Tables']['judges']['Update'];

export interface JudgeFormData {
  first_name: string;
  last_name: string;
  license_number: string;
  certification_level: 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';
  specialization: string[];
  email?: string;
  phone?: string;
  country?: string;
  organization_id?: string;
}

export function useJudges() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJudges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('judges')
        .select('*')
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setJudges(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar jueces';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createJudge = async (judgeData: JudgeFormData) => {
    try {
      // PRE-VALIDACIÓN DE LICENCIA
      console.log('[CREATE JUDGE] Verificando licencia:', judgeData.license_number);

      const { data: existingLicense, error: checkError } = await supabase
        .from('judges')
        .select('license_number, first_name, last_name, id')
        .eq('license_number', judgeData.license_number)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLicense) {
        console.log('[CREATE JUDGE] Licencia duplicada encontrada:', existingLicense);
        toast({
          title: "⚠️ Licencia Duplicada",
          description: `La licencia "${judgeData.license_number}" ya pertenece a ${existingLicense.first_name} ${existingLicense.last_name}`,
          variant: "destructive",
        });
        return false;
      }

      // Multi-module: if email matches an existing app_user, link judges.user_id
      // to that app_user.id so this judge profile becomes an additive module on
      // the same identity (fighter/gym/etc.).
      let linkedUserId: string | null = null;
      if (judgeData.email) {
        const { data: linkedAppUser } = await supabase
          .from('app_user')
          .select('id')
          .eq('email', judgeData.email)
          .maybeSingle();
        if (linkedAppUser) linkedUserId = linkedAppUser.id;
      }

      console.log('[CREATE JUDGE] Licencia disponible, creando juez...');

      const { error: insertError } = await supabase
        .from('judges')
        .insert([{ ...judgeData, ...(linkedUserId ? { user_id: linkedUserId } : {}) }]);

      if (insertError) throw insertError;

      console.log('[CREATE JUDGE] Juez creado exitosamente', { linkedUserId });

      toast({
        title: "Éxito",
        description: linkedUserId
          ? "Juez creado y vinculado a la cuenta existente"
          : "Juez creado correctamente",
      });

      await fetchJudges();
      return true;

    } catch (err) {
      console.error('[CREATE JUDGE] Error:', err);

      let errorMessage = err instanceof Error ? err.message : 'Error al crear juez';

      if (errorMessage.includes('duplicate key') || errorMessage.includes('judges_license_number_key')) {
        errorMessage = `⚠️ El número de licencia "${judgeData.license_number}" ya está en uso.`;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  };

  const updateJudge = async (id: string, judgeData: Partial<JudgeFormData>) => {
    try {
      const { error } = await supabase
        .from('judges')
        .update(judgeData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Juez actualizado correctamente",
      });

      await fetchJudges();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar juez';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleJudgeStatus = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('judges')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Juez ${active ? 'activado' : 'desactivado'} correctamente`,
      });

      await fetchJudges();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cambiar estado del juez';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const getActiveJudges = () => {
    return judges.filter(judge => judge.active);
  };

  const getJudgesBySpecialization = (specialization: string) => {
    return judges.filter(judge => 
      judge.active && judge.specialization.includes(specialization)
    );
  };

  useEffect(() => {
    fetchJudges();
  }, []);

  return {
    judges,
    loading,
    error,
    fetchJudges,
    createJudge,
    updateJudge,
    toggleJudgeStatus,
    getActiveJudges,
    getJudgesBySpecialization
  };
}

export function useCurrentJudge() {
  const [currentJudge, setCurrentJudge] = useState<Judge | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCurrentJudge = async () => {
    try {
      setLoading(true);

      // Multi-module identity: judges.user_id references app_user.id.
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;
      if (!authUser) {
        setCurrentJudge(null);
        return;
      }

      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      if (!appUser) {
        setCurrentJudge(null);
        return;
      }

      const { data, error } = await supabase
        .from('judges')
        .select('*')
        .eq('user_id', appUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentJudge(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar perfil de juez';
      console.error('Error fetching current judge:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentJudge();
  }, []);

  return {
    currentJudge,
    loading,
    fetchCurrentJudge
  };
}