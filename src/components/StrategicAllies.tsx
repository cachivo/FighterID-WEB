import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { StrategicAlliesSkeleton } from "@/components/ui/strategic-allies-skeleton";

const StrategicAllies = () => {
  const { data: partners, isLoading, error } = useQuery({
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
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <StrategicAlliesSkeleton />;
  }
  
  if (error) {
    console.error('Error loading strategic partners:', error);
    return null;
  }

  if (!partners || partners.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-black to-urban-dark">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white animate-slide-up">
          Aliados Estratégicos
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto animate-fade-in">
          Trabajamos con los mejores gimnasios y organizaciones para llevar el combate al siguiente nivel
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {partners.map((partner, index) => (
            <Card key={partner.id} className="bg-urban-darker border-purple-neon-primary/20 hover:border-purple-neon-primary/40 transition-all duration-300 group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-24 h-24 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors overflow-hidden">
                    {partner.logo ? (
                      <OptimizedImage
                        src={partner.logo}
                        alt={partner.nombre}
                        className="w-20 h-20 object-contain transition-all duration-300"
                        priority={index < 3} // Prioritize first 3 images
                        fallbackIcon={
                          <div className="text-2xl text-purple-neon-primary">
                            {partner.tipo === "Gimnasio" ? "🥊" : "🏆"}
                          </div>
                        }
                      />
                    ) : (
                      <div className="text-2xl text-purple-neon-primary">
                        {partner.tipo === "Gimnasio" ? "🥊" : "🏆"}
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-neon-primary transition-colors">
                  {partner.nombre}
                </h3>
                
                <div className="text-sm text-purple-neon-secondary font-medium mb-3 uppercase tracking-wider">
                  {partner.tipo}
                </div>
                
                <p className="text-gray-400 text-sm leading-relaxed">
                  {partner.descripcion}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StrategicAllies;