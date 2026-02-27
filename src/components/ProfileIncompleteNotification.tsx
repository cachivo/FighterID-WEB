import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { useHasFighterLicense } from '@/hooks/useHasFighterLicense';

const NOTIFICATION_DISMISS_KEY = 'profile_incomplete_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export function ProfileIncompleteNotification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUserFighterProfile } = useFighterProfiles();
  const { hasLicense, loading: licenseLoading } = useHasFighterLicense();
  const [visible, setVisible] = useState(false);
  const [missingCount, setMissingCount] = useState(0);

  useEffect(() => {
    const checkProfileCompleteness = async () => {
      if (licenseLoading) return;
      if (!hasLicense) return;
      if (location.pathname === '/license/dashboard') return;

      const dismissed = localStorage.getItem(NOTIFICATION_DISMISS_KEY);
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const now = Date.now();
        if (now - dismissedTime < DISMISS_DURATION) {
          return;
        }
      }

      try {
        const profile = await getUserFighterProfile();
        if (!profile) return;

        const missingFields = [];
        if (!profile.birthdate) missingFields.push('birthdate');
        if (!profile.gender) missingFields.push('gender');
        if (!(profile as any).phone) missingFields.push('phone');
        
        if (missingFields.length > 0) {
          setMissingCount(missingFields.length);
          setVisible(true);
        }
      } catch (error) {
        console.error('Error checking profile completeness:', error);
      }
    };

    checkProfileCompleteness();
  }, [getUserFighterProfile, hasLicense, licenseLoading, location.pathname]);

  const handleDismiss = () => {
    localStorage.setItem(NOTIFICATION_DISMISS_KEY, Date.now().toString());
    setVisible(false);
  };

  const handleComplete = () => {
    navigate('/license/dashboard');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-gradient-to-br from-red-950/90 via-card to-card backdrop-blur-md border border-primary/30 rounded-lg shadow-2xl ring-1 ring-primary/20 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          {/* Icono animado */}
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-amber-400 animate-pulse" />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Completa tu información
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Faltan {missingCount} campo{missingCount > 1 ? 's' : ''} obligatorio{missingCount > 1 ? 's' : ''} en tu Fighter ID
            </p>

            {/* Botón de acción */}
            <Button
              onClick={handleComplete}
              size="sm"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              Completar Ahora
            </Button>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
