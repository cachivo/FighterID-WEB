import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Ranking = () => {
  const estadisticas = [
    {
      numero: "150+",
      descripcion: "Eventos Producidos",
      icono: "🎪"
    },
    {
      numero: "50K+",
      descripcion: "Participantes",
      icono: "👥"
    },
    {
      numero: "2M+",
      descripcion: "Visualizaciones Online",
      icono: "📺"
    },
    {
      numero: "25+",
      descripcion: "Ciudades Alcanzadas",
      icono: "🌎"
    }
  ];

  const topEventos = [
    {
      evento: "Copa Nacional Freestyle 2024",
      participantes: "120 MC's",
      audiencia: "850K visualizaciones",
      lugar: "1er Lugar"
    },
    {
      evento: "Urban Games Championship",
      participantes: "200 atletas",
      audiencia: "1.2M visualizaciones", 
      lugar: "1er Lugar"
    },
    {
      evento: "Festival Digital Urbano",
      participantes: "80 artistas",
      audiencia: "650K visualizaciones",
      lugar: "1er Lugar"
    }
  ];

  return (
    <section id="ranking" className="py-20 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-45"
        style={{ backgroundImage: 'url(/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png)' }}
      />
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            NUESTROS <span className="text-purple-neon-primary">RESULTADOS</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Cifras que demuestran nuestro compromiso con la excelencia en cada evento
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {estadisticas.map((stat, index) => (
            <Card key={index} className="bg-black/60 border-purple-neon-primary/30 backdrop-blur-sm text-center group hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="text-3xl mb-2">{stat.icono}</div>
                <div className="text-2xl md:text-3xl font-bold text-purple-neon-primary mb-2 group-hover:animate-pulse-purple-neon">
                  {stat.numero}
                </div>
                <p className="text-gray-300 text-sm md:text-base">
                  {stat.descripcion}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top Eventos */}
        <div className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
            Eventos <span className="text-purple-neon-primary">Destacados</span>
          </h3>
          
          <div className="space-y-4">
            {topEventos.map((evento, index) => (
              <Card key={index} className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm hover:bg-black/60 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">
                        {evento.evento}
                      </h4>
                      <div className="flex flex-col md:flex-row gap-4 text-gray-300">
                        <span>{evento.participantes}</span>
                        <span>{evento.audiencia}</span>
                      </div>
                    </div>
                    <div className="bg-purple-neon-primary text-black px-4 py-2 rounded-lg font-bold">
                      🏆 {evento.lugar}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-purple-neon-primary hover:bg-purple-neon-secondary text-black font-bold px-8 py-4 text-lg animate-glow-neon"
          >
            Ver Historial Completo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Ranking;