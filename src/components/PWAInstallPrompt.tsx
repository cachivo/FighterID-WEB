import { useState, useEffect } from "react";
import { X, Plus, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  // Detect device type
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
    
    // Re-show after 7 days
    if (dismissed && dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show prompt after delay - either automatic or manual
    if (isMobile) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isMobile]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Use native prompt if available
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Show manual instructions
      setShowManualInstructions(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
    setShowPrompt(false);
    setShowManualInstructions(false);
  };

  if (!showPrompt || !isMobile) return null;

  // Manual instructions view
  if (showManualInstructions) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in">
        <div className="bg-gradient-to-b from-gray-900 to-black border border-primary/30 rounded-t-2xl md:rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom md:slide-in-from-bottom-0">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-bold text-white text-xl">
              Agrega a tu Pantalla de Inicio
            </h3>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {isIOS && (
            <div className="space-y-4">
              <p className="text-white/90 text-sm">
                Para instalar Fighter ID en tu iPhone/iPad:
              </p>
              <ol className="space-y-3 text-white/80 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Toca el botón <Share className="inline h-4 w-4 mx-1" /> <strong>Compartir</strong> en la barra inferior del navegador</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Desplázate y toca <Plus className="inline h-4 w-4 mx-1" /> <strong>"Añadir a pantalla de inicio"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Confirma tocando <strong>"Añadir"</strong></span>
                </li>
              </ol>
            </div>
          )}

          {isAndroid && (
            <div className="space-y-4">
              <p className="text-white/90 text-sm">
                Para instalar Fighter ID en tu dispositivo Android:
              </p>
              <ol className="space-y-3 text-white/80 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Toca el menú <strong>⋮</strong> en la esquina superior derecha</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Selecciona <strong>"Agregar a pantalla de inicio"</strong> o <strong>"Instalar app"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Confirma tocando <strong>"Agregar"</strong></span>
                </li>
              </ol>
            </div>
          )}

          <div className="mt-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-white/70 text-xs text-center">
              Una vez instalada, podrás acceder a Fighter ID directamente desde tu pantalla de inicio como cualquier otra app
            </p>
          </div>

          <Button
            onClick={handleDismiss}
            className="w-full mt-4 bg-primary hover:bg-primary/90"
          >
            Entendido
          </Button>
        </div>
      </div>
    );
  }

  // Initial prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-4 md:max-w-md">
      <div className="bg-gradient-to-r from-primary/95 to-primary-variant/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-base mb-1">
              Agrega Fighter ID a tu Pantalla de Inicio
            </h3>
            <p className="text-white/90 text-sm mb-3">
              Accede más rápido y úsala como una app nativa
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
              >
                {deferredPrompt ? 'Instalar Ahora' : 'Ver Cómo'}
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                Ahora no
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
