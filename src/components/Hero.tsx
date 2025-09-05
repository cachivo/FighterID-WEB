import { Button } from "@/components/ui/button";
import batallaPoster from "@/assets/batalla-poster.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="mb-8 sm:mb-6 animate-slide-up">
          <img 
            src="/lovable-uploads/07f90240-de72-4763-ba2b-eb451fe8473c.png" 
            alt="Logo" 
            className="h-16 sm:h-20 md:h-24 lg:h-32 w-auto mx-auto animate-glow-neon"
          />
        </div>
        
        
        <div className="flex flex-col gap-4 sm:gap-3 justify-center items-center animate-slide-up">
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full sm:w-auto text-base sm:text-lg px-8 py-4 min-h-[48px] touch-manipulation"
          >
            Ver Batalla EN VIVO
          </Button>
          <Button 
            variant="urban" 
            size="lg" 
            className="w-full sm:w-auto text-base sm:text-lg px-8 py-4 min-h-[48px] touch-manipulation"
          >
            Únete Como Jurado
          </Button>
        </div>
        
        {/* Live indicator with cinematic style */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 text-purple-neon-primary font-semibold">
          <div className="w-3 h-3 bg-purple-neon-primary rounded-full animate-pulse-purple-neon shadow-lg shadow-purple-neon-primary/50"></div>
          <span className="text-sm sm:text-base md:text-lg tracking-wider text-center">
            PRÓXIMO EVENTO: 25 ENE 2025
          </span>
        </div>
      </div>
      
      {/* Cinematic bottom fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent"></div>
      
      {/* Urban architectural elements with neon purple */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-purple-neon-primary/50 to-transparent animate-glow-neon"></div>
      <div className="absolute top-1/2 left-0 w-2 h-40 bg-gradient-to-b from-transparent via-purple-neon-secondary/30 to-transparent"></div>
      <div className="absolute top-1/3 right-0 w-2 h-32 bg-gradient-to-b from-transparent via-purple-neon-primary/40 to-transparent"></div>
    </section>
  );
};

export default Hero;