import { useEffect, useState, useCallback, lazy, Suspense, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { QuickStats } from "@/components/QuickStats";
import Ranking from "@/components/sections/Ranking";
import UrbanDecorations from "@/components/UrbanDecorations";
import LeagueSelector from "@/components/sections/LeagueSelector";

// Lazy load non-critical below-fold components
const StrategicAllies = lazy(() => import("@/components/StrategicAllies"));
const GymShowcase = lazy(() => import("@/components/sections/GymShowcase"));
const Footer = lazy(() => import("@/components/Footer"));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt"));
const FighterIDCallToAction = lazy(() => import("@/components/FighterIDCallToAction").then(m => ({ default: m.FighterIDCallToAction })));

const MemoHeader = memo(Header);
const MemoHero = memo(Hero);

const Index = () => {
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('UCC_MMA');

  const handleOrgChange = useCallback((value: string) => {
    setSelectedOrg(value);
  }, []);

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["strategic-partners"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("partners")
          .select("*")
          .in("tipo", ["Gimnasio", "Organización"])
          .eq("activo", true)
          .order("orden", { ascending: true });
        if (error) throw error;
        return data;
      },
      staleTime: 15 * 60 * 1000,
    });
  }, [queryClient]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['realtime-stats'] });
    queryClient.refetchQueries({ queryKey: ['realtime-stats'] });
  }, [queryClient]);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      requestAnimationFrame(() => {
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      });
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black urban-home overflow-x-hidden">
      <UrbanDecorations />
      <MemoHeader />
      <MemoHero />
      <Suspense fallback={null}>
        {user && <FighterIDCallToAction />}
      </Suspense>
      <QuickStats />
      <LeagueSelector value={selectedOrg} onChange={handleOrgChange} />
      <Ranking organizationCode={selectedOrg} />
      <Suspense fallback={null}>
        <GymShowcase />
        <StrategicAllies />
        <Footer />
        <PWAInstallPrompt />
      </Suspense>
    </div>
  );
};

export default Index;
