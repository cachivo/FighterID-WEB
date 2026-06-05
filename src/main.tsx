import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

// Expose Geist as CSS custom properties for tailwind/global use.
document.documentElement.style.setProperty('--font-geist-sans', GeistSans.style.fontFamily)
document.documentElement.style.setProperty('--font-geist-mono', GeistMono.style.fontFamily)
document.documentElement.classList.add(GeistSans.variable, GeistMono.variable)

// Register/Manage Service Worker
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Unregister any existing SW in development to avoid caching dev assets
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister());
      console.log('[PWA] Unregistered Service Workers in development');
    });
  } else if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version available! Please refresh.');
                  // Optionally show a toast notification here
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
