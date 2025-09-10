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
  const { user, loading, hasActiveLicense, licenseData } = useLicenseAuth();
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-800" />
          <p className="text-muted-foreground">
            {showTimeout ? "Conexión lenta, redirigiendo..." : "Verificando licencia..."}
          </p>
          {showTimeout && (
            <button 
              onClick={() => window.location.href = '/license/onboarding'}
              className="mt-4 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
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

  // Redirect users with ACTIVE licenses away from pending/onboarding pages
  if (hasActiveLicense && licenseData?.status === 'ACTIVE') {
    const currentPath = window.location.pathname;
    if (currentPath === '/license/pending' || currentPath === '/license/onboarding') {
      return <Navigate to="/license/dashboard" replace />;
    }
  }

  if (requireActiveLicense && !hasActiveLicense) {
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