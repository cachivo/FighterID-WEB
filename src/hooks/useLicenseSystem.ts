import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useLicenseData(licenseId: string | null) {
  const enabled = !!licenseId;
  const qc = useQueryClient();

  const license = useQuery({
    queryKey: ['license', licenseId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fighter_licenses')
        .select(`
          *,
          fighter_profiles!fighter_licenses_fighter_id_fkey(
            first_name,
            last_name,
            nickname,
            country,
            weight_class,
            avatar_url,
            record_wins,
            record_losses,
            record_draws
          ),
          organizations(name, short_code)
        `)
        .eq('id', licenseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const medicalCerts = useQuery({
    queryKey: ['medical-certs', licenseId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_certifications')
        .select('*')
        .eq('license_id', licenseId)
        .order('expires_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const fightBookings = useQuery({
    queryKey: ['fight-bookings', licenseId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fight_bookings')
        .select(`
          *,
          opponent:fighter_licenses!fight_bookings_opponent_license_id_fkey(
            license_number,
            fighter_profiles!fighter_licenses_fighter_id_fkey(first_name, last_name, nickname)
          )
        `)
        .eq('license_id', licenseId)
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const auditLog = useQuery({
    queryKey: ['audit-log', licenseId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('license_audit_log')
        .select('*')
        .eq('license_id', licenseId)
        .order('performed_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  const generateQRToken = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_license_qr_token', {
        p_license_id: licenseId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['license', licenseId] });
    }
  });

  return {
    license,
    medicalCerts,
    fightBookings,
    auditLog,
    generateQRToken
  };
}

export function useAdminLicenseActions() {
  const qc = useQueryClient();

  const approveLicense = useMutation({
    mutationFn: async ({ licenseId, level }: { licenseId: string; level: 'AMATEUR' | 'SEMI_PRO' | 'PROFESSIONAL' | 'SUSPENDED' | 'RETIRED' }) => {
      const { error } = await supabase.rpc('approve_license', {
        p_license_id: licenseId,
        p_level: level
      });
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      // Invalidate local caches
      qc.invalidateQueries({ queryKey: ['license', variables.licenseId] });
      qc.invalidateQueries({ queryKey: ['pending-licenses'] });
      qc.invalidateQueries({ queryKey: ['admin_licenses'] });
      
      // BROADCAST: Notify the user that their license was approved (NEW)
      // This allows instant UI updates without page refresh
      try {
        await supabase.channel('license-approvals-broadcast').send({
          type: 'broadcast',
          event: 'license-approved',
          payload: { licenseId: variables.licenseId }
        });
        console.log('[BROADCAST] License approval notification sent for:', variables.licenseId);
      } catch (broadcastError) {
        console.warn('[BROADCAST] Failed to send approval notification:', broadcastError);
        // Don't throw - this is a nice-to-have, not critical
      }
    }
  });

  const suspendLicense = useMutation({
    mutationFn: async ({ 
      licenseId, 
      reason, 
      until 
    }: { 
      licenseId: string; 
      reason: string; 
      until?: string 
    }) => {
      const { error } = await supabase.rpc('suspend_license', {
        p_license_id: licenseId,
        p_reason: reason,
        p_until: until || null
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['license', variables.licenseId] });
    }
  });

  const addMedicalCert = useMutation({
    mutationFn: async (payload: {
      license_id: string;
      certification_type: 'ANNUAL' | 'PRE_FIGHT' | 'POST_INJURY';
      expires_date: string;
      issued_by: string;
      medical_number?: string;
      cleared?: boolean;
      restrictions?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('medical_certifications')
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['medical-certs', variables.license_id] });
    }
  });

  const createFightBooking = useMutation({
    mutationFn: async (payload: {
      license_id: string;
      event_name: string;
      scheduled_date: string;
      weight_class: string;
      opponent_license_id?: string;
      fight_type?: string;
      venue?: string;
      promoter?: string;
    }) => {
      const { error } = await supabase
        .from('fight_bookings')
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['fight-bookings', variables.license_id] });
    }
  });

  return {
    approveLicense,
    suspendLicense,
    addMedicalCert,
    createFightBooking
  };
}

export function usePendingLicenses() {
  return useQuery({
    queryKey: ['pending-licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fighter_licenses')
        .select(`
          *,
          fighter_profiles!fighter_licenses_fighter_id_fkey(
            first_name,
            last_name,
            nickname,
            country,
            weight_class,
            avatar_url
          )
        `)
        .eq('status', 'PENDING_REVIEW')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10_000,
  });
}

export function useVerifyLicense(token: string | null) {
  const enabled = !!token;

  return useQuery({
    queryKey: ['verify-license', token],
    enabled,
    queryFn: async () => {
      const { data: tokenData, error: tokenError } = await supabase
        .from('license_verification_tokens')
        .select(`
          license_id,
          expires_at,
          fighter_licenses!inner(
            *,
            fighter_profiles!fighter_licenses_fighter_id_fkey(
              first_name,
              last_name,
              nickname,
              country,
              weight_class,
              avatar_url,
              record_wins,
              record_losses,
              record_draws
            )
          )
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (tokenError) throw tokenError;
      return tokenData;
    },
    staleTime: 0, // Always fresh for verification
    retry: false
  });
}