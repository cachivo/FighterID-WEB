/**
 * SPARC Device Claim & Revocation.
 * One judge = one active device. The active device is enforced server-side
 * by sparc_claim_device + sparc_submit_vote. This hook owns the local device_id
 * and reacts to revocation broadcasts.
 */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEVICE_KEY = 'sparc.device_id';
const DEVICE_LABEL_KEY = 'sparc.device_label';

export type DeviceState = 'idle' | 'claiming' | 'active' | 'revoked' | 'error';

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function deviceLabel(): string {
  let l = localStorage.getItem(DEVICE_LABEL_KEY);
  if (l) return l;
  const ua = navigator.userAgent;
  const plat = /iPhone|iPad/.test(ua) ? 'iOS'
    : /Android/.test(ua) ? 'Android'
    : /Mac/.test(ua) ? 'Mac'
    : /Win/.test(ua) ? 'Windows' : 'Web';
  l = `${plat} · ${navigator.language}`;
  localStorage.setItem(DEVICE_LABEL_KEY, l);
  return l;
}

export function useSparcDevice(sessionId: string | null) {
  const [state, setState] = useState<DeviceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const deviceIdRef = useRef<string>(getOrCreateDeviceId());

  // Claim on session entry
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      setState('claiming');
      try {
        const { data, error: e } = await supabase.rpc('sparc_claim_device', {
          p_session_id: sessionId,
          p_device_id: deviceIdRef.current,
          p_device_label: deviceLabel(),
        });
        if (cancelled) return;
        if (e) throw e;
        const res = (data as any) ?? {};
        if (res.status === 'DEVICE_TRANSFERRED' || res.status === 'REVOKED') {
          setState('revoked');
        } else {
          setState('active');
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? String(err));
        setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  // Listen for revocation broadcasts
  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase.channel(`sparc-device-${sessionId}-${deviceIdRef.current}`)
      .on('broadcast', { event: 'device_revoked' }, (msg: any) => {
        const target = msg?.payload?.device_id;
        if (!target || target === deviceIdRef.current) {
          setState('revoked');
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId]);

  const reclaim = async () => {
    if (!sessionId) return;
    // Generate a new id so user must explicitly take over
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    deviceIdRef.current = id;
    setState('claiming');
    const { data, error: e } = await supabase.rpc('sparc_claim_device', {
      p_session_id: sessionId,
      p_device_id: id,
      p_device_label: deviceLabel(),
    });
    if (e) { setState('error'); setError(e.message); return; }
    const res = (data as any) ?? {};
    setState(res.status === 'DEVICE_TRANSFERRED' || res.status === 'REVOKED' ? 'revoked' : 'active');
  };

  return {
    deviceId: deviceIdRef.current,
    state,
    error,
    revoked: state === 'revoked',
    active: state === 'active',
    reclaim,
  };
}
