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
// ProfileChangeRequests eliminado - consolidado en PendingChangesHub
import PendingChangesHub from './pages/admin/PendingChangesHub';
import ProfileChangeRequest from './pages/ProfileChangeRequest';
import AIStrikeMonitor from './pages/admin/AIStrikeMonitor';
import SuperAdminRoute from './components/SuperAdminRoute';
import AIStrikeTestPanel from './pages/admin/AIStrikeTestPanel';
import AIStrikeOverlay from './pages/AIStrikeOverlay';
import { lazy, Suspense, useEffect } from 'react';
import React from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StationPinLogin } from '@/components/station/StationPinLogin';
import StationWaiting from '@/pages/station/StationWaiting';
import Station1Scoring from '@/pages/station/Station1Scoring';
import Station2Scoring from '@/pages/station/Station2Scoring';
import Station3RoundControl from '@/pages/station/Station3RoundControl';

// Lazy loaded components
const FightResults = lazy(() => import('./pages/admin/FightResults'));
const PublicFightResults = lazy(() => import('./pages/FightResults'));
const DigitalScorecard = lazy(() => import('./pages/judge/DigitalScorecard'));
const RefereeControlRoom = lazy(() => import('./pages/referee/RefereeControlRoom'));
const UserRoles = lazy(() => import('./pages/admin/UserRoles'));
const JudgeScoringPanel = lazy(() => import('./pages/judge/JudgeScoringPanel'));
const JudgeStationsSetup = lazy(() => import('./pages/admin/JudgeStationsSetup'));
import LicenseAuth from './pages/license/LicenseAuth';
import LicenseDashboard from './pages/license/LicenseDashboard';
import LicensePending from './pages/license/LicensePending';
import LicenseSuspended from './pages/license/LicenseSuspended';
import LicenseOnboarding from './pages/license/LicenseOnboarding';
import Index from "./pages/Index";
import SocialFeed from "./pages/SocialFeed";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
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
import Betting from "./pages/admin/Betting";
import EmailMonitoring from "./pages/admin/EmailMonitoring";
import EmailValidation from "./pages/admin/EmailValidation";
import EmailCampaigns from "./pages/admin/EmailCampaigns";
import EmailCampaignDetail from "./pages/admin/EmailCampaignDetail";
import EmailCampaignEditor from "./pages/admin/EmailCampaignEditor";
import NotFound from "./pages/NotFound";
import AccessDenied from "./pages/AccessDenied";
import Contact from "./pages/Contact";
import Gimnasios from "./pages/Gimnasios";
import GimnasioDetalle from "./pages/GimnasioDetalle";
import Entrenadores from "./pages/Entrenadores";
import EntrenadorDetalle from "./pages/EntrenadorDetalle";
import GimnasiosAdmin from "./pages/admin/GimnasiosAdmin";
import EntrenadoresAdmin from "./pages/admin/EntrenadoresAdmin";

// Gym domain pages (lazy)
const GymDashboard = lazy(() => import("./pages/gym/GymDashboard"));
const GymFightersPage = lazy(() => import("./pages/gym/GymFighters"));
const GymStaffManagement = lazy(() => import("./pages/gym/GymStaffManagement"));
const GymAddFighter = lazy(() => import("./pages/gym/GymAddFighter"));

// Lazy load RankingsManagement
const RankingsManagement = lazy(() => import("./pages/admin/RankingsManagement"));
const SystemAssets = lazy(() => import("./pages/admin/SystemAssets"));
const OfficialsManagement = lazy(() => import("./pages/admin/OfficialsManagement"));
const OrganizationsManagement = lazy(() => import("./pages/admin/OrganizationsManagement"));

// Lazy load ContactInbox
const ContactInbox = lazy(() => import("./pages/admin/ContactInbox"));

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

