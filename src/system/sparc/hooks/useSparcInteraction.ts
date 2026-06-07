/**
 * SPARC Interaction Tracker — records last user interaction timestamp.
 * Read by useSparcConnection to flag heartbeats as interacted.
 */
import { useEffect, useRef } from 'react';

const interactionRef = { current: 0 };

export function lastInteraction(): number {
  return interactionRef.current;
}

export function consumeInteraction(windowMs = 5_000): boolean {
  if (!interactionRef.current) return false;
  const fresh = Date.now() - interactionRef.current < windowMs;
  if (fresh) {
    interactionRef.current = 0;
    return true;
  }
  return false;
}

export function useSparcInteractionTracker() {
  const mounted = useRef(true);
  useEffect(() => {
    const mark = () => { interactionRef.current = Date.now(); };
    window.addEventListener('pointerdown', mark, { passive: true });
    window.addEventListener('keydown', mark);
    window.addEventListener('touchstart', mark, { passive: true });
    return () => {
      mounted.current = false;
      window.removeEventListener('pointerdown', mark);
      window.removeEventListener('keydown', mark);
      window.removeEventListener('touchstart', mark);
    };
  }, []);
}
