import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Service Worker policy: we no longer ship an app-shell SW.
// On every load (dev or prod), proactively unregister any existing
// Fighter ID service worker so stale caches can't break auth/network.
// The kill-switch SW at /sw.js handles cleanup for returning users
// who already have an old version installed.
if ('serviceWorker' in navigator) {
  const cleanup = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        regs.map(async (reg) => {
          try {
            // Trigger the kill-switch SW if it's our /sw.js so it activates
            // and cleans caches, then unregister.
            await reg.update().catch(() => {});
            await reg.unregister();
          } catch {
            /* ignore */
          }
        })
      );
    } catch {
      /* ignore */
    }
  };

  if (document.readyState === 'complete') {
    cleanup();
  } else {
    window.addEventListener('load', cleanup);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