const App = () => {
  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[GLOBAL ERROR] Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return (
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
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              {/* License auth callback - handles confirmation redirects */}
              <Route path="/license/callback" element={<AuthCallback />} />
              <Route path="/eventos" element={<Events />} />
              <Route path="/evento/:eventId" element={<EventDetail />} />
              <Route path="/fighters" element={<Fighters />} />
              <Route path="/fighter/:id" element={<FighterProfile />} />
              <Route path="/resultados" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PublicFightResults />
                </Suspense>
              } />
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
              <Route path="/contacto" element={<Contact />} />
              
              {/* Rutas de Gimnasios */}
              <Route path="/gimnasios" element={<Gimnasios />} />
              <Route path="/gimnasios/:slug" element={<GimnasioDetalle />} />

              {/* Gym Dashboard (staff privado) */}
              <Route path="/gym/:gymId/dashboard" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <GymDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/gym/:gymId/fighters" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <GymFightersPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/gym/:gymId/staff" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <GymStaffManagement />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/gym/:gymId/add-fighter" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <GymAddFighter />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Rutas de Entrenadores */}
              <Route path="/entrenadores" element={<Entrenadores />} />
              <Route path="/entrenadores/:slug" element={<EntrenadorDetalle />} />
              
              {/* HUD Público de Scoring en Vivo */}
              <Route path="/hud/fight/:fightId" element={<HudPublicDisplay />} />
              
              {/* AI Strike Detection Overlay - Público para OBS/Transmisión */}
              <Route path="/ai-overlay" element={<AIStrikeOverlay />} />
              <Route path="/ai-strike-overlay" element={<AIStrikeOverlay />} />

              {/* Rutas de Estaciones con PIN (sin autenticación) */}
              <Route path="/estacion/:stationNumber" element={<StationPinLogin />} />
              <Route path="/estacion/:stationNumber/waiting" element={<StationWaiting />} />
              <Route path="/estacion/1/scoring/:fightId" element={<Station1Scoring />} />
              <Route path="/estacion/2/scoring/:fightId" element={<Station2Scoring />} />
              <Route path="/estacion/3/control/:fightId" element={<Station3RoundControl />} />

              {/* Fighter License Portal Routes */}
              <Route path="/license/welcome" element={<Navigate to="/license/auth?mode=signup" replace />} />
              <Route path="/license/auth" element={<LicenseAuth />} />
              {/* Redirect old license request route to unified onboarding */}
              <Route path="/license/request" element={<Navigate to="/license/onboarding" replace />} />
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
                      <Route path="/betting" element={<Betting />} />
                      <Route path="/email-monitoring" element={<EmailMonitoring />} />
                      <Route path="/email-validation" element={<EmailValidation />} />
                      <Route path="/email-campaigns" element={<EmailCampaigns />} />
                      <Route path="/email-campaigns/:id" element={<EmailCampaignDetail />} />
                      <Route path="/email-campaigns/editor" element={<EmailCampaignEditor />} />
                      <Route path="/email-campaigns/editor/:id" element={<EmailCampaignEditor />} />
                      <Route path="/inbox" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <ContactInbox />
                        </Suspense>
                      } />
                      <Route path="/comunidad" element={<Comunidad />} />
                      <Route path="/configuracion" element={
                        <SuperAdminRoute><Configuracion /></SuperAdminRoute>
                      } />
                      <Route path="/licencias" element={<ValidacionLicencias />} />
                      {/* Ruta /profile-requests eliminada - consolidada en /pending-changes */}
                      <Route path="/user-roles" element={
                        <SuperAdminRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <UserRoles />
                          </Suspense>
                        </SuperAdminRoute>
                      } />
                      <Route path="/system-assets" element={
                        <SuperAdminRoute>
                          <Suspense fallback={<LoadingSpinner />}>
                            <SystemAssets />
                          </Suspense>
                        </SuperAdminRoute>
                      } />
                      <Route path="/ai-strike-monitor" element={<AIStrikeMonitor />} />
                      <Route path="/ai-strike-test" element={<AIStrikeTestPanel />} />
                      <Route path="/gimnasios" element={<GimnasiosAdmin />} />
                      <Route path="/entrenadores" element={<EntrenadoresAdmin />} />
                       <Route path="/rankings" element={
                         <Suspense fallback={<LoadingSpinner />}>
                           <RankingsManagement />
                         </Suspense>
                       } />
                       <Route path="/officials" element={
                         <Suspense fallback={<LoadingSpinner />}>
                           <OfficialsManagement />
                         </Suspense>
                       } />
                       <Route path="/organizations" element={
                         <Suspense fallback={<LoadingSpinner />}>
                           <OrganizationsManagement />
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
};

export default App;
