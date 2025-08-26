import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Comunidad = () => {
  const testimonios = [
    {
      nombre: "Carlos 'El Maestro' Rodriguez",
      rol: "MC Profesional",
      testimonio: "La mejor organización que he visto en años. Su sistema de votación es revolucionario.",
      avatar: "🎤"
    },
    {
      nombre: "Ana Skateboard",
      rol: "Atleta Profesional",
      testimonio: "Eventos de calidad mundial. La producción es impresionante y el ambiente único.",
      avatar: "🛹"
    },
    {
      nombre: "DJ Fresh Beats",
      rol: "Productor Musical",
      testimonio: "Colaborar con ellos ha sido increíble. Entienden la cultura urbana perfectamente.",
      avatar: "🎧"
    }
  ];

  const partners = [
    {
      nombre: "Red Bull",
      tipo: "Sponsor Oficial",
      descripcion: "Patrocinador principal de nuestros eventos más grandes"
    },
    {
      nombre: "Urban TV",
      tipo: "Media Partner",
      descripcion: "Transmisión exclusiva de competencias nacionales"
    },
    {
      nombre: "Street Academy",
      tipo: "Partner Educativo",
      descripcion: "Formación de nuevos talentos urbanos"
    },
    {
      nombre: "Beats Network",
      tipo: "Plataforma Digital",
      descripcion: "Distribución de contenido en redes especializadas"
    }
  ];

  return (
    <section id="comunidad" className="py-20 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-40"
        style={{ backgroundImage: 'url(/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png)' }}
      />
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            NUESTRA <span className="text-purple-neon-primary">COMUNIDAD</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Construimos una red sólida con artistas, atletas, sponsors y creadores de contenido
          </p>
        </div>

        {/* Testimonios */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
            Lo que dicen de <span className="text-purple-neon-primary">nosotros</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonios.map((testimonio, index) => (
              <Card key={index} className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm hover:bg-black/60 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{testimonio.avatar}</div>
                    <h4 className="text-lg font-bold text-white">
                      {testimonio.nombre}
                    </h4>
                    <p className="text-purple-neon-primary text-sm">
                      {testimonio.rol}
                    </p>
                  </div>
                  <p className="text-gray-300 text-center italic">
                    "{testimonio.testimonio}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Partners */}
        <div className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
            Nuestros <span className="text-purple-neon-primary">Partners</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partners.map((partner, index) => (
              <Card key={index} className="bg-black/60 border-purple-neon-primary/30 backdrop-blur-sm hover:bg-black/80 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-white">
                      {partner.nombre}
                    </h4>
                    <span className="bg-purple-neon-primary text-black px-2 py-1 rounded text-xs font-bold">
                      {partner.tipo}
                    </span>
                  </div>
                  <p className="text-gray-300">
                    {partner.descripcion}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-purple-neon-primary hover:bg-purple-neon-secondary text-black font-bold px-8 py-4 text-lg animate-glow-neon mr-4"
          >
            Únete Como Partner
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-purple-neon-primary text-purple-neon-primary hover:bg-purple-neon-primary hover:text-black px-8 py-4 text-lg"
          >
            Ser Parte del Talento
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Comunidad;