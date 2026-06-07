import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAdmin, loading, error } = useAdmin();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated → send to login with redirect back to /admin
  if (!user) {
    return <Navigate to="/auth?redirect=/admin" replace />;
  }

  if (error || isAdmin === false) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
