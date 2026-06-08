import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface LicenseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  hasActiveLicense: boolean;
  licenseData: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshLicense: () => Promise<void>;
  forceLicenseUpdate: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
}

const LicenseAuthContext = createContext<LicenseAuthContextType | undefined>(undefined);

export const LicenseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Verificando sesión...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasActiveLicense, setHasActiveLicense] = useState(false);
  const [licenseData, setLicenseData] = useState<any>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const retryCountRef = useRef(0);
  const maxRetries = 1;
  const checkInProgressRef = useRef(false);

  // Type for RPC response
  interface LicenseStatusResponse {
    status: 'no_user' | 'no_profile' | 'active_license' | 'pending_license' | 'suspended_license' | 'no_license';
    user_id?: string;
    email?: string;
    message?: string;
    profile?: Record<string, any>;
    license?: Record<string, any>;
  }

  const checkLicenseStatusOptimized = async (userId: string) => {
    // Prevent duplicate concurrent executions
    if (checkInProgressRef.current) {
      console.log('[LICENSE AUTH] Check already in progress, skipping duplicate call');
      return;
    }
    checkInProgressRef.current = true;
    console.log('[LICENSE AUTH] Starting optimized check for user:', userId);
    setLoadingMessage('Verificando tu cuenta...');
    setLoadingProgress(20);
    
    try {
      // Use the optimized RPC that combines all queries into one
      setLoadingProgress(40);
      const { data: rawData, error } = await supabase.rpc('check_user_license_status', {
        p_auth_user_id: userId
      });

      setLoadingProgress(80);

      if (error) {
        console.error('[LICENSE AUTH] RPC error:', error);
        // Fallback to legacy method if RPC fails (e.g., not deployed yet)
        if (error.message?.includes('function') || error.code === '42883') {
          console.log('[LICENSE AUTH] RPC not available, using legacy method');
          return checkLicenseStatusLegacy(userId);
        }
        throw error;
      }

      // Cast the raw data to our expected type
      const data = rawData as unknown as LicenseStatusResponse | null;
      console.log('[LICENSE AUTH] RPC result:', data);

      if (!data || data.status === 'no_user') {
        console.log('[WARNING] [LICENSE AUTH] No app_user - allowing onboarding');
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      if (data.status === 'no_profile') {
        console.log('[WARNING] [LICENSE AUTH] No fighter profile - allowing onboarding');
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      const profile = data.profile;
      const license = data.license;

      if (data.status === 'active_license' && license) {
        console.log('[SUCCESS] [LICENSE AUTH] Active license found');
        const combinedLicenseData = { ...license, fighter_profiles: profile };
        setLicenseData(combinedLicenseData);
        setHasActiveLicense(true);
        
        if (window.location.pathname === '/license/pending') {
          navigate('/license/dashboard', { replace: true });
        }
      } else if (data.status === 'suspended_license' && license) {
        console.log('[LICENSE AUTH] Suspended license found');
        const combinedData = { ...license, fighter_profiles: profile };
        setLicenseData(combinedData);
        setHasActiveLicense(false);
        
        if (window.location.pathname !== '/license/suspended') {
          navigate('/license/suspended', { replace: true });
        }
      } else if (data.status === 'pending_license' && license) {
        console.log('[LICENSE AUTH] Pending license found');
        const combinedData = { ...license, fighter_profiles: profile };
        setLicenseData(combinedData);
        setHasActiveLicense(false);
        
        if (window.location.pathname === '/license/dashboard') {
          navigate('/license/pending', { replace: true });
        }
      } else if (data.status === 'no_license' && profile) {
        // CONSISTENCY FALLBACK: RPC says no_license but profile references one.
        // Re-fetch the actual license and respect its real status — never fake ACTIVE.
        const primaryLicenseId = (profile as any).primary_license_id;

        if (primaryLicenseId) {
          console.log('[FALLBACK] Profile has primary_license_id but RPC missed it. Fetching directly...');
          const { data: directLicense } = await supabase
            .from('fighter_licenses')
            .select('id, license_number, status, license_level, issued_at, expires_at, is_primary, qr_code_url, created_at')
            .eq('id', primaryLicenseId)
            .maybeSingle();

          if (directLicense) {
            const combined = { ...directLicense, fighter_profiles: profile };
            setLicenseData(combined);
            const realStatus = directLicense.status;
            setHasActiveLicense(realStatus === 'ACTIVE');

            const path = window.location.pathname;
            if (realStatus === 'ACTIVE' && path === '/license/pending') {
              navigate('/license/dashboard', { replace: true });
            } else if (realStatus === 'SUSPENDED' && path !== '/license/suspended') {
              navigate('/license/suspended', { replace: true });
            } else if ((realStatus === 'PENDING_REVIEW' || realStatus === 'APPLIED') && path === '/license/dashboard') {
              navigate('/license/pending', { replace: true });
            }
            return;
          }
        }

        // Truly no license
        setLicenseData({ fighter_profiles: profile });
        setHasActiveLicense(false);
      } else {
        // Has profile but no license
        setLicenseData({ fighter_profiles: profile });
        setHasActiveLicense(false);
      }

      setLoadingProgress(100);

    } catch (error) {
      console.error('[ERROR] [LICENSE AUTH] Fatal error:', error);
      
      // Retry logic for network errors
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setLoadingMessage('Conexión lenta, reintentando...');
        setLoadingProgress(30);
        console.log(`[LICENSE AUTH] Retrying... (${retryCountRef.current}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return checkLicenseStatusOptimized(userId);
      }
      
      setHasActiveLicense(false);
      setLicenseData(null);
    } finally {
      console.log('[LICENSE AUTH] Check complete. Setting loading to false.');
      checkInProgressRef.current = false;
      setLoading(false);
    }
  };

  // Legacy fallback method in case RPC is not available
  const checkLicenseStatusLegacy = async (userId: string) => {
    console.log('[LICENSE AUTH] Using legacy check for user:', userId);
    setLoadingMessage('Verificando cuenta (modo compatibilidad)...');
    
    try {
      // 1) Get app_user
      setLoadingProgress(30);
      const { data: appUser, error: appUserErr } = await supabase
        .from('app_user')
        .select('id, email')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (appUserErr) throw appUserErr;

      if (!appUser?.id) {
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      // 2) Get fighter profile
      setLoadingProgress(50);
      const { data: profileData, error: profileErr } = await supabase
        .from('fighter_profiles')
        .select(`*, app_user!inner (phone)`)
        .eq('user_id', appUser.id)
        .eq('active', true)
        .maybeSingle();

      if (profileErr) throw profileErr;

      const profile = profileData ? {
        ...profileData,
        phone: (profileData as any).app_user?.phone
      } : null;

      if (!profile?.id) {
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      // 3) Get license
      setLoadingProgress(70);
      const { data: license, error: licenseErr } = await supabase
        .from('fighter_licenses')
        .select('id, license_number, status, license_level, issued_at, expires_at, is_primary, qr_code_url')
        .eq('fighter_id', profile.id)
        .eq('status', 'ACTIVE')
        .eq('is_primary', true)
        .maybeSingle();

      if (licenseErr) throw licenseErr;

      setLoadingProgress(90);

      if (license) {
        const combinedLicenseData = { ...license, fighter_profiles: profile };
        setLicenseData(combinedLicenseData);
        
        if (license.status === 'ACTIVE') {
          setHasActiveLicense(true);
          if (window.location.pathname === '/license/pending') {
            window.location.href = '/license/dashboard';
          }
        }
      } else {
        // Check for pending
        const { data: pendingLicense } = await supabase
          .from('fighter_licenses')
          .select('*')
          .eq('fighter_id', profile.id)
          .eq('status', 'PENDING_REVIEW')
          .maybeSingle();
        
        if (pendingLicense) {
          const combinedData = { ...pendingLicense, fighter_profiles: profile };
          setLicenseData(combinedData);
          setHasActiveLicense(false);
        } else {
          setLicenseData({ fighter_profiles: profile });
          setHasActiveLicense(false);
        }
      }

      setLoadingProgress(100);

    } catch (error) {
      console.error('[ERROR] [LICENSE AUTH] Legacy check error:', error);
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
      retryCountRef.current = 0;
      queryClient.clear();
      await checkLicenseStatusOptimized(user.id);
      queryClient.invalidateQueries({ queryKey: ['license'] });
      queryClient.invalidateQueries({ queryKey: ['admin_licenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-licenses'] });
    }
  };

  const forceLicenseUpdate = async () => {
    if (user) {
      console.log('[FORCE UPDATE] Forcing license data refresh...');
      retryCountRef.current = 0;
      await checkLicenseStatusOptimized(user.id);
    }
  };

  useEffect(() => {
    console.log('[LICENSE AUTH] useEffect started - setting up auth listeners');
    let mounted = true;
    let profileChannel: any = null;
    let licenseChannel: any = null;
    let broadcastChannel: any = null;

    // Extended timeout for slow mobile connections (25s instead of 12s)
    const backupTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[TIMEOUT] [LICENSE AUTH] Backup timeout triggered after 25s');
        setLoadingMessage('Tiempo de espera agotado');
        setLoading(false);
      }
    }, 25000);

    // Progress simulation for better UX
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev < 15) return prev + 1;
        return prev;
      });
    }, 200);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[LICENSE AUTH] Auth state changed:', event, session?.user?.id);
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const currentPath = window.location.pathname;
          const isLicenseRoute = currentPath.startsWith('/license');
          if (isLicenseRoute) {
            console.log('[LICENSE AUTH] User found on license route, calling checkLicenseStatus');
            retryCountRef.current = 0;
            setTimeout(() => {
              checkLicenseStatusOptimized(session.user.id);
            }, 0);
          } else {
            console.log('[LICENSE AUTH] Skipping license check — not on /license/* route:', currentPath);
            setLoading(false);
          }
        } else {
          console.log('[LICENSE AUTH] No user, setting defaults');
          setHasActiveLicense(false);
          setLicenseData(null);
          setLoading(false);
        }
      }
    );

    console.log('[LICENSE AUTH] Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[LICENSE AUTH] Existing session result:', session?.user?.id);
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const currentPath = window.location.pathname;
        const isLicenseRoute = currentPath.startsWith('/license');
        if (isLicenseRoute) {
          console.log('[LICENSE AUTH] Existing user found on license route, calling checkLicenseStatus');
          retryCountRef.current = 0;
          setTimeout(() => {
            checkLicenseStatusOptimized(session.user.id);
          }, 0);
        } else {
          console.log('[LICENSE AUTH] Skipping license check — not on /license/* route:', currentPath);
          setLoading(false);
        }
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

    // LAYER 1: Real-time subscription for fighter_profiles changes
    if (user) {
      profileChannel = supabase
        .channel('fighter-profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'fighter_profiles'
          },
          (payload) => {
            console.log('[REALTIME] Fighter profile updated, refreshing license data...');
            if (mounted) {
              retryCountRef.current = 0;
              checkLicenseStatusOptimized(user.id);
            }
          }
        )
        .subscribe();
    }

    // LAYER 2: Real-time subscription for fighter_licenses changes (NEW)
    if (user && licenseData?.id) {
      licenseChannel = supabase
        .channel(`license-changes-${licenseData.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'fighter_licenses',
            filter: `id=eq.${licenseData.id}`
          },
          (payload: any) => {
            console.log('[REALTIME] License status changed via postgres_changes:', payload);
            if (mounted && payload.new?.status === 'ACTIVE') {
              console.log('[REALTIME] License approved! Updating state immediately...');
              setHasActiveLicense(true);
              setLicenseData((prev: any) => prev ? { ...prev, status: 'ACTIVE' } : prev);
              // Auto-redirect from pending page
              if (window.location.pathname === '/license/pending') {
                navigate('/license/dashboard', { replace: true });
              }
            } else if (mounted && payload.new?.status === 'SUSPENDED') {
              setHasActiveLicense(false);
              setLicenseData((prev: any) => prev ? { ...prev, status: 'SUSPENDED' } : prev);
              if (window.location.pathname === '/license/dashboard') {
                navigate('/license/suspended', { replace: true });
              }
            }
          }
        )
        .subscribe();
    }

    // LAYER 3: Broadcast listener for admin approval notifications (NEW)
    broadcastChannel = supabase
      .channel('license-approvals-broadcast')
      .on('broadcast', { event: 'license-approved' }, (payload) => {
        console.log('[BROADCAST] License approval notification received:', payload);
        if (mounted && user && licenseData?.id && payload.payload?.licenseId === licenseData.id) {
          console.log('[BROADCAST] This is our license! Refreshing status...');
          retryCountRef.current = 0;
          checkLicenseStatusOptimized(user.id);
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      clearTimeout(backupTimeout);
      clearInterval(progressInterval);
      subscription.unsubscribe();
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
      if (licenseChannel) {
        supabase.removeChannel(licenseChannel);
      }
      if (broadcastChannel) {
        supabase.removeChannel(broadcastChannel);
      }
    };
  }, [user?.id, licenseData?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/license/onboarding`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      if (error.message?.includes('For security purposes') || error.message?.includes('email_send_rate_limit')) {
        return { error: { message: 'Has intentado registrarte varias veces. Por favor espera 60 segundos antes de intentar nuevamente.' } };
      }
      
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
      const redirectUrl = `${window.location.origin}/license/reset-password`;
      const { data, error } = await supabase.functions.invoke('send-password-recovery', {
        body: { 
          email,
          redirectTo: redirectUrl
        }
      });

      if (error) {
        let errorMessage = 'Error al procesar la solicitud';
        let retryAfter: number | undefined;
        try {
          const errorBody = await (error as any).context?.json();
          if (errorBody?.error) errorMessage = errorBody.error;
          if (errorBody?.retryAfter) retryAfter = errorBody.retryAfter;
        } catch {}
        return { error: { message: errorMessage, retryAfter } };
      }

      if (data?.error) {
        return { error: { message: data.error, retryAfter: data.retryAfter } };
      }

      return { error: null };
    } catch (e: any) {
      return { error: { message: 'Error de conexión. Intenta de nuevo.' } };
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
          emailRedirectTo: `${window.location.origin}/license/onboarding`
        }
      });
      
      if (error) {
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
    loadingMessage,
    loadingProgress,
    hasActiveLicense,
    licenseData,
    signIn,
    signUp,
    signOut,
    refreshLicense,
    forceLicenseUpdate,
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
