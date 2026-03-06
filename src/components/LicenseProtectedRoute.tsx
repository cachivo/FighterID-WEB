import { Navigate } from 'react-router-dom';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface LicenseProtectedRouteProps {
  children: React.ReactNode;
  requireActiveLicense?: boolean;
}

export default function LicenseProtectedRoute({ 
  children, 
  requireActiveLicense = false 
}: LicenseProtectedRouteProps) {
  const { user, loading, loadingProgress, loadingMessage, hasActiveLicense, licenseData, refreshLicense } = useLicenseAuth();
  const [showSlowConnection, setShowSlowConnection] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Adaptive timeouts based on connection quality
    const conn = (navigator as any).connection;
    const effectiveType = conn?.effectiveType || '4g';
    
    let slowThreshold = 8000;
    let timeoutThreshold = 20000;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      slowThreshold = 30000;
      timeoutThreshold = 60000;
    } else if (effectiveType === '3g') {
      slowThreshold = 15000;
      timeoutThreshold = 40000;
    }

    const slowTimer = setTimeout(() => {
      if (loading) {
        setShowSlowConnection(true);
      }
    }, slowThreshold);

    const timeoutTimer = setTimeout(() => {
      if (loading) {
        setShowTimeout(true);
      }
    }, timeoutThreshold);

    return () => {
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
    };
  }, [loading]);

  // Reset states when loading changes
  useEffect(() => {
    if (!loading) {
      setShowSlowConnection(false);
      setShowTimeout(false);
      setIsRetrying(false);
    }
  }, [loading]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setShowSlowConnection(false);
    setShowTimeout(false);
    await refreshLicense();
  };

  const handleContinueWithoutWaiting = () => {
    // Force navigate to onboarding
    window.location.href = '/license/onboarding';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center w-full max-w-xs">
          {/* Loading icon with connection status */}
          <div className="relative mb-6">
            {isRetrying ? (
              <RefreshCw className="h-10 w-10 animate-spin mx-auto text-primary" />
            ) : (
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            )}
            {showSlowConnection && !showTimeout && (
              <div className="absolute -top-1 -right-1 flex items-center justify-center">
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-4 px-4">
            <Progress 
              value={loadingProgress} 
              className="h-2" 
            />
          </div>

          {/* Status message */}
          <p className="text-sm text-muted-foreground mb-2">
            {loadingMessage}
          </p>

          {/* Slow connection warning */}
          {showSlowConnection && !showTimeout && (
            <div className="mt-4 p-3 bg-secondary/50 border border-border rounded-lg">
              <div className="flex items-center justify-center gap-2 text-foreground mb-2">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Conexión lenta</span>
              </div>
              <p className="text-xs text-muted-foreground">
                La verificación está tardando más de lo esperado. Por favor espera...
              </p>
            </div>
          )}

          {/* Timeout options */}
          {showTimeout && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium mb-1">
                  Tiempo de espera agotado
                </p>
                <p className="text-xs text-muted-foreground">
                  No se pudo verificar tu licencia. Esto puede deberse a una conexión lenta o problemas temporales del servidor.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full min-h-[48px] touch-manipulation"
                  variant="default"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Reintentando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reintentar
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleContinueWithoutWaiting}
                  className="w-full min-h-[48px] touch-manipulation"
                  variant="outline"
                >
                  Continuar sin esperar
                </Button>
              </div>
            </div>
          )}

          {/* Connection hint for mobile users */}
          {!showTimeout && (
            <p className="text-[10px] text-muted-foreground/60 mt-6">
              Si estás en datos móviles, intenta conectarte a WiFi
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/license/auth?mode=signin" replace />;
  }

  // Check multiple sources of truth for active license status
  const profileLicenseStatus = licenseData?.fighter_profiles?.license_status;
  const hasPrimaryLicenseId = !!licenseData?.fighter_profiles?.primary_license_id;
  const licenseIsActive = licenseData?.status === 'ACTIVE';
  
  // User is considered to have active license if any of these are true
  const effectiveHasActiveLicense = 
    hasActiveLicense || 
    licenseIsActive || 
    (profileLicenseStatus === 'active' && hasPrimaryLicenseId);

  // Redirect users with ACTIVE licenses away from pending/onboarding pages
  if (effectiveHasActiveLicense) {
    const currentPath = window.location.pathname;
    if (currentPath === '/license/pending' || currentPath === '/license/onboarding') {
      return <Navigate to="/license/dashboard" replace />;
    }
  }

  if (requireActiveLicense && !effectiveHasActiveLicense) {
    // Handle different license states appropriately
    const licenseStatus = licenseData?.status;
    
    if (licenseStatus === 'SUSPENDED') {
      return <Navigate to="/license/suspended" replace />;
    } else if (licenseStatus === 'PENDING_REVIEW' || licenseStatus === 'APPLIED') {
      return <Navigate to="/license/pending" replace />;
    } else {
      return <Navigate to="/license/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
