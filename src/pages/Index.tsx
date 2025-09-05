import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import StrategicAllies from "@/components/StrategicAllies";
import Ranking from "@/components/sections/Ranking";
import Footer from "@/components/Footer";
import UrbanDecorations from "@/components/UrbanDecorations";

const Index = () => {
  const queryClient = useQueryClient();

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

    // Prefetch ranking data for when user scrolls
    const prefetchTimer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ["eventos-destacados"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("eventos_destacados")
            .select("*")
            .eq("activo", true)
            .order("orden", { ascending: true });
          
          if (error) throw error;
          return data;
        },
        staleTime: 15 * 60 * 1000,
      });
    }, 1000); // Prefetch after 1 second

    return () => clearTimeout(prefetchTimer);
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-black urban-home overflow-x-hidden">
      <UrbanDecorations />
      <Header />
      <Hero />
      <StrategicAllies />
      <Ranking />
      <Footer />
    </div>
  );
};

export default Index;
