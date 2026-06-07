import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { startSession, endSession } from './session.service';
import type { SessionContext as SessionContextValue, WorkSession } from './session.types';

/**
 * Feature flag: hasta validar post-demo, las sesiones quedan dormidas.
 * Activar manualmente en consola: localStorage.setItem('SESSIONS_ENABLED','true')
 */
function sessionsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('SESSIONS_ENABLED') === 'true';
  } catch {
    return false;
  }
}

interface SessionContextShape {
  sessionId: string | null;
  session: WorkSession | null;
  enabled: boolean;
}

const Ctx = createContext<SessionContextShape>({
  sessionId: null,
  session: null,
  enabled: false,
});

interface ProviderProps {
  context: SessionContextValue | string;
  fighterProfileId?: string | null;
  children: React.ReactNode;
}

/**
 * Monta una sesión de trabajo al renderizarse.
 * Cierra automáticamente en unmount, beforeunload y visibilitychange→hidden.
 */
export function SessionProvider({ context, fighterProfileId, children }: ProviderProps) {
  const { user } = useAuth();
  const [session, setSession] = useState<WorkSession | null>(null);
  const closingRef = useRef(false);
  const enabled = sessionsEnabled();

  const close = useCallback(async (sid: string) => {
    if (closingRef.current) return;
    closingRef.current = true;
    await endSession(sid);
  }, []);

  useEffect(() => {
    if (!enabled || !user?.id) return;
    let cancelled = false;
    let createdId: string | null = null;

    (async () => {
      try {
        const s = await startSession({
          authUserId: user.id,
          context,
          fighterProfileId: fighterProfileId ?? null,
        });
        if (cancelled) {
          if (s) endSession(s.id).catch(() => {});
          return;
        }
        if (!s) {
          console.warn('[useSession] startSession returned null, no session created');
          return;
        }
        createdId = s.id;
        setSession(s);
      } catch (e) {
        console.warn('[useSession] startSession failed', e);
      }
    })();

    const handleBeforeUnload = () => {
      if (createdId) {
        // best-effort sync close (won't await on unload)
        endSession(createdId).catch(() => {});
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && createdId) {
        endSession(createdId).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (createdId) close(createdId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, context, fighterProfileId, enabled]);

  return (
    <Ctx.Provider value={{ sessionId: session?.id ?? null, session, enabled }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkSession() {
  return useContext(Ctx);
}
