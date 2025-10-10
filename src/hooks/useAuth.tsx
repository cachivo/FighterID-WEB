import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
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
      setLoading(false);
      navigate('/', { replace: true });
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
          emailRedirectTo: `${window.location.origin}/auth`
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