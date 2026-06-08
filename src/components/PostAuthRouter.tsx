import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * PostAuthRouter - Unified post-authentication routing
 *
 * Handles ALL post-login/email-verification redirects:
 * 1. First-time users → /profile/setup (mandatory profile)
 * 2. Users with pending gym invites → gym dashboard
 * 3. Users with pending fighter invites → fighter setup
 * 4. Returning users → /profile/hub (module selection)
 * 5. Unverified email → allow browsing with banner
 */
export function PostAuthRouter({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }

    async function routeUser() {
      try {
        if (!user!.email_confirmed_at) {
          setChecking(false);
          return;
        }

        const { data: appUser, error: appUserError } = await supabase
          .from('app_user')
          .select('id, first_name, last_name')
          .eq('auth_user_id', user!.id)
          .maybeSingle();

        if (appUserError) {
          console.error('[PostAuthRouter] Error fetching app_user:', appUserError);
          setChecking(false);
          return;
        }

        if (!appUser?.first_name) {
          if (location.pathname !== '/profile/setup') {
            navigate('/profile/setup', { replace: true });
            return;
          }
          setChecking(false);
          return;
        }

        const gymInviteToken = localStorage.getItem('fighter_id_invite_gym');
        if (gymInviteToken) {
          try {
            const { data: inviteData } = await supabase
              .rpc('accept_gym_invitation' as any, { p_token: gymInviteToken });
            localStorage.removeItem('fighter_id_invite_gym');
            if ((inviteData as any)?.gym_id) {
              navigate(`/gym/${(inviteData as any).gym_id}/dashboard`, { replace: true });
              return;
            }
          } catch (e) {
            console.error('[PostAuthRouter] Failed to accept gym invite:', e);
            localStorage.removeItem('fighter_id_invite_gym');
          }
        }

        const fighterInviteToken = localStorage.getItem('fighter_invite_pending');
        if (fighterInviteToken) {
          setChecking(false);
          return;
        }

        const authPages = ['/auth', '/auth/callback', '/auth/forgot-password', '/auth/reset-password'];
        if (authPages.includes(location.pathname)) {
          navigate('/profile/hub', { replace: true });
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error('[PostAuthRouter] Routing error:', error);
        setChecking(false);
      }
    }

    routeUser();
  }, [user, authLoading, location.pathname, navigate]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Preparando tu experiencia...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
