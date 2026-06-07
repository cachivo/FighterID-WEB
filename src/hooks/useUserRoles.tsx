import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user' | 'judge' | 'super_admin' | 'license_officer' | 'technical_coordinator' | 'auditor' | 'promoter' | 'official_judge' | 'official_referee' | 'official_doctor' | 'official_timekeeper' | 'official_inspector' | 'gym_owner' | 'gym_coach' | 'gym_assistant';

interface UserRoleData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: AppRole[];
  created_at: string;
}

interface UseUserRolesReturn {
  users: UserRoleData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserRoles(): UseUserRolesReturn {
  const [users, setUsers] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all app users
      const { data: appUsers, error: usersError } = await supabase
        .from('app_user')
        .select('id, email, first_name, last_name, created_at, auth_user_id')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine user data with their roles.
      // Legacy accounts may have null auth_user_id — fall back to app_user.id so the row still renders.
      const usersWithRoles: UserRoleData[] = (appUsers || []).map(user => {
        const effectiveUserId = user.auth_user_id || user.id;
        const roles = (userRoles || [])
          .filter(ur => ur.user_id === user.auth_user_id)
          .map(ur => ur.role as AppRole);

        return {
          id: effectiveUserId,
          email: user.email || '',
          first_name: user.first_name,
          last_name: user.last_name,
          roles,
          created_at: user.created_at || ''
        };
      });

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users and roles:', err);
      setError('Error al cargar usuarios y roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Subscribe to changes in user_roles table
    const subscription = supabase
      .channel('user_roles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  };
}
