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
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
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
    console.log('[LICENSE AUTH] Starting check for user:', userId);
    
    try {
      // 1) Get app_user to resolve internal user_id
      const { data: appUser, error: appUserErr } = await supabase
        .from('app_user')
        .select('id, email')
        .eq('auth_user_id', userId)
        .maybeSingle();

      console.log('[LICENSE AUTH] App user result:', { 
        found: !!appUser, 
        email: appUser?.email,
        error: appUserErr?.message 
      });

      if (appUserErr) {
        console.error('[LICENSE AUTH] app_user fetch error:', appUserErr);
        throw appUserErr;
      }

      // If no app_user, allow onboarding
      if (!appUser?.id) {
        console.log('[WARNING] [LICENSE AUTH] No app_user - allowing onboarding');
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      // 2) Get fighter profile for this user
      const { data: profile, error: profileErr } = await supabase
        .from('fighter_profiles')
        .select('*')
        .eq('user_id', appUser.id)
        .eq('active', true)
        .maybeSingle();

      console.log('[LICENSE AUTH] Fighter profile result:', { 
        found: !!profile,
        profileId: profile?.id,
        name: profile ? `${profile.first_name} ${profile.last_name}` : 'N/A',
        error: profileErr?.message 
      });

      if (profileErr) {
        console.error('[LICENSE AUTH] fighter_profiles fetch error:', profileErr);
        throw profileErr;
      }

      if (!profile?.id) {
        console.log('[WARNING] [LICENSE AUTH] No fighter profile - allowing onboarding');
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      // 3) Resolve license with robust fallbacks (prefer ACTIVE primary)
      console.log('[LICENSE AUTH] Looking for license for fighter_id:', profile.id);

      // Try ACTIVE primary first
      const { data: license, error: licenseErr } = await supabase
        .from('fighter_licenses')
        .select('id, license_number, status, license_level, issued_at, expires_at, is_primary, qr_code_url')
        .eq('fighter_id', profile.id)
        .eq('status', 'ACTIVE')
        .eq('is_primary', true)
        .maybeSingle();

      console.log('[LICENSE AUTH] License query result:', { 
        found: !!license,
        licenseNumber: license?.license_number,
        status: license?.status,
        isPrimary: license?.is_primary,
        error: licenseErr?.message 
      });

      if (licenseErr) {
        console.error('[LICENSE AUTH] License fetch error:', licenseErr);
        throw licenseErr;
      }

      if (license) {
        console.log('[SUCCESS] [LICENSE AUTH] ACTIVE license found!');
        const combinedLicenseData = { ...license, fighter_profiles: profile };
        setLicenseData(combinedLicenseData);
        setHasActiveLicense(true);
      } else {
        console.log('[WARNING] [LICENSE AUTH] No ACTIVE license found');
        setLicenseData({ fighter_profiles: profile });
        setHasActiveLicense(false);
      }

    } catch (error) {
      console.error('[ERROR] [LICENSE AUTH] Fatal error:', error);
      setHasActiveLicense(false);
      setLicenseData(null);
    } finally {
      console.log('[LICENSE AUTH] Check complete. Setting loading to false.');
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
    console.log('[LICENSE AUTH] useEffect started - setting up auth listeners');
    let mounted = true;
    let realtimeChannel: any = null;

    // Set a backup timeout to prevent infinite loading
    const backupTimeout = setTimeout(() => {
      if (mounted) {
        console.log('[TIMEOUT] [LICENSE AUTH] Backup timeout triggered, stopping loading');
        setLoading(false);
      }
    }, 15000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[LICENSE AUTH] Auth state changed:', event, session?.user?.id);
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('[LICENSE AUTH] User found, calling checkLicenseStatus');
          setTimeout(() => {
            checkLicenseStatus(session.user.id);
          }, 0);
        } else {
          console.log('[LICENSE AUTH] No user, setting defaults');
          setHasActiveLicense(false);
          setLicenseData(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    console.log('[LICENSE AUTH] Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[LICENSE AUTH] Existing session result:', session?.user?.id);
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('[LICENSE AUTH] Existing user found, calling checkLicenseStatus');
        setTimeout(() => {
          checkLicenseStatus(session.user.id);
        }, 0);
      } else {
        console.log('[LICENSE AUTH] No existing session');
        setLoading(false);
      }
    }).catch((error) => {
      console.error('[ERROR] [LICENSE AUTH] Error getting session:', error);
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
    const redirectUrl = `${window.location.origin}/license/auth`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      // Handle rate limiting
      if (error.message?.includes('For security purposes') || error.message?.includes('email_send_rate_limit')) {
        return { error: { message: 'Has intentado registrarte varias veces. Por favor espera 60 segundos antes de intentar nuevamente.' } };
      }
      
      // Handle duplicate user
      const message = /registered|exists|already/i.test(error.message)
        ? 'Este correo ya está registrado. Intenta iniciar sesión o recupera tu contraseña.'
        : error.message;
      return { error: { message } };
    }

    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('Error al cerrar sesión local:', e);
    } finally {
      setSession(null);
      setUser(null);
      setHasActiveLicense(false);
      setLicenseData(null);
      queryClient.clear();
      setLoading(false);
      navigate('/', { replace: true });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-password-recovery', {
        body: { 
          email,
          redirectTo: `${window.location.origin}/license/reset-password`
        }
      });

      if (error) {
        console.error('Error calling recovery function:', error);
        return { error: { message: error.message } };
      }

      if (data?.error) {
        return { error: { message: data.error, retryAfter: data.retryAfter } };
      }

      return { error: null };
    } catch (e: any) {
      console.error('Unexpected error in resetPassword:', e);
      return { error: { message: 'Error al procesar la solicitud' } };
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/license/auth`
        }
      });
      
      if (error) {
        // Handle rate limiting
        if (error.message?.includes('For security purposes') || error.message?.includes('email_send_rate_limit')) {
          return { 
            error: { 
              message: 'Has intentado reenviar el correo varias veces. Por favor espera 60 segundos antes de intentar nuevamente.' 
            } 
          };
        }
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
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
    refreshLicense,
    resetPassword,
    updatePassword,
    resendConfirmation
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