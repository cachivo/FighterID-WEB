import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export type AppRole =
  | 'admin' | 'super_admin' | 'moderator' | 'user'
  | 'gym_owner' | 'gym_coach' | 'gym_assistant'
  | 'official_judge' | 'official_referee' | 'official_doctor'
  | 'official_timekeeper' | 'official_inspector'
  | 'license_officer' | 'technical_coordinator'
  | 'auditor' | 'promoter' | 'judge';

/**
 * Unified hook combining useUserRole + useAdmin + useSuperAdmin into a single
 * permissions API. Use this for all new code.
 */
export function useUserPermissions() {
  const { user, loading: authLoading } = useAuth();

  const rolesQuery = useQuery({
    queryKey: ['user-roles', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);

      if (error) {
        console.error('[useUserPermissions] Error fetching roles:', error);
        return [] as AppRole[];
      }
      return (data || []).map((r: { role: string }) => r.role as AppRole);
    },
    staleTime: 5 * 60 * 1000,
  });

  const roles = rolesQuery.data || [];
  const roleSet = useMemo(() => new Set(roles), [roles]);

  return {
    roles,
    isAdmin: roleSet.has('admin') || roleSet.has('super_admin'),
    isSuperAdmin: roleSet.has('super_admin'),
    isModerator: roleSet.has('moderator'),
    isGymOwner: roleSet.has('gym_owner'),
    isJudge: roleSet.has('judge') || roleSet.has('official_judge'),
    hasRole: (role: AppRole) => roleSet.has(role),
    hasAnyRole: (checkRoles: AppRole[]) => checkRoles.some(r => roleSet.has(r)),
    loading: authLoading || rolesQuery.isLoading,
    error: rolesQuery.error?.message || null,
  };
}
