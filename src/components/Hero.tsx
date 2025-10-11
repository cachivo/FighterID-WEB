import { Button } from "@/components/ui/button";
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { Badge } from '@/components/ui/badge';
import { Calendar, Zap, Shield, Trophy } from 'lucide-react';
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
      <section className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh] flex items-center justify-center overflow-hidden pt-16 pb-8">
        {/* Background with gradient animation */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_50%)] animate-pulse-slow"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.12),transparent_50%)]"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto">
          {/* LOGO OPTIMIZADO PARA MÓVIL */}
          <div className="mb-4 sm:mb-6 md:mb-8 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <img 
              src="/lovable-uploads/fighter-id-logo-neon.png" 
              alt="Fighter ID" 
              className="h-28 sm:h-40 md:h-48 lg:h-56 w-auto mx-auto transition-all duration-500 animate-pulse-slow"
            />
          </div>
          
          {/* Subtítulo */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 sm:mb-6 md:mb-8 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            Plataforma profesional de gestión de peleadores
          </p>
          
          {/* BOTONES */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Button 
              onClick={() => navigate('/auth')}
              variant="hero"
              size="default"
              className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base min-h-[44px] touch-manipulation"
            >
              Iniciar Sesión
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              variant="urban"
              size="default"
              className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base min-h-[44px] touch-manipulation"
            >
              Registrarse
            </Button>
          </div>
          
          {/* Info adicional */}
          <p className="mt-4 sm:mt-6 text-white/70 text-xs sm:text-sm animate-fade-in-up" style={{ animationDelay: '450ms' }}>
            Únete a la comunidad de peleadores profesionales
          </p>
        </div>
        
        {/* Scroll indicator for mobile */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce md:hidden">
          <div className="w-6 h-10 border-2 border-purple-neon-primary/60 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-purple-neon-primary/60 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Cinematic bottom fade */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent"></div>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-purple-neon-primary/40"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-purple-neon-primary/40"></div>
      </section>
    );
  }
  
  // Usuario autenticado - mostrar Hero con stats
  return (
    <section className="relative min-h-[45vh] sm:min-h-[55vh] md:min-h-[65vh] lg:min-h-[70vh] flex items-center justify-center overflow-hidden pt-16 pb-8">
      {/* Background with gradient animation */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_50%)] animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.12),transparent_50%)]"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="mb-3 sm:mb-4 md:mb-6 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <img 
            src="/lovable-uploads/fighter-id-logo-neon.png" 
            alt="Fighter ID Logo" 
            className="h-24 sm:h-32 md:h-40 lg:h-48 w-auto mx-auto animate-pulse-slow"
          />
        </div>
        
        {/* Live indicator with cinematic style and dynamic data */}
        <div className="mt-4 sm:mt-5 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-purple-neon-primary font-semibold animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-neon-primary rounded-full animate-pulse-purple-neon shadow-lg shadow-purple-neon-primary/50"></div>
            <span className="text-[10px] sm:text-xs md:text-sm tracking-wider text-center">
              {stats?.liveEvents && stats.liveEvents.length > 0 
                ? `${stats.liveEvents.length} EVENTO${stats.liveEvents.length > 1 ? 'S' : ''} EN VIVO`
                : stats?.nextEvent
                  ? `PRÓXIMO EVENTO: ${format(new Date(stats.nextEvent.start_time), 'dd MMM yyyy', { locale: es }).toUpperCase()}`
                  : 'PRÓXIMOS EVENTOS PRONTO'
              }
            </span>
          </div>
          
          {/* Dynamic fighter count */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>{stats?.totalFighters || 0} Peleadores</span>
          </div>
        </div>
        
        {/* CTAs para usuarios autenticados */}
        <div className="mt-4 sm:mt-5 md:mt-6 flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Button
            onClick={() => navigate('/social/feed')}
            variant="hero"
            size="default"
            className="gap-2 min-h-[42px] sm:min-h-[44px] text-sm sm:text-base touch-manipulation px-5 sm:px-6"
          >
            <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            Ver Feed Social
          </Button>
          <Button
            onClick={() => navigate('/fighters')}
            variant="urban"
            size="default"
            className="gap-2 min-h-[42px] sm:min-h-[44px] text-sm sm:text-base touch-manipulation px-5 sm:px-6"
          >
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
            Explorar Peleadores
          </Button>
        </div>
        
        {/* Admin Button - Only visible for admin users */}
        {isAdmin && (
          <div className="mt-4 sm:mt-5 animate-fade-in">
            <Button
              onClick={() => navigate('/admin/dashboard')}
              variant="hero"
              size="default"
              className="gap-2 min-h-[42px] sm:min-h-[44px] text-sm sm:text-base px-5 sm:px-6"
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              Panel de Administración
            </Button>
          </div>
        )}
      </div>
      
      {/* Scroll indicator for mobile */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce md:hidden">
        <div className="w-6 h-10 border-2 border-purple-neon-primary/60 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-purple-neon-primary/60 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Cinematic bottom fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent"></div>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-purple-neon-primary/40"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-purple-neon-primary/40"></div>
    </section>
  );
};

export default Hero;