import batallaPoster from "@/assets/batalla-poster.jpg";
import votingIcon from "@/assets/voting-icon.jpg";
import rankingIcon from "@/assets/ranking-icon.jpg";

const Features = () => {
  const features = [
    {
      icon: votingIcon,
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
    <section className="relative py-12 sm:py-16 md:py-20 px-4">
      {/* Background image section from poster */}
      <div className="absolute inset-0">
        <img 
          src="/lovable-uploads/047f0269-860f-4365-9dc4-8e1343a62359.png"
          alt="Features Background"
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 60%' }}
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            Cómo Funciona la Plataforma
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Una experiencia completa que conecta a la comunidad urbana con tecnología de vanguardia.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="relative bg-black/40 backdrop-blur-sm border border-gray-700/50 p-6 sm:p-8 rounded-lg hover:border-purple-neon-primary/50 transition-all duration-300 text-center group hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-neon-primary/20 touch-manipulation"
            >
              {/* Card lighting effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-neon-primary/5 to-purple-neon-secondary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center group-hover:border-purple-neon-primary group-hover:shadow-lg group-hover:shadow-purple-neon-primary/30 transition-all duration-300">
                <img 
                  src={feature.icon} 
                  alt={feature.title}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain filter brightness-125"
                />
              </div>
              
              <h3 className="relative text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-white group-hover:text-purple-neon-primary transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="relative text-gray-400 text-sm sm:text-base leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
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