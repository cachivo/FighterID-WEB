import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LicenseAuthProvider } from "@/hooks/useLicenseAuth";
import ProtectedRoute from '@/components/ProtectedRoute';
import LicenseProtectedRoute from '@/components/LicenseProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import LicenseLayout from '@/components/LicenseLayout';
import AdminCertLayout from '@/components/AdminCertLayout';
import { FighterLicense } from './pages/FighterLicense';
import FighterMe from './pages/FighterMe';
import VerifyLicense from './pages/VerifyLicense';
import ValidacionLicencias from './pages/admin/ValidacionLicencias';
import LicenseAuth from './pages/license/LicenseAuth';
import LicenseDashboard from './pages/license/LicenseDashboard';
import LicensePending from './pages/license/LicensePending';
import LicenseOnboarding from './pages/license/LicenseOnboarding';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Predicciones from "./pages/Predicciones";
import EventoBetting from "./pages/EventoBetting";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Fighters from "./pages/Fighters";
import ImportEvent from "./pages/ImportEvent";
import Dashboard from "./pages/admin/Dashboard";
import EventosDeportivos from "./pages/admin/EventosDeportivos";
import EventosDigitales from "./pages/admin/EventosDigitales";
import Servicios from "./pages/admin/Servicios";
import Ranking from "./pages/admin/Ranking";
import Comunidad from "./pages/admin/Comunidad";
import Configuracion from "./pages/admin/Configuracion";
import Votaciones from "./pages/admin/Votaciones";
import Betting from "./pages/admin/Betting";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LicenseAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Platform Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/eventos" element={<Events />} />
              <Route path="/evento/:eventId" element={<EventDetail />} />
              <Route path="/fighters" element={<Fighters />} />
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
              
              {/* Protected License Routes with Layout */}
              <Route path="/license" element={
                <LicenseProtectedRoute requireActiveLicense>
                  <LicenseLayout />
                </LicenseProtectedRoute>
              }>
                <Route index element={<Navigate to="/license/dashboard" replace />} />
                <Route path="dashboard" element={<LicenseDashboard />} />
              </Route>

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
                <ProtectedRoute>
                  <AdminCertLayout />
                </ProtectedRoute>
              } />

              {/* General Admin Routes */}
              <Route path="/admin/*" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/eventos-deportivos" element={<EventosDeportivos />} />
                      <Route path="/eventos-digitales" element={<EventosDigitales />} />
                      <Route path="/servicios" element={<Servicios />} />
                      <Route path="/ranking" element={<Ranking />} />
                      <Route path="/votaciones" element={<Votaciones />} />
                      <Route path="/betting" element={<Betting />} />
                      <Route path="/comunidad" element={<Comunidad />} />
                      <Route path="/configuracion" element={<Configuracion />} />
                      <Route path="/licencias" element={<ValidacionLicencias />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LicenseAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
