import { useEffect, lazy, Suspense, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHero from "@/components/landing/Hero";
import QuickStatsStrip from "@/components/landing/QuickStatsStrip";
import SectionPanel from "@/components/landing/SectionPanel";
import Ranking from "@/components/sections/Ranking";
import SparcRanking from "@/components/sections/SparcRanking";
import ArenaSpotlight from "@/components/landing/ArenaSpotlight";
import { LazyMount } from "@/components/LazyMount";
import { SectionDivider } from "@/components/landing/SectionDivider";
import { useLenisScroll } from "@/hooks/useLenisScroll";

const StrategicAllies = lazy(() => import("@/components/StrategicAllies"));
const GymShowcase = lazy(() => import("@/components/sections/GymShowcase"));
const LandingFooter = lazy(() => import("@/components/landing/LandingFooter"));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt"));
const FighterIDCallToAction = lazy(() =>
  import("@/components/FighterIDCallToAction").then((m) => ({ default: m.FighterIDCallToAction })),
);
const HowItWorksNew = lazy(() => import("@/components/landing/HowItWorksNew"));

const MemoHeader = memo(LandingHeader);
const MemoHero = memo(LandingHero);

function MmaBlock() {
  return (
    <SectionPanel title="Rankings MMA" subtitle="Ultimate Combat Championship Honduras">
      <Ranking organizationCode="UCC_MMA" compact />
    </SectionPanel>
  );
}

function BoxeoBlock() {
  return (
    <SectionPanel title="Rankings Boxeo" subtitle="Liga Nacional Olímpica · Minor League">
      <Ranking organizationCode="FEDEHBOX" compact />
      <div className="my-8"><SectionDivider title="Amateur" /></div>
      <Ranking organizationCode="HHF_AMATEUR" compact />
    </SectionPanel>
  );
}

const Index = () => {
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  useLenisScroll(true);

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
    queryClient.invalidateQueries({ queryKey: ["realtime-stats"] });
    queryClient.refetchQueries({ queryKey: ["realtime-stats"] });
  }, [queryClient]);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      requestAnimationFrame(() => {
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      });
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--fid-bg)]">
        <div className="text-center">
          <div className="font-display font-bold text-[14px] tracking-[0.12em] animate-pulse">
            <span className="text-white">FIGHTER</span>
            <span className="text-[var(--fid-crimson)] ml-1">ID</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fid-landing min-h-screen overflow-x-hidden">
      <MemoHeader />
      <MemoHero />

      <Suspense fallback={null}>
        {user && <FighterIDCallToAction />}
      </Suspense>

      {!user && (
        <>
          <QuickStatsStrip />
          <Suspense fallback={null}>
            <HowItWorksNew />
          </Suspense>
        </>
      )}

      <div id="rankings">
        <SectionPanel title="Rankings MMA" subtitle="Ultimate Combat Championship Honduras">
          <Ranking organizationCode="UCC_MMA" compact />
        </SectionPanel>
      </div>

      <LazyMount placeholderMinHeight={600}>
        <BoxeoBlock />
      </LazyMount>

      <Suspense fallback={null}>
        <LazyMount placeholderMinHeight={400}>
          <SectionPanel title="Escuelas de combate" subtitle="Gimnasios afiliados y sus peleadores registrados">
            <GymShowcase />
          </SectionPanel>
        </LazyMount>
        <LazyMount placeholderMinHeight={300}>
          <SectionPanel title="Aliados estratégicos" subtitle="Organizaciones que llevan el combate al siguiente nivel">
            <StrategicAllies />
          </SectionPanel>
        </LazyMount>
        <LandingFooter />
        <PWAInstallPrompt />
      </Suspense>
    </div>
  );
};

export default Index;
