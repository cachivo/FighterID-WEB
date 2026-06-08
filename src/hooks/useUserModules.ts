import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { AppUserRecord } from '@/lib/ensureAppUser';

export type ModuleStatus = 'none' | 'pending' | 'active' | 'suspended';

export interface UserModulesState {
  appUser: AppUserRecord | null;
  modules: {
    fighter: { status: ModuleStatus; profileId?: string; licenseStatus?: string };
    trainer: { status: ModuleStatus; gymId?: string };
    gymOwner: { status: ModuleStatus; gymId?: string };
    judge: { status: ModuleStatus; judgeId?: string };
  };
}

const EMPTY_STATE: UserModulesState = {
  appUser: null,
  modules: {
    fighter: { status: 'none' },
    trainer: { status: 'none' },
    gymOwner: { status: 'none' },
    judge: { status: 'none' },
  },
};

/**
 * Single source of truth for "which modules does the current user have".
 * Replaces ad-hoc 4-query lookups scattered across ProfileHub and each
 * onboarding page. Supports the multi-module-per-email architecture:
 * one app_user can simultaneously hold fighter + trainer + gymOwner + judge.
 */
export function useUserModules() {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ['user-modules', user?.id],
    enabled: !!user && !authLoading,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<UserModulesState> => {
      if (!user) return EMPTY_STATE;

      const { data: appUser } = await supabase
        .from('app_user')
        .select('id, auth_user_id, email, first_name, last_name, phone, handle, country, birth_date, gender')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!appUser) return EMPTY_STATE;

      // Fighter (via fighter_profiles + most recent license)
      const fighterPromise = (async () => {
        const { data: profile } = await supabase
          .from('fighter_profiles')
          .select('id')
          .eq('user_id', appUser.id)
          .eq('active', true)
          .maybeSingle();
        if (!profile) return { status: 'none' as ModuleStatus };

        const { data: licenses } = await supabase
          .from('fighter_licenses')
          .select('status, is_primary, created_at')
          .eq('fighter_id', profile.id)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1);

        const license = licenses?.[0];
        if (!license) return { status: 'pending' as ModuleStatus, profileId: profile.id };
        const status: ModuleStatus =
          license.status === 'ACTIVE' ? 'active'
          : license.status === 'SUSPENDED' || license.status === 'REVOKED' ? 'suspended'
          : 'pending';
        return { status, profileId: profile.id, licenseStatus: license.status };
      })();

      // Gym staff (covers trainer + owner via role)
      const staffPromise = supabase
        .from('gym_staff')
        .select('gym_id, role, active')
        .eq('user_id', appUser.id)
        .eq('active', true);

      // Judge
      const judgePromise = supabase
        .from('judges')
        .select('id, active')
        .eq('user_id', appUser.id)
        .maybeSingle();

      const [fighter, staffRes, judgeRes] = await Promise.all([
        fighterPromise,
        staffPromise,
        judgePromise,
      ]);

      const staff = (staffRes.data || []) as Array<{ gym_id: string; role: string; active: boolean }>;
      const ownerRow = staff.find((s) => s.role === 'OWNER');
      const trainerRow = staff.find((s) => s.role !== 'OWNER') || (!ownerRow ? staff[0] : undefined);

      const judge = judgeRes.data as { id: string; active: boolean } | null;

      return {
        appUser: appUser as AppUserRecord,
        modules: {
          fighter,
          trainer: trainerRow
            ? { status: 'active', gymId: trainerRow.gym_id }
            : { status: 'none' },
          gymOwner: ownerRow
            ? { status: 'active', gymId: ownerRow.gym_id }
            : { status: 'none' },
          judge: judge
            ? { status: judge.active ? 'active' : 'pending', judgeId: judge.id }
            : { status: 'none' },
        },
      };
    },
  });

  return {
    ...(query.data ?? EMPTY_STATE),
    loading: authLoading || query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
}
