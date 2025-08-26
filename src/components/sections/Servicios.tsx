import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Servicios = () => {
  const servicios = [
    {
      titulo: "Producción Integral",
      descripcion: "Gestión completa del evento desde la conceptualización hasta la ejecución",
      icono: "🎬",
      items: ["Planificación estratégica", "Gestión logística", "Coordinación de equipos"]
    },
    {
      titulo: "Tecnología Avanzada",
      descripcion: "Sistemas de votación en tiempo real y plataformas interactivas",
      icono: "⚙️",
      items: ["Sistemas de votación", "Apps móviles", "Plataformas web"]
    },
    {
      titulo: "Transmisión Profesional",
      descripcion: "Streaming multi-plataforma con calidad broadcast",
      icono: "📡",
      items: ["Streaming HD/4K", "Multi-cámara", "Comentaristas profesionales"]
    },
    {
      titulo: "Marketing Digital",
      descripcion: "Promoción integral en redes sociales y medios digitales",
      icono: "📢",
      items: ["Redes sociales", "Contenido viral", "Campañas digitales"]
    }
  ];

  return (
    <section id="servicios" className="py-20 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-40"
        style={{ backgroundImage: 'url(/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png)' }}
      />
      <div className="absolute inset-0 bg-black/45" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            NUESTROS <span className="text-purple-neon-primary">SERVICIOS</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Ofrecemos soluciones completas para eventos de cualquier escala con tecnología de vanguardia
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {servicios.map((servicio, index) => (
            <Card key={index} className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{servicio.icono}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-neon-primary transition-colors">
                      {servicio.titulo}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {servicio.descripcion}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {servicio.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-gray-400">
                      <div className="w-2 h-2 bg-purple-neon-primary rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-purple-neon-primary hover:bg-purple-neon-secondary text-black font-bold px-8 py-4 text-lg animate-glow-neon"
          >
            Consultar Servicios Personalizados
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Servicios;