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
import { DesktopOnlyRoute } from '@/components/DesktopOnlyRoute';
import { JudgeProtectedRoute } from '@/components/JudgeProtectedRoute';
import { FighterLicense } from './pages/FighterLicense';
import FighterMe from './pages/FighterMe';
import MyProfile from './pages/MyProfile';
import UserProfile from './pages/UserProfile';
import FighterProfile from './pages/FighterProfile';
import ProfileSetup from './pages/profile/ProfileSetup';
import VerifyLicense from './pages/VerifyLicense';
import ValidacionLicencias from './pages/admin/ValidacionLicencias';
import AdminFightersProfiles from './pages/admin/FightersProfiles';
import FightersProfilesInvite from './pages/admin/FightersProfilesInvite';
import FightersProfilesCreate from './pages/admin/FightersProfilesCreate';
import JudgesManagement from './pages/admin/JudgesManagement';
import LiveEventsControl from './pages/admin/LiveEventsControl';
import ProfileChangeRequests from './pages/admin/ProfileChangeRequests';
import PendingChangesHub from './pages/admin/PendingChangesHub';
import ProfileChangeRequest from './pages/ProfileChangeRequest';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StationPinLogin } from '@/components/station/StationPinLogin';
import StationWaiting from '@/pages/station/StationWaiting';

// Lazy loaded components
const FightResults = lazy(() => import('./pages/admin/FightResults'));
const DigitalScorecard = lazy(() => import('./pages/judge/DigitalScorecard'));
const RefereeControlRoom = lazy(() => import('./pages/referee/RefereeControlRoom'));
const UserRoles = lazy(() => import('./pages/admin/UserRoles'));
const JudgeScoringPanel = lazy(() => import('./pages/judge/JudgeScoringPanel'));
const JudgeStationsSetup = lazy(() => import('./pages/admin/JudgeStationsSetup'));
import LicenseAuth from './pages/license/LicenseAuth';
import LicenseWelcome from './pages/license/LicenseWelcome';
import LicenseDashboard from './pages/license/LicenseDashboard';
import LicensePending from './pages/license/LicensePending';
import LicenseSuspended from './pages/license/LicenseSuspended';
import LicenseOnboarding from './pages/license/LicenseOnboarding';
import Index from "./pages/Index";
import SmartHomepage from "./pages/SmartHomepage";
import SocialFeed from "./pages/SocialFeed";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Predicciones from "./pages/Predicciones";
import EventoBetting from "./pages/EventoBetting";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Fighters from "./pages/Fighters";
import SocialProfile from "./pages/social/SocialProfile";
import Friends from "./pages/social/Friends";
import Discover from "./pages/social/Discover";
import Notifications from "./pages/social/Notifications";
import SocialUserProfile from "./pages/social/UserProfile";
import TestNewsFunction from "./pages/TestNewsFunction";
import ImportEvent from "./pages/ImportEvent";
import Dashboard from "./pages/admin/Dashboard";
import EventosPelea from "./pages/admin/EventosPelea";
import LicenseForgotPassword from "./pages/license/ForgotPassword";
import LicenseResetPassword from "./pages/license/ResetPassword";
import HudPublicDisplay from "./pages/HudPublicDisplay";

import AliadosEstrategicos from "./pages/admin/AliadosEstrategicos";
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
              <Route path="/social/feed" element={<SocialFeed />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/eventos" element={<Events />} />
              <Route path="/evento/:eventId" element={<EventDetail />} />
              <Route path="/fighters" element={<Fighters />} />
              <Route path="/fighter/:id" element={<FighterProfile />} />
              <Route path="/social/friends" element={<Friends />} />
              <Route path="/social/discover" element={<Discover />} />
              <Route path="/social/notifications" element={<Notifications />} />
              <Route path="/social/profile" element={<SocialProfile />} />
              <Route path="/social/profile/:id" element={<SocialUserProfile />} />
              <Route path="/test-news" element={<TestNewsFunction />} />
              <Route path="/verify/license/:licenseNumber" element={<VerifyLicense />} />
              <Route path="/import-event" element={<ImportEvent />} />
              <Route path="/predicciones" element={<Predicciones />} />
              <Route path="/evento/:eventId/betting" element={<EventoBetting />} />
              
              {/* HUD Público de Scoring en Vivo */}
              <Route path="/hud/fight/:fightId" element={<HudPublicDisplay />} />

              {/* Rutas de Estaciones con PIN (sin autenticación) */}
              <Route path="/estacion/:stationNumber" element={<StationPinLogin />} />
              <Route path="/estacion/:stationNumber/waiting" element={<StationWaiting />} />

              {/* Fighter License Portal Routes */}
              <Route path="/license/welcome" element={<LicenseWelcome />} />
              <Route path="/license/auth" element={<LicenseAuth />} />
              <Route path="/license/forgot-password" element={<LicenseForgotPassword />} />
              <Route path="/license/reset-password" element={<LicenseResetPassword />} />
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

              {/* Unified Profile Route - Central hub for user and fighter info */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              
              {/* Alias for profile (backwards compatibility) */}
              <Route path="/perfil" element={<Navigate to="/profile" replace />} />

              {/* Profile Change Request Route */}
              <Route path="/profile/request-changes" element={
                <ProtectedRoute>
                  <ProfileChangeRequest />
                </ProtectedRoute>
              } />

              {/* Legacy Fighter Routes - Redirect to unified profile */}
              <Route path="/fighter/me" element={<Navigate to="/profile" replace />} />
              <Route path="/fighters/me" element={<Navigate to="/profile" replace />} />
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
                      <Route path="eventos-pelea" element={<EventosPelea />} />
                      <Route path="eventos-deportivos" element={<Navigate to="/admin/eventos-pelea" replace />} />
                      <Route path="aliados-estrategicos" element={<AliadosEstrategicos />} />
                      <Route path="/fighters" element={<AdminFightersProfiles />} />
                      <Route path="/fighters-profiles" element={<AdminFightersProfiles />} />
                      <Route path="/fighters-profiles/invite" element={<FightersProfilesInvite />} />
                      <Route path="/fighters-profiles/create" element={<FightersProfilesCreate />} />
                      <Route path="/judges" element={<JudgesManagement />} />
                      <Route path="/scoring/stations" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <JudgeStationsSetup />
                        </Suspense>
                      } />
                      <Route path="/live-events" element={<LiveEventsControl />} />
                      <Route path="/pending-changes" element={<PendingChangesHub />} />
                      <Route path="/fight-results" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <FightResults />
                        </Suspense>
                      } />
                      <Route path="/votaciones" element={<Votaciones />} />
                      <Route path="/betting" element={<Betting />} />
                      <Route path="/comunidad" element={<Comunidad />} />
                      <Route path="/configuracion" element={<Configuracion />} />
                      <Route path="/licencias" element={<ValidacionLicencias />} />
                      <Route path="/profile-requests" element={<ProfileChangeRequests />} />
                      <Route path="/user-roles" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <UserRoles />
                        </Suspense>
                      } />
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
              
              {/* Desktop Scoring Panel - Ahora usa validación de sesión interna */}
              <Route path="/judge/fight/:fightId" element={
                <DesktopOnlyRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <JudgeScoringPanel />
                  </Suspense>
                </DesktopOnlyRoute>
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
