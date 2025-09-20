import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface LicenseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasActiveLicense: boolean;
  licenseData: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshLicense: () => Promise<void>;
}

const LicenseAuthContext = createContext<LicenseAuthContextType | undefined>(undefined);

export const LicenseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveLicense, setHasActiveLicense] = useState(false);
  const [licenseData, setLicenseData] = useState<any>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const checkLicenseStatus = async (userId: string) => {
    try {
      console.log('Checking license status for user:', userId);

      // Step 1: Check/create app_user
      let { data: userData, error: userError } = await supabase
        .from('app_user')
        .select('id, email, is_admin')
        .eq('auth_user_id', userId)
        .maybeSingle();

      // If no app_user exists, create one automatically
      if (!userData && (userError?.code === 'PGRST116' || !userError)) {
        console.log('Creating new app_user for:', userId);
        
        // Get user email from auth
        const { data: authUser } = await supabase.auth.getUser();
        
        const { data: newUser, error: createError } = await supabase
          .from('app_user')
          .insert([{
            auth_user_id: userId,
            email: authUser.user?.email || '',
            handle: authUser.user?.email?.split('@')[0] || `user_${Date.now()}`,
            is_admin: false
          }])
          .select('id, email, is_admin')
          .single();

        if (createError) {
          console.error('Error creating app user:', createError.message);
          // Don't fail - allow onboarding to proceed
          setLicenseData(null);
          setHasActiveLicense(false);
          setLoading(false);
          return;
        }
        
        userData = newUser;
        console.log('New app_user created:', userData);
      } else if (userError && userError.code !== 'PGRST116') {
        console.error('Unexpected user query error:', userError.message);
        // Allow onboarding to continue even with errors
        setLicenseData(null);
        setHasActiveLicense(false);
        setLoading(false);
        return;
      }

      // Step 2: Check for fighter profile (simplified)
      const { data: profileData, error: profileError } = await supabase
        .from('fighter_profiles')
        .select(`
          id,
          first_name,
          last_name,
          nickname,
          country,
          weight_class,
          avatar_url,
          record_wins,
          record_losses,
          record_draws,
          discipline,
          active,
          fighter_licenses (
            id,
            license_number,
            status,
            license_level,
            issued_at,
            expires_at,
            is_primary
          )
        `)
        .eq('user_id', userData?.id)
        .eq('active', true)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile query error:', profileError.message);
        // Don't fail - this is normal for new users
      }

      if (!profileData) {
        console.log('No fighter profile found - user can proceed with onboarding');
        setLicenseData(null);
        setHasActiveLicense(false);
        setLoading(false);
        return;
      }

      console.log('Fighter profile found:', profileData);

      // Check for active license
      const licenses = Array.isArray(profileData.fighter_licenses) 
        ? profileData.fighter_licenses 
        : profileData.fighter_licenses ? [profileData.fighter_licenses] : [];
      
      const activeLicense = licenses.find((license: any) => 
        license.status === 'ACTIVE' || license.status === 'PENDING'
      );

      if (activeLicense) {
        console.log('Active license found:', activeLicense);
        const combinedLicenseData = {
          ...activeLicense,
          fighter_profiles: profileData
        };
        setLicenseData(combinedLicenseData);
        setHasActiveLicense(activeLicense.status === 'ACTIVE');
      } else {
        console.log('No active license found');
        setLicenseData(null);
        setHasActiveLicense(false);
      }

    } catch (error) {
      console.error('Error checking license status:', error);
      // Don't block onboarding process
      setHasActiveLicense(false);
      setLicenseData(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshLicense = async () => {
    if (user) {
      console.log('Manually refreshing license status...');
      setLoading(true);
      
      // Clear all cache first
      queryClient.clear();
      
      // Force fresh data fetch
      await checkLicenseStatus(user.id);
      
      // Also invalidate all license-related queries
      queryClient.invalidateQueries({ queryKey: ['license'] });
      queryClient.invalidateQueries({ queryKey: ['admin_licenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-licenses'] });
    }
  };

  useEffect(() => {
    let mounted = true;
    let realtimeChannel: any = null;

    // Set a backup timeout to prevent infinite loading
    const backupTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Backup timeout triggered, stopping loading');
        setLoading(false);
      }
    }, 15000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkLicenseStatus(session.user.id);
        } else {
          setHasActiveLicense(false);
          setLicenseData(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkLicenseStatus(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    // Set up realtime subscription for fighter_profiles changes
    if (user) {
      realtimeChannel = supabase
        .channel('fighter-profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'fighter_profiles'
          },
          (payload) => {
            console.log('Fighter profile updated, refreshing license data...');
            if (mounted) {
              checkLicenseStatus(user.id);
            }
          }
        )
        .subscribe();
    }

    return () => {
      mounted = false;
      clearTimeout(backupTimeout);
      subscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/license/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const value = {
    user,
    session,
    loading,
    hasActiveLicense,
    licenseData,
    signIn,
    signUp,
    signOut,
    refreshLicense
  };

  return (
    <LicenseAuthContext.Provider value={value}>
      {children}
    </LicenseAuthContext.Provider>
  );
};

export const useLicenseAuth = () => {
  const context = useContext(LicenseAuthContext);
  if (context === undefined) {
    throw new Error('useLicenseAuth must be used within a LicenseAuthProvider');
  }
  return context;
};