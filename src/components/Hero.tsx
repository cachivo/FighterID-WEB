import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-urban.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with urban image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-slide-up">
          BATALLA DE 
          <span className="block text-accent">GIMNASIOS</span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 font-light max-w-2xl mx-auto animate-fade-in">
          Transmisión en vivo de eventos urbanos con votaciones en tiempo real. 
          La cultura callejera se encuentra con la tecnología.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
          <Button variant="hero" size="lg" className="text-lg px-8 py-4">
            Ver Batalla EN VIVO
          </Button>
          <Button variant="urban" size="lg" className="text-lg px-8 py-4">
            Únete Como Jurado
          </Button>
        </div>
        
        {/* Live indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-accent font-semibold">
          <div className="w-3 h-3 bg-accent rounded-full animate-pulse-accent"></div>
          PRÓXIMO EVENTO: 25 ENE 2025
        </div>
      </div>
      
      {/* Decorative urban elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
};

export default Hero;