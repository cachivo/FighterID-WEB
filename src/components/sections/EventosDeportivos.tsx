import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import urbanBackground from "@/assets/urban-background.jpg";

const EventosDeportivos = () => {
  const tiposEventos = [
    {
      titulo: "Competencias Freestyle",
      descripcion: "Organizamos batallas de rap freestyle con formato profesional y jurados especializados",
      icono: "🎤"
    },
    {
      titulo: "Torneos Deportivos",
      descripcion: "Eventos deportivos urbanos: skate, BMX, parkour con transmisión en vivo",
      icono: "🛹"
    },
    {
      titulo: "Festivales Urbanos",
      descripcion: "Eventos masivos combinando deportes extremos, música y cultura urbana",
      icono: "🎪"
    },
    {
      titulo: "Campeonatos Nacionales",
      descripcion: "Competencias de alto nivel con ranking nacional y clasificatorias internacionales",
      icono: "🏆"
    }
  ];

  return (
    <section id="eventos-deportivos" className="py-20 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-40"
        style={{ backgroundImage: 'url(/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png)' }}
      />
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            EVENTOS <span className="text-purple-neon-primary">DEPORTIVOS</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Producimos eventos deportivos de clase mundial con la más alta calidad técnica y experiencia inmersiva
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {tiposEventos.map((evento, index) => (
            <Card key={index} className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{evento.icono}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-neon-primary transition-colors">
                      {evento.titulo}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {evento.descripcion}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-purple-neon-primary hover:bg-purple-neon-secondary text-black font-bold px-8 py-4 text-lg animate-glow-neon"
          >
            Solicitar Cotización Evento Deportivo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventosDeportivos;