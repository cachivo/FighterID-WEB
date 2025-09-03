import { Navigate } from 'react-router-dom';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LicenseProtectedRouteProps {
  children: React.ReactNode;
  requireActiveLicense?: boolean;
}

export default function LicenseProtectedRoute({ 
  children, 
  requireActiveLicense = false 
}: LicenseProtectedRouteProps) {
  const { user, loading, hasActiveLicense } = useLicenseAuth();
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    // Show timeout message after 10 seconds
    const timer = setTimeout(() => {
      if (loading) {
        setShowTimeout(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-neon-primary" />
          <p className="text-muted-foreground">
            {showTimeout ? "Conexión lenta, redirigiendo..." : "Verificando licencia..."}
          </p>
          {showTimeout && (
            <button 
              onClick={() => window.location.href = '/license/onboarding'}
              className="mt-4 px-4 py-2 bg-purple-neon-primary text-white rounded hover:bg-purple-neon-primary/80"
            >
              Continuar sin esperar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/license/auth" replace />;
  }

  if (requireActiveLicense && !hasActiveLicense) {
    return <Navigate to="/license/onboarding" replace />;
  }

  return <>{children}</>;
}