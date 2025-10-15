import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { QuickStats } from "@/components/QuickStats";
import StrategicAllies from "@/components/StrategicAllies";
import Ranking from "@/components/sections/Ranking";
import Footer from "@/components/Footer";
import UrbanDecorations from "@/components/UrbanDecorations";
import WelcomeScreen from "@/components/WelcomeScreen";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { FighterIDCallToAction } from "@/components/FighterIDCallToAction";

const Index = () => {
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Prefetch strategic partners data immediately
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
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  }, [queryClient]);

  useEffect(() => {
    // Forzar que el Hero refresque stats (evita caché mostrando eventos antiguos)
    queryClient.invalidateQueries({ queryKey: ['realtime-stats'] });
    queryClient.refetchQueries({ queryKey: ['realtime-stats'] });
  }, [queryClient]);

  // Show loading state
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

  // Show main content - Hero handles authenticated/unauthenticated states
  return (
    <div className="min-h-screen bg-black urban-home overflow-x-hidden">
      <UrbanDecorations />
      <Header />
      <Hero />
      {user && (
        <>
          <FighterIDCallToAction />
          <QuickStats />
          <Ranking />
          <StrategicAllies />
        </>
      )}
      <Footer />
      <PWAInstallPrompt />
    </div>
  );
};

export default Index;
