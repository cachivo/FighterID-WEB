import { useState, useEffect } from 'react';
import { getClientCapabilityScore } from '@/lib/deviceCapability';

export function useReducedMotion(): boolean {
  const [shouldReduce, setShouldReduce] = useState(() => {
    if (typeof window === 'undefined') return false;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const device = getClientCapabilityScore();
    return mq.matches || device.isLowEnd;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => {
      const device = getClientCapabilityScore();
      setShouldReduce(mq.matches || device.isLowEnd);
    };

    mq.addEventListener('change', handler);

    const conn = (navigator as any).connection;
    if (conn) conn.addEventListener('change', handler);

    return () => {
      mq.removeEventListener('change', handler);
      if (conn) conn.removeEventListener('change', handler);
    };
  }, []);

  return shouldReduce;
}
