import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const StrategicAllies = () => {
  const { data: partners, isLoading } = useQuery({
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
  });

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-black">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Aliados Estratégicos
          </h2>
          <div className="flex justify-center items-center">
            <div className="animate-pulse text-gray-400">Cargando...</div>
          </div>
        </div>
      </section>
    );
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
                  <div className="w-24 h-24 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    {partner.logo ? (
                      <img 
                        src={partner.logo} 
                        alt={partner.nombre}
                        className="max-w-20 max-h-20 object-contain filter brightness-0 invert group-hover:brightness-100 group-hover:invert-0 transition-all"
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