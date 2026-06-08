import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { classifyChanges } from '@/lib/constants/fieldApprovalRules';

export interface ProfileChangeRequest {
  id: string;
  user_id: string;
  fighter_profile_id: string;
  requested_changes: any;
  status: string;
  admin_notes?: string;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  updated_at: string;
  fighter_profiles?: {
    first_name: string;
    last_name: string;
    user_id?: string;
  };
  app_user?: {
    email: string;
  };
}

export interface ChangeRequestAudit {
  id: string;
  request_id: string;
  action: string;
  old_status?: string;
  new_status?: string;
  notes?: string;
  performed_by?: string;
  performed_at: string;
}

export interface ChangeRequestResult {
  autoApplied: Record<string, any>;
  pendingApproval: Record<string, any>;
  hasAutoApplied: boolean;
  hasPendingApproval: boolean;
}

export function useProfileChangeRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRequests = async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profile_change_requests')
        .select(`
          *,
          fighter_profiles!inner (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching change requests:', fetchError);
        setError('Error al cargar las solicitudes');
        return;
      }

      setRequests(data || []);
    } catch (err) {
      console.error('Error in fetchUserRequests:', err);
      setError('Error inesperado al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Creates a change request with selective auto-approval
   * - Safe fields (bio, nickname, etc.) are applied immediately
   * - Sensitive fields (record, identity, etc.) require admin approval
   */
  const createChangeRequest = async (
    fighterProfileId: string, 
    requestedChanges: any
  ): Promise<ChangeRequestResult> => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // ARQUITECTURA: Usar app_user.id (no auth.uid()) para FK consistency
      const { data: appUser, error: userError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id).maybeSingle();

      if (userError || !appUser) {
        throw new Error('Usuario no encontrado');
      }

      // Classify changes into auto-approve vs requires-approval
      const { autoApprove, requiresApproval, hasAutoApprove, hasRequiresApproval } = 
        classifyChanges(requestedChanges);

      // 1. Auto-apply safe fields immediately using the admin RPC
      if (hasAutoApprove) {
        const { error: autoApplyError } = await supabase.rpc('admin_update_fighter_profile', {
          p_fighter_id: fighterProfileId,
          p_profile_data: autoApprove
        });

        if (autoApplyError) {
          console.error('Error auto-applying safe fields:', autoApplyError);
          // Don't throw - continue to create pending request for sensitive fields
          toast({
            title: "Advertencia",
            description: "Algunos cambios no pudieron aplicarse automáticamente.",
            variant: "destructive",
          });
        }
      }

      // 2. Create pending request ONLY if there are sensitive fields
      if (hasRequiresApproval) {
        const { error: insertError } = await supabase
          .from('profile_change_requests')
          .insert({
            user_id: appUser.id,
            fighter_profile_id: fighterProfileId,
            requested_changes: requiresApproval,
            status: 'PENDING'
          });

        if (insertError) {
          console.error('Error creating change request:', insertError);
          throw new Error('Error al crear la solicitud de cambio');
        }
      }

      // Build appropriate toast message
      if (hasAutoApprove && hasRequiresApproval) {
        toast({
          title: "Cambios procesados",
          description: "Algunos cambios se aplicaron inmediatamente. Otros requieren aprobación administrativa.",
        });
      } else if (hasAutoApprove) {
        toast({
          title: "Cambios aplicados",
          description: "Todos los cambios han sido aplicados a tu perfil.",
        });
      } else if (hasRequiresApproval) {
        toast({
          title: "Solicitud enviada",
          description: "Tu solicitud de cambio ha sido enviada para revisión administrativa.",
        });
      }

      await fetchUserRequests();
      
      return {
        autoApplied: autoApprove,
        pendingApproval: requiresApproval,
        hasAutoApplied: hasAutoApprove,
        hasPendingApproval: hasRequiresApproval
      };
    } catch (err) {
      console.error('Error in createChangeRequest:', err);
      throw err;
    }
  };

  // Admin functions
  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profile_change_requests')
        .select(`
          *,
          fighter_profiles!inner (
            first_name,
            last_name,
            user_id
          ),
          app_user!profile_change_requests_reviewed_by_fkey (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching all change requests:', fetchError);
        setError('Error al cargar las solicitudes');
        return;
      }

      setRequests(data || []);
    } catch (err) {
      console.error('Error in fetchAllRequests:', err);
      setError('Error inesperado al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    requestId: string, 
    status: string, 
    adminNotes?: string
  ) => {
    try {
      setLoading(true);
      
      // Get the request data first
      const { data: requestData, error: fetchError } = await supabase
        .from('profile_change_requests')
        .select('fighter_profile_id, requested_changes')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // ARQUITECTURA: Obtener app_user.id del admin actual (no auth.uid())
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: appUser, error: appUserError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', userData.user.id).maybeSingle();

      if (appUserError) throw appUserError;

      // Update the request status
      const { error } = await supabase
        .from('profile_change_requests')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: appUser.id
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, apply the changes using the correct RPC function
      if (status === 'APPROVED') {
        const { error: rpcError } = await supabase.rpc('admin_update_fighter_profile', {
          p_fighter_id: requestData.fighter_profile_id,
          p_profile_data: requestData.requested_changes
        });

        if (rpcError) {
          console.error('RPC Error:', rpcError);
          throw new Error(`Error aplicando cambios: ${rpcError.message}`);
        }

        // Mark as applied
        await supabase
          .from('profile_change_requests')
          .update({ status: 'APPLIED' })
          .eq('id', requestId);

        toast({
          title: "Solicitud aprobada y aplicada",
          description: "Los cambios han sido aplicados al perfil del peleador.",
        });
      } else {
        toast({
          title: "Solicitud actualizada",
          description: `La solicitud ha sido ${status === 'REJECTED' ? 'rechazada' : 'marcada como requiere información'}.`,
        });
      }

      await fetchAllRequests(); // Refresh the list
    } catch (err: any) {
      console.error('Error in updateRequestStatus:', err);
      toast({
        title: "Error",
        description: `No se pudo actualizar la solicitud: ${err.message}`,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const applyProfileChanges = async (fighterProfileId: string, changes: any) => {
    try {
      // ARQUITECTURA: Verificar app_user.id del admin (no auth.uid())
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user?.id).maybeSingle();

      if (!appUser) {
        throw new Error('Usuario admin no encontrado');
      }

      // Use the admin update function
      const { error } = await supabase.rpc('admin_update_fighter_profile', {
        p_fighter_id: fighterProfileId,
        p_profile_data: changes
      });

      if (error) {
        console.error('Error applying profile changes:', error);
        throw new Error('Error al aplicar los cambios al perfil');
      }
    } catch (err) {
      console.error('Error in applyProfileChanges:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, [user]);

  return {
    requests,
    loading,
    error,
    fetchUserRequests,
    createChangeRequest,
    fetchAllRequests,
    updateRequestStatus
  };
}