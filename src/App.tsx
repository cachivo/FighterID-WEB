import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LicenseAuthProvider } from "@/hooks/useLicenseAuth";
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import LicenseProtectedRoute from '@/components/LicenseProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import LicenseLayout from '@/components/LicenseLayout';
import AdminCertLayout from '@/components/AdminCertLayout';
import { FighterLicense } from './pages/FighterLicense';
import FighterMe from './pages/FighterMe';
import MyProfile from './pages/MyProfile';
import UserProfile from './pages/UserProfile';
import FighterProfile from './pages/FighterProfile';
import ProfileSetup from './pages/profile/ProfileSetup';
import VerifyLicense from './pages/VerifyLicense';
import ValidacionLicencias from './pages/admin/ValidacionLicencias';
import AdminFighters from './pages/admin/Fighters';
import JudgesManagement from './pages/admin/JudgesManagement';
import LiveEventsControl from './pages/admin/LiveEventsControl';
import ProfileChangeRequests from './pages/admin/ProfileChangeRequests';
import ProfileChangeRequest from './pages/ProfileChangeRequest';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy loaded components
const FightResults = lazy(() => import('./pages/admin/FightResults'));
const DigitalScorecard = lazy(() => import('./pages/judge/DigitalScorecard'));
const RefereeControlRoom = lazy(() => import('./pages/referee/RefereeControlRoom'));
import LicenseAuth from './pages/license/LicenseAuth';
import LicenseDashboard from './pages/license/LicenseDashboard';
import LicensePending from './pages/license/LicensePending';
import LicenseSuspended from './pages/license/LicenseSuspended';
import LicenseOnboarding from './pages/license/LicenseOnboarding';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Predicciones from "./pages/Predicciones";
import EventoBetting from "./pages/EventoBetting";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Fighters from "./pages/Fighters";
import SocialFeed from "./pages/SocialFeed";
import ImportEvent from "./pages/ImportEvent";
import Dashboard from "./pages/admin/Dashboard";
import EventosDeportivos from "./pages/admin/EventosDeportivos";
import EventosPelea from "./pages/admin/EventosPelea";
import EventosDigitales from "./pages/admin/EventosDigitales";

import AliadosEstrategicos from "./pages/admin/AliadosEstrategicos";
import Ranking from "./pages/admin/Ranking";
import Comunidad from "./pages/admin/Comunidad";
import Configuracion from "./pages/admin/Configuracion";
import Votaciones from "./pages/admin/Votaciones";
import Betting from "./pages/admin/Betting";
import NotFound from "./pages/NotFound";
import AccessDenied from "./pages/AccessDenied";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;
        return true;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <LicenseAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public Platform Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/eventos" element={<Events />} />
              <Route path="/evento/:eventId" element={<EventDetail />} />
              <Route path="/fighters" element={<Fighters />} />
              <Route path="/fighter/:id" element={<FighterProfile />} />
              <Route path="/social" element={<SocialFeed />} />
              <Route path="/verify/license/:licenseNumber" element={<VerifyLicense />} />
              <Route path="/import-event" element={<ImportEvent />} />
              <Route path="/predicciones" element={<Predicciones />} />
              <Route path="/evento/:eventId/betting" element={<EventoBetting />} />

              {/* Fighter License Portal Routes */}
              <Route path="/license/auth" element={<LicenseAuth />} />
              <Route path="/license/onboarding" element={
                <LicenseProtectedRoute>
                  <LicenseOnboarding />
                </LicenseProtectedRoute>
              } />
              <Route path="/license/pending" element={
                <LicenseProtectedRoute>
                  <LicensePending />
                </LicenseProtectedRoute>
              } />
              <Route path="/license/suspended" element={
                <LicenseProtectedRoute>
                  <LicenseSuspended />
                </LicenseProtectedRoute>
              } />
              
              {/* Protected License Routes with Layout */}
              <Route path="/license" element={
                <LicenseProtectedRoute requireActiveLicense>
                  <LicenseLayout />
                </LicenseProtectedRoute>
              }>
                <Route index element={<Navigate to="/license/dashboard" replace />} />
                <Route path="dashboard" element={<LicenseDashboard />} />
              </Route>

              {/* Profile Setup Route - For regular users */}
              <Route path="/profile/setup" element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              } />

              {/* User Profile Route - General profile for all users */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />

              {/* Profile Change Request Route */}
              <Route path="/profile/request-changes" element={
                <ProtectedRoute>
                  <ProfileChangeRequest />
                </ProtectedRoute>
              } />

              {/* Legacy Fighter Profile Routes (maintained for compatibility) */}
              <Route path="/fighter/me" element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              } />
              
              {/* Legacy Fighter Routes (maintained for compatibility) */}
              <Route path="/fighters/me" element={
                <ProtectedRoute>
                  <FighterMe />
                </ProtectedRoute>
              } />
              <Route path="/fighters/license/:id" element={
                <ProtectedRoute>
                  <FighterLicense />
                </ProtectedRoute>
              } />

              {/* Admin Certification Panel Routes */}
              <Route path="/admin-cert/*" element={
                <AdminProtectedRoute>
                  <AdminCertLayout />
                </AdminProtectedRoute>
              } />

              {/* General Admin Routes */}
              <Route path="/admin/*" element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/eventos-deportivos" element={<EventosDeportivos />} />
                      <Route path="/eventos-pelea" element={<EventosPelea />} />
                      <Route path="/eventos-digitales" element={<EventosDigitales />} />
                      
                      <Route path="/aliados-estrategicos" element={<AliadosEstrategicos />} />
                      <Route path="/fighters" element={<AdminFighters />} />
                      <Route path="/judges" element={<JudgesManagement />} />
                      <Route path="/live-events" element={<LiveEventsControl />} />
                      <Route path="/fight-results" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <FightResults />
                        </Suspense>
                      } />
                      <Route path="/ranking" element={<Ranking />} />
                      <Route path="/votaciones" element={<Votaciones />} />
                      <Route path="/betting" element={<Betting />} />
                      <Route path="/comunidad" element={<Comunidad />} />
                      <Route path="/configuracion" element={<Configuracion />} />
                      <Route path="/licencias" element={<ValidacionLicencias />} />
                      <Route path="/profile-requests" element={<ProfileChangeRequests />} />
                    </Routes>
                  </AdminLayout>
                </AdminProtectedRoute>
              } />

              {/* Judge and Referee Routes */}
              <Route path="/judge/scorecard/:fightId" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <DigitalScorecard />
                </Suspense>
              } />
              <Route path="/referee/control/:fightId" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <RefereeControlRoom />
                </Suspense>
              } />

              {/* Access Denied Route */}
              <Route path="/access-denied" element={<AccessDenied />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </LicenseAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
