import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LicenseAuthProvider } from "@/hooks/useLicenseAuth";
import { PostAuthRouter } from "@/components/PostAuthRouter";
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import LicenseProtectedRoute from '@/components/LicenseProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import AdminDisciplineLayout from '@/components/AdminDisciplineLayout';
import LicenseLayout from '@/components/LicenseLayout';
import AdminCertLayout from '@/components/AdminCertLayout';
import SuperAdminRoute from './components/SuperAdminRoute';
import { lazy, Suspense, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { adminDisciplineRoutes } from '@/routes/adminDisciplineRoutes';

// === ALL pages lazy-loaded for optimal code splitting ===

// Auth & Profile
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ProfileHub = lazy(() => import('./pages/profile/ProfileHub'));
const ProfileSetup = lazy(() => import('./pages/profile/ProfileSetup'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ProfileChangeRequest = lazy(() => import('./pages/ProfileChangeRequest'));

// Public pages
const Index = lazy(() => import("./pages/Index"));
const SocialFeed = lazy(() => import("./pages/SocialFeed"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const EnVivo = lazy(() => import("./pages/EnVivo"));
const Fighters = lazy(() => import("./pages/Fighters"));
const FighterProfile = lazy(() => import('./pages/FighterProfile'));
const Contact = lazy(() => import("./pages/Contact"));
const Gimnasios = lazy(() => import("./pages/Gimnasios"));
const GimnasioDetalle = lazy(() => import("./pages/GimnasioDetalle"));
const Entrenadores = lazy(() => import("./pages/Entrenadores"));
const EntrenadorDetalle = lazy(() => import("./pages/EntrenadorDetalle"));
const Predicciones = lazy(() => import("./pages/Predicciones"));
const EventoBetting = lazy(() => import("./pages/EventoBetting"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const VerifyLicense = lazy(() => import('./pages/VerifyLicense'));
const HudPublicDisplay = lazy(() => import("./pages/HudPublicDisplay"));
const HudDemoDisplay = lazy(() => import("./pages/HudDemoDisplay"));
const ImportEvent = lazy(() => import("./pages/ImportEvent"));
const PublicFightResults = lazy(() => import('./pages/FightResults'));
const AIStrikeOverlay = lazy(() => import('./pages/AIStrikeOverlay'));

// Social
const SocialProfile = lazy(() => import("./pages/social/SocialProfile"));
const Friends = lazy(() => import("./pages/social/Friends"));
const Discover = lazy(() => import("./pages/social/Discover"));
const Notifications = lazy(() => import("./pages/social/Notifications"));
const SocialUserProfile = lazy(() => import("./pages/social/UserProfile"));

// Fighter License portal
const FighterLicense = lazy(() => import('./pages/FighterLicense').then(m => ({ default: m.FighterLicense })));
const LicenseDashboard = lazy(() => import('./pages/license/LicenseDashboard'));
const LicensePending = lazy(() => import('./pages/license/LicensePending'));
const LicenseSuspended = lazy(() => import('./pages/license/LicenseSuspended'));
const LicenseOnboarding = lazy(() => import('./pages/license/LicenseOnboarding'));
const LicenseForgotPassword = lazy(() => import("./pages/license/ForgotPassword"));
const LicenseResetPassword = lazy(() => import("./pages/license/ResetPassword"));

// Judge & Referee
const JudgeProtectedRoute = lazy(() => import('@/components/JudgeProtectedRoute').then(m => ({ default: m.JudgeProtectedRoute })));
const DigitalScorecard = lazy(() => import('./pages/judge/DigitalScorecard'));
const RefereeControlRoom = lazy(() => import('./pages/referee/RefereeControlRoom'));
const JudgeScoringPanel = lazy(() => import('./pages/judge/JudgeScoringPanel'));
const JudgeOnboarding = lazy(() => import("./pages/judge/JudgeOnboarding"));

// Time Master
const TimeMaster = lazy(() => import("./pages/TimeMaster"));

// SPARC (Sparring Performance Assessment & Ranking Circuit)
const SparcHub = lazy(() => import("./pages/sparc/SparcHub"));
const SparcLiveFight = lazy(() => import("./pages/sparc/SparcLiveFight"));
const SparcRankings = lazy(() => import("./pages/sparc/SparcRankings"));
const SparcAdmin = lazy(() => import("./pages/sparc/SparcAdmin"));
const SparcDashboard = lazy(() => import("./pages/sparc/SparcDashboard"));

// ARENA — Competition Layer (consumes SPARC integrity backend)
const ArenaLanding = lazy(() => import("./pages/arena/ArenaLanding"));
const ArenaSessionDashboard = lazy(() => import("./pages/arena/ArenaSessionDashboard"));
const ArenaPublicWatch = lazy(() => import("./pages/arena/ArenaPublicWatch"));


// Stations
const StationPinLogin = lazy(() => import('@/components/station/StationPinLogin').then(m => ({ default: m.StationPinLogin })));
const StationWaiting = lazy(() => import('@/pages/station/StationWaiting'));
const Station1Scoring = lazy(() => import('@/pages/station/Station1Scoring'));
const Station2Scoring = lazy(() => import('@/pages/station/Station2Scoring'));
const Station3RoundControl = lazy(() => import('@/pages/station/Station3RoundControl'));

// Admin pages — only those used directly inside App.tsx (general /admin/* surface).
// Discipline-specific pages are lazy-loaded inside @/routes/adminDisciplineRoutes.
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Configuracion = lazy(() => import("./pages/admin/Configuracion"));
const UserRoles = lazy(() => import('./pages/admin/UserRoles'));
const SystemAssets = lazy(() => import("./pages/admin/SystemAssets"));
const ContactInbox = lazy(() => import("./pages/admin/ContactInbox"));
const ApprovalQueue = lazy(() => import("./pages/admin/ApprovalQueue"));


// Gym pages
const GymDashboard = lazy(() => import("./pages/gym/GymDashboard"));
const GymFightersPage = lazy(() => import("./pages/gym/GymFighters"));
const GymStaffManagement = lazy(() => import("./pages/gym/GymStaffManagement"));
const GymAddFighter = lazy(() => import("./pages/gym/GymAddFighter"));
const GymOnboarding = lazy(() => import("./pages/gym/GymOnboarding"));
const GymPendingInvitation = lazy(() => import("./pages/gym/GymPendingInvitation"));
const RequestFight = lazy(() => import("./pages/gym/RequestFight"));
const TrainerOnboarding = lazy(() => import("./pages/gym/TrainerOnboarding"));

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
  // Global error handler for unhandled promise rejections.
  // We still call preventDefault to avoid noisy browser overlays, but we
  // surface the error via sonner so users + devs see something happened
  // instead of the previous silent swallow.
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason?.message ?? String(reason);
      // Skip noisy auth refresh errors that recover automatically
      const isBenign = /AbortError|Failed to fetch|NetworkError/i.test(message);
      console.error('[GLOBAL ERROR] Unhandled promise rejection:', reason);
      if (!isBenign && import.meta.env.PROD) {
        // dynamic import to avoid pulling sonner into the critical path
        import('sonner').then(({ toast }) => {
          toast.error('Algo salió mal. Intenta de nuevo.', {
            description: message?.slice(0, 120),
          });
        }).catch(() => {});
      }
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
            <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Platform Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/social/feed" element={<SocialFeed />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/license/callback" element={<AuthCallback />} />
              <Route path="/eventos" element={<Events />} />
              <Route path="/en-vivo" element={<EnVivo />} />
              <Route path="/evento/:eventId" element={<EventDetail />} />
              <Route path="/fighters" element={<Fighters />} />
              <Route path="/fighter/:id" element={<FighterProfile />} />
              <Route path="/resultados" element={<PublicFightResults />} />
              <Route path="/social/friends" element={<Friends />} />
              <Route path="/social/discover" element={<Discover />} />
              <Route path="/social/notifications" element={<Notifications />} />
              <Route path="/social/profile" element={<SocialProfile />} />
              <Route path="/social/profile/:id" element={<SocialUserProfile />} />
              <Route path="/verify/license/:licenseNumber" element={<VerifyLicense />} />
              <Route path="/import-event" element={<ImportEvent />} />
              <Route path="/predicciones" element={<Predicciones />} />
              <Route path="/evento/:eventId/betting" element={<EventoBetting />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/profile/hub" element={
                <ProtectedRoute><ProfileHub /></ProtectedRoute>
              } />
              
              {/* Gimnasios */}
              <Route path="/gimnasios" element={<Gimnasios />} />
              <Route path="/gimnasios/:slug" element={<GimnasioDetalle />} />

              {/* Legacy /dashboard → profile hub */}
              <Route path="/dashboard" element={<Navigate to="/profile" replace />} />

              {/* Gym Dashboard */}
              <Route path="/gym/:gymId/dashboard" element={<ProtectedRoute><GymDashboard /></ProtectedRoute>} />
              <Route path="/gym/:gymId/fighters" element={<ProtectedRoute><GymFightersPage /></ProtectedRoute>} />
              <Route path="/gym/:gymId/staff" element={<ProtectedRoute><GymStaffManagement /></ProtectedRoute>} />
              <Route path="/gym/:gymId/add-fighter" element={<ProtectedRoute><GymAddFighter /></ProtectedRoute>} />
              <Route path="/gym/request-fight" element={<ProtectedRoute><RequestFight /></ProtectedRoute>} />

              <Route path="/entrenadores" element={<Entrenadores />} />
              <Route path="/entrenadores/:slug" element={<EntrenadorDetalle />} />

              {/* Gym & Judge Onboarding */}
              <Route path="/gym/onboarding" element={<ProtectedRoute><GymOnboarding /></ProtectedRoute>} />
              <Route path="/gym/pending-invitation" element={<ProtectedRoute><GymPendingInvitation /></ProtectedRoute>} />
              <Route path="/judge/onboarding" element={<ProtectedRoute><JudgeOnboarding /></ProtectedRoute>} />
              
              {/* HUD & AI Overlay */}
              <Route path="/hud/fight/:fightId" element={<HudPublicDisplay />} />
              <Route path="/vision3d" element={<HudPublicDisplay />} />
              <Route path="/hud/demo" element={<HudDemoDisplay />} />
              <Route path="/ai-overlay" element={<AIStrikeOverlay />} />
              <Route path="/ai-strike-overlay" element={<AIStrikeOverlay />} />

              {/* Time Master */}
              <Route path="/time-master" element={<ProtectedRoute><TimeMaster /></ProtectedRoute>} />
              

              {/* Stations */}
              <Route path="/estacion/:stationNumber" element={<StationPinLogin />} />
              <Route path="/estacion/:stationNumber/waiting" element={<StationWaiting />} />
              <Route path="/estacion/1/scoring/:fightId" element={<Station1Scoring />} />
              <Route path="/estacion/2/scoring/:fightId" element={<Station2Scoring />} />
              <Route path="/estacion/3/control/:fightId" element={<Station3RoundControl />} />

              {/* Fighter License Portal */}
              <Route path="/license/welcome" element={<Navigate to="/auth?role=fighter" replace />} />
              <Route path="/license/auth" element={<Navigate to="/auth?role=fighter" replace />} />
              <Route path="/license/request" element={<Navigate to="/license/onboarding" replace />} />
              <Route path="/license/forgot-password" element={<LicenseForgotPassword />} />
              <Route path="/license/reset-password" element={<LicenseResetPassword />} />
              <Route path="/license/onboarding" element={<LicenseProtectedRoute><LicenseOnboarding /></LicenseProtectedRoute>} />
              <Route path="/license/pending" element={<LicenseProtectedRoute><LicensePending /></LicenseProtectedRoute>} />
              <Route path="/license/suspended" element={<LicenseProtectedRoute><LicenseSuspended /></LicenseProtectedRoute>} />
              
              <Route path="/license" element={<LicenseProtectedRoute requireActiveLicense><LicenseLayout /></LicenseProtectedRoute>}>
                <Route index element={<Navigate to="/license/dashboard" replace />} />
                <Route path="dashboard" element={<LicenseDashboard />} />
              </Route>

              {/* Profile */}
              <Route path="/profile/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/perfil" element={<Navigate to="/profile" replace />} />
              <Route path="/profile/request-changes" element={<ProtectedRoute><ProfileChangeRequest /></ProtectedRoute>} />
              <Route path="/fighter/me" element={<Navigate to="/profile" replace />} />
              <Route path="/fighters/me" element={<Navigate to="/profile" replace />} />
              <Route path="/fighters/license/:id" element={<ProtectedRoute><FighterLicense /></ProtectedRoute>} />

              {/* Admin Cert */}
              <Route path="/admin-cert/*" element={<AdminProtectedRoute><AdminCertLayout /></AdminProtectedRoute>} />

              {/* Admin — Discipline Panels (MMA + Boxeo share the same surface) */}
              <Route path="/admin/mma" element={
                <AdminProtectedRoute>
                  <AdminDisciplineLayout discipline="MMA" />
                </AdminProtectedRoute>
              }>
                {adminDisciplineRoutes({ includeAi: true })}
              </Route>

              <Route path="/admin/boxeo" element={
                <AdminProtectedRoute>
                  <AdminDisciplineLayout discipline="Boxeo" />
                </AdminProtectedRoute>
              }>
                {adminDisciplineRoutes({ includeAi: false })}
              </Route>

              {/* Admin — General (selector + system) */}
              <Route path="/admin/*" element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="cola-aprobacion" element={<ApprovalQueue />} />
                      <Route path="configuracion" element={<SuperAdminRoute><Configuracion /></SuperAdminRoute>} />
                      <Route path="user-roles" element={<SuperAdminRoute><UserRoles /></SuperAdminRoute>} />
                      <Route path="system-assets" element={<SuperAdminRoute><SystemAssets /></SuperAdminRoute>} />
                      <Route path="inbox" element={<ContactInbox />} />
                      {/* Legacy redirects */}
                      <Route path="eventos-pelea" element={<Navigate to="/admin/mma/eventos-pelea" replace />} />
                      <Route path="fighters-profiles" element={<Navigate to="/admin/mma/fighters-profiles" replace />} />
                      <Route path="fighters" element={<Navigate to="/admin/mma/fighters-profiles" replace />} />
                      <Route path="rankings" element={<Navigate to="/admin/mma/rankings" replace />} />
                      <Route path="gimnasios" element={<Navigate to="/admin/mma/gimnasios" replace />} />
                    </Routes>
                  </AdminLayout>
                </AdminProtectedRoute>
              } />

              {/* Judge & Referee */}
              <Route path="/judge/scorecard/:fightId" element={<DigitalScorecard />} />
              <Route path="/judge/fight/:fightId" element={<JudgeScoringPanel />} />
              <Route path="/referee/control/:fightId" element={<RefereeControlRoom />} />

              {/* SPARC */}
              <Route path="/sparc" element={<SparcHub />} />
              <Route path="/sparc/live/:fightId" element={<ProtectedRoute><SparcLiveFight /></ProtectedRoute>} />
              <Route path="/sparc/rankings" element={<SparcRankings />} />
              <Route path="/sparc/admin" element={<ProtectedRoute><SparcAdmin /></ProtectedRoute>} />
              <Route path="/sparc/dashboard/:sessionId" element={<ProtectedRoute><SparcDashboard /></ProtectedRoute>} />

              {/* ARENA — Competition Layer */}
              <Route path="/arena" element={<ArenaLanding />} />
              <Route path="/arena/session/:sessionId" element={<ProtectedRoute><ArenaSessionDashboard /></ProtectedRoute>} />
              <Route path="/arena/live/:fightId" element={<ProtectedRoute><SparcLiveFight /></ProtectedRoute>} />
              <Route path="/arena/watch/:fightId" element={<ArenaPublicWatch />} />

              {/* Misc */}
              <Route path="/access-denied" element={<AccessDenied />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </TooltipProvider>
        </LicenseAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
  );
};

export default App;
