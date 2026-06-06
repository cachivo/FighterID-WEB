import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; errorCode: 'email_not_confirmed' | 'invalid_credentials' | 'rate_limited' | 'network' | 'other' | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Detect if running as installed PWA
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Safety timeout: never let the app stay stuck on the loading splash.
    // If Supabase getSession() hangs (slow network, offline), unblock UI after 2.5s.
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current && !initializedRef.current) {
        console.warn('[AUTH] Safety timeout reached, unblocking UI');
        initializedRef.current = true;
        setLoading(false);
      }
    }, 2500);

    // CRITICAL: Set up listener FIRST, BEFORE checking session
    // This prevents race conditions on slow mobile connections
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mountedRef.current) return;

        console.log('[AUTH] State changed:', event, currentSession?.user?.id);

        // Update state synchronously
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Only set loading false AFTER initial check completes
        // This prevents showing logged-out state before we know
        if (initializedRef.current) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Initializing, checking session...');
        
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Error getting session:', error);
        }

        if (!mountedRef.current) return;

        console.log('[AUTH] Existing session:', existingSession?.user?.id || 'none');

        setSession(existingSession);
        setUser(existingSession?.user ?? null);
      } catch (e) {
        console.error('[AUTH] Failed to get session:', e);
      } finally {
        if (mountedRef.current) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AUTH] Signing in...');

      // Timeout guard so the UI never hangs on slow networks
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      );

      const { data, error } = (await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error('[AUTH] Sign in error:', error);
        const raw = (error.message || '').toLowerCase();
        const code = (error as any).code as string | undefined;
        let errorCode: 'email_not_confirmed' | 'invalid_credentials' | 'rate_limited' | 'other' = 'other';
        let friendly = error.message;
        if (code === 'email_not_confirmed' || raw.includes('email not confirmed') || raw.includes('not confirmed')) {
          errorCode = 'email_not_confirmed';
          friendly = 'Tu correo aún no está confirmado. Revisa tu bandeja o reenvía el enlace.';
        } else if (code === 'invalid_credentials' || raw.includes('invalid login credentials')) {
          errorCode = 'invalid_credentials';
          friendly = 'Credenciales incorrectas.';
        } else if (raw.includes('rate') || raw.includes('too many')) {
          errorCode = 'rate_limited';
          friendly = 'Demasiados intentos. Espera unos segundos e intenta de nuevo.';
        }
        return { error: { ...error, message: friendly }, errorCode };
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.user);
      }

      return { error: null, errorCode: null };
    } catch (e: any) {
      console.error('[AUTH] Unexpected sign in error:', e);
      const isTimeout = e?.message === 'timeout';
      return {
        error: { message: isTimeout ? 'La conexión tardó demasiado. Verifica tu internet e intenta de nuevo.' : 'Error de conexión. Intenta de nuevo.' },
        errorCode: 'other' as const,
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Route through AuthCallback so it handles role-based routing
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log('[AUTH] Signing up with redirect:', redirectUrl);
      
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
    } catch (e: any) {
      console.error('[AUTH] Unexpected sign up error:', e);
      return { error: { message: 'Error de conexión. Intenta de nuevo.' } };
    }
  };

  const signOut = async () => {
    try {
      console.log('[AUTH] Signing out...');
      
      // Clear state first for immediate UI feedback
      setSession(null);
      setUser(null);
      
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('[AUTH] Error signing out:', e);
    } finally {
      // Ensure state is cleared even if signOut fails
      setSession(null);
      setUser(null);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-password-recovery', {
        body: { 
          email,
          redirectTo: `${window.location.origin}/auth/reset-password`
        }
      });

      if (error) {
        console.error('[AUTH] Error sending recovery email:', error);
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
      console.error('[AUTH] Unexpected error in resetPassword:', e);
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
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        // Handle rate limiting — extract retry seconds when present
        const msg = error.message || '';
        if (msg.includes('For security purposes') || msg.includes('email_send_rate_limit') || msg.includes('over_email_send_rate_limit')) {
          const m = msg.match(/after (\d+) second/i);
          const retryAfter = m ? parseInt(m[1], 10) : 60;
          return {
            error: {
              message: `Espera ${retryAfter} segundos antes de reenviar el correo.`,
              retryAfter,
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
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    resendConfirmation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}