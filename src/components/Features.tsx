import streamingIcon from "@/assets/streaming-icon.jpg";
import votingIcon from "@/assets/voting-icon.jpg";
import rankingIcon from "@/assets/ranking-icon.jpg";

const Features = () => {
  const features = [
    {
      icon: streamingIcon,
      title: "Streaming EN VIVO",
      description: "Transmisión de alta calidad de todas las batallas urbanas en tiempo real con múltiples ángulos de cámara.",
    },
    {
      icon: votingIcon,
      title: "Votación Interactiva",
      description: "El público y jurado pueden votar en tiempo real. Cada voto cuenta y se refleja instantáneamente.",
    },
    {
      icon: rankingIcon,
      title: "Rankings Dinámicos",
      description: "Tablas de posiciones que se actualizan automáticamente según las votaciones y resultados de las batallas.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-urban-light">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            Cómo Funciona la Plataforma
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Una experiencia completa que conecta a la comunidad urbana con tecnología de vanguardia.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card p-8 rounded-lg shadow-card hover:shadow-urban transition-all duration-300 text-center group hover:-translate-y-2"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent/10 transition-colors duration-300">
                <img 
                  src={feature.icon} 
                  alt={feature.title}
                  className="w-12 h-12 object-contain"
                />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-primary group-hover:text-accent transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;