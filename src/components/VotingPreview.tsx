import { Button } from "@/components/ui/button";
import { useState } from "react";

const VotingPreview = () => {
  const [selectedBattler, setSelectedBattler] = useState<number | null>(null);
  
  const battlers = [
    { id: 1, name: "DJ STORM", votes: 342, percentage: 65 },
    { id: 2, name: "MC THUNDER", votes: 184, percentage: 35 },
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            Sistema de Votación
          </h2>
          <p className="text-xl text-muted-foreground">
            Vota por tu favorito y ve los resultados en tiempo real
          </p>
        </div>
        
        <div className="bg-card rounded-xl p-8 shadow-urban">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-center mb-2 text-primary">
              BATALLA ACTUAL: FREESTYLE FINAL
            </h3>
            <div className="flex items-center justify-center gap-2 text-accent font-semibold">
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
              EN VIVO
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {battlers.map((battler) => (
              <div 
                key={battler.id}
                className={`border-2 rounded-lg p-6 transition-all duration-300 cursor-pointer ${
                  selectedBattler === battler.id 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setSelectedBattler(battler.id)}
              >
                <div className="text-center">
                  <h4 className="text-2xl font-bold mb-4 text-primary">
                    {battler.name}
                  </h4>
                  
                  <div className="mb-4">
                    <div className="w-full bg-muted rounded-full h-4 mb-2">
                      <div 
                        className="bg-accent h-4 rounded-full transition-all duration-500"
                        style={{ width: `${battler.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{battler.votes} votos</span>
                      <span>{battler.percentage}%</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant={selectedBattler === battler.id ? "hero" : "vote"}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBattler(battler.id);
                    }}
                  >
                    {selectedBattler === battler.id ? "VOTADO ✓" : "VOTAR"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              Total de votos: <span className="font-bold text-accent">526</span>
            </p>
            <p className="text-sm text-muted-foreground">
              ⚡ Los votos se actualizan en tiempo real
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VotingPreview;