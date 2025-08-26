import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Contacto = () => {
  const contactInfo = [
    {
      tipo: "Eventos Corporativos",
      email: "eventos@batallaproduction.com",
      telefono: "+1 (555) 123-4567",
      icono: "🏢"
    },
    {
      tipo: "Colaboraciones Artísticas", 
      email: "talento@batallaproduction.com",
      telefono: "+1 (555) 123-4568",
      icono: "🎨"
    },
    {
      tipo: "Partnerships",
      email: "partners@batallaproduction.com", 
      telefono: "+1 (555) 123-4569",
      icono: "🤝"
    }
  ];

  return (
    <section id="contacto" className="py-20 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-35"
        style={{ backgroundImage: 'url(/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png)' }}
      />
      <div className="absolute inset-0 bg-black/55" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            HABLEMOS DE TU <span className="text-purple-neon-primary">PROYECTO</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            ¿Tienes una idea? Conversemos y la hacemos realidad con la mejor producción
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Formulario de Contacto */}
          <Card className="bg-black/60 border-purple-neon-primary/30 backdrop-blur-sm">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-6">
                Solicitar <span className="text-purple-neon-primary">Cotización</span>
              </h3>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    placeholder="Nombre Completo"
                    className="bg-black/40 border-purple-neon-primary/20 text-white placeholder:text-gray-400"
                  />
                  <Input 
                    placeholder="Empresa/Organización"
                    className="bg-black/40 border-purple-neon-primary/20 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    type="email" 
                    placeholder="Email de Contacto"
                    className="bg-black/40 border-purple-neon-primary/20 text-white placeholder:text-gray-400"
                  />
                  <Input 
                    type="tel" 
                    placeholder="Teléfono"
                    className="bg-black/40 border-purple-neon-primary/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <Input 
                  placeholder="Tipo de Evento Deseado"
                  className="bg-black/40 border-purple-neon-primary/20 text-white placeholder:text-gray-400"
                />

                <Textarea 
                  placeholder="Describe tu proyecto en detalle..."
                  rows={4}
                  className="bg-black/40 border-purple-neon-primary/20 text-white placeholder:text-gray-400"
                />

                <Button 
                  type="submit"
                  size="lg" 
                  className="w-full bg-purple-neon-primary hover:bg-purple-neon-secondary text-black font-bold py-3 animate-glow-neon"
                >
                  Enviar Solicitud
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">
              Contacto <span className="text-purple-neon-primary">Directo</span>
            </h3>
            
            <div className="space-y-6 mb-8">
              {contactInfo.map((info, index) => (
                <Card key={index} className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm hover:bg-black/60 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{info.icono}</div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">
                          {info.tipo}
                        </h4>
                        <p className="text-purple-neon-primary mb-1">
                          {info.email}
                        </p>
                        <p className="text-gray-300">
                          {info.telefono}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Redes Sociales */}
            <Card className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <h4 className="text-lg font-bold text-white mb-4">
                  Síguenos en Redes
                </h4>
                <div className="flex gap-4">
                  {['Instagram', 'TikTok', 'YouTube', 'Twitter'].map((red) => (
                    <Button 
                      key={red}
                      variant="outline" 
                      size="sm"
                      className="border-purple-neon-primary/50 text-purple-neon-primary hover:bg-purple-neon-primary hover:text-black"
                    >
                      {red}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Tiempo de respuesta promedio: <span className="text-purple-neon-primary font-bold">2-4 horas hábiles</span>
          </p>
          <p className="text-gray-400">
            📍 Oficinas en México, Colombia, Argentina | 🌐 Cobertura Internacional
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contacto;