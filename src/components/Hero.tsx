import { Button } from "@/components/ui/button";
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { Badge } from '@/components/ui/badge';
import { Calendar, Zap, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import batallaPoster from "@/assets/batalla-poster.jpg";
import blueArena from "@/assets/blue-arena.jpg";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Hero = () => {
  const { stats } = useRealTimeStats();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  
  // Si no hay usuario autenticado, mostrar landing page con logo grande
  if (!user) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black"></div>
      </div>
        
        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto">
          {/* LOGO GRANDE */}
          <div className="mb-6 sm:mb-8 md:mb-10 animate-slide-up">
            <img 
              src="/lovable-uploads/fighter-id-logo-user.png" 
              alt="Fighter ID" 
              className="h-48 sm:h-56 md:h-64 lg:h-80 w-auto mx-auto"
              style={{ 
                filter: 'drop-shadow(0 0 25px rgba(139, 92, 246, 0.8)) drop-shadow(0 0 50px rgba(139, 92, 246, 0.6)) drop-shadow(0 0 75px rgba(139, 92, 246, 0.4))'
              }}
            />
          </div>
          
          {/* Subtítulo */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 animate-slide-up">
            Plataforma profesional de gestión de peleadores
          </p>
          
          {/* BOTONES */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto animate-slide-up">
            <Button 
              onClick={() => navigate('/auth')}
              variant="hero"
              size="lg"
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-base min-h-[48px] touch-manipulation"
            >
              Iniciar Sesión
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              variant="urban"
              size="lg"
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-base min-h-[48px] touch-manipulation"
            >
              Registrarse
            </Button>
          </div>
          
          {/* Info adicional */}
          <p className="mt-6 sm:mt-8 text-white/70 text-sm animate-fade-in">
            Únete a la comunidad de peleadores profesionales
          </p>
        </div>
        
        {/* Cinematic bottom fade */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent"></div>
        
        {/* Urban architectural elements with neon purple */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-purple-neon-primary/50 to-transparent animate-glow-neon"></div>
        <div className="absolute top-1/2 left-0 w-2 h-40 bg-gradient-to-b from-transparent via-purple-neon-secondary/30 to-transparent"></div>
        <div className="absolute top-1/3 right-0 w-2 h-32 bg-gradient-to-b from-transparent via-purple-neon-primary/40 to-transparent"></div>
      </section>
    );
  }
  
  // Usuario autenticado - mostrar Hero con stats
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="mb-2 sm:mb-4 animate-slide-up">
          <img 
            src="/lovable-uploads/fighter-id-logo-user.png" 
            alt="Fighter ID Logo" 
            className="h-72 sm:h-[400px] md:h-[480px] lg:h-[560px] w-auto mx-auto"
            style={{ 
              filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 40px rgba(37, 99, 235, 0.6)) drop-shadow(0 0 60px rgba(29, 78, 216, 0.4))'
            }}
          />
        </div>
        
        {/* Live indicator with cinematic style and dynamic data */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-purple-neon-primary font-semibold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-neon-primary rounded-full animate-pulse-purple-neon shadow-lg shadow-purple-neon-primary/50"></div>
            <span className="text-xs sm:text-sm md:text-base tracking-wider text-center">
              {stats?.liveEvents && stats.liveEvents.length > 0 
                ? `${stats.liveEvents.length} EVENTO${stats.liveEvents.length > 1 ? 'S' : ''} EN VIVO`
                : stats?.nextEvent
                  ? `PRÓXIMO EVENTO: ${format(new Date(stats.nextEvent.start_time), 'dd MMM yyyy', { locale: es }).toUpperCase()}`
                  : 'PRÓXIMOS EVENTOS PRONTO'
              }
            </span>
          </div>
          
          {/* Dynamic fighter count */}
          <div className="flex items-center gap-2 text-xs sm:text-sm bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{stats?.totalFighters || 0} Peleadores Registrados</span>
          </div>
        </div>
        
        {/* Admin Button - Only visible for admin users */}
        {isAdmin && (
          <div className="mt-6 sm:mt-8 animate-fade-in">
            <Button
              onClick={() => navigate('/admin/dashboard')}
              variant="hero"
              size="lg"
              className="gap-2"
            >
              <Shield className="h-5 w-5" />
              Panel de Administración
            </Button>
          </div>
        )}
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