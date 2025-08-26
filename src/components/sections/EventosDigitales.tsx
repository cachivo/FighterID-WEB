import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import urbanBackground from "@/assets/urban-background.jpg";

const EventosDigitales = () => {
  const tiposEventos = [
    {
      titulo: "Streaming de Competencias",
      descripcion: "Transmisiones en vivo multi-cámara con calidad profesional y comentaristas especializados",
      icono: "📹"
    },
    {
      titulo: "Eventos Híbridos",
      descripcion: "Combinamos eventos presenciales con experiencias digitales interactivas",
      icono: "🌐"
    },
    {
      titulo: "Competencias Online",
      descripcion: "Torneos completamente digitales con plataformas de votación en tiempo real",
      icono: "💻"
    },
    {
      titulo: "Contenido Digital",
      descripcion: "Producción de contenido audiovisual para redes sociales y plataformas digitales",
      icono: "📱"
    }
  ];

  return (
    <section id="eventos-digitales" className="py-20 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-35"
        style={{ backgroundImage: 'url(/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png)' }}
      />
      <div className="absolute inset-0 bg-black/55" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            EVENTOS <span className="text-purple-neon-primary">DIGITALES</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Innovamos en experiencias digitales inmersivas que conectan audiencias globales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {tiposEventos.map((evento, index) => (
            <Card key={index} className="bg-black/60 border-purple-neon-primary/30 backdrop-blur-sm hover:bg-black/80 transition-all duration-300 group">
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
            Solicitar Producción Digital
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventosDigitales;