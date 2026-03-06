import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 
  | 'admin' | 'super_admin' | 'moderator' | 'user'
  | 'gym_owner' | 'gym_coach' | 'gym_assistant'
  | 'official_judge' | 'official_referee' | 'official_doctor'
  | 'official_timekeeper' | 'official_inspector'
  | 'license_officer' | 'technical_coordinator'
  | 'auditor' | 'promoter' | 'judge';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_at: string;
  assigned_by: string | null;
}

interface UseUserRoleReturn {
  roles: AppRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  isUser: boolean;
  isGymOwner: boolean;
  isJudge: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRoles = async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (queryError) {
        console.error('Error fetching user roles:', queryError);
        setError('Error al obtener roles de usuario');
        setRoles([]);
      } else {
        const userRoles = (data || []).map(r => r.role as AppRole);
        setRoles(userRoles);
      }
    } catch (err) {
      console.error('Error in fetchUserRoles:', err);
      setError('Error al obtener roles de usuario');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    fetchUserRoles();
  }, [user, authLoading]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: AppRole[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  };

  return {
    roles,
    isAdmin: hasRole('admin') || hasRole('super_admin'),
    isSuperAdmin: hasRole('super_admin'),
    isModerator: hasRole('moderator'),
    isUser: hasRole('user'),
    isGymOwner: hasRole('gym_owner'),
    isJudge: hasRole('official_judge') || hasRole('judge'),
    hasRole,
    hasAnyRole,
    loading: loading || authLoading,
    error,
    refetch: fetchUserRoles,
  };
}
