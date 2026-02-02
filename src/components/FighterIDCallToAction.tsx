import { Button } from '@/components/ui/button';
import { Trophy, Shield, Award, Zap, Target, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHasFighterLicense } from '@/hooks/useHasFighterLicense';

export function FighterIDCallToAction() {
  const navigate = useNavigate();
  const { hasLicense, loading } = useHasFighterLicense();

  // No mostrar nada si ya tiene licencia o está cargando
  if (loading || hasLicense) {
    return null;
  }

  return (
    <section id="solicitar-licencia" className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background subtle */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-transparent" />
      
      {/* Iconos flotantes con animaciones - ocultos en móvil */}
      <div className="absolute inset-0 pointer-events-none hidden sm:block">
        {/* Shield principal con pulse */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 animate-pulse">
          <Shield className="w-12 h-12 text-gold-400/30" />
        </div>
        
        {/* Iconos flotantes alrededor */}
        <div className="absolute top-20 left-[15%] animate-[float_6s_ease-in-out_infinite]">
          <Trophy className="w-10 h-10 text-gold-400/20" />
        </div>
        
        <div className="absolute top-32 right-[15%] animate-[float_7s_ease-in-out_infinite_1s]">
          <Award className="w-10 h-10 text-purple-400/20" />
        </div>
        
        <div className="absolute bottom-32 left-[20%] animate-[float_8s_ease-in-out_infinite_2s]">
          <Zap className="w-8 h-8 text-blue-400/20" />
        </div>
        
        <div className="absolute bottom-40 right-[20%] animate-[float_6s_ease-in-out_infinite_1.5s]">
          <Target className="w-8 h-8 text-red-400/20" />
        </div>
        
        <div className="absolute top-1/2 left-[10%] animate-[float_9s_ease-in-out_infinite_0.5s]">
          <Star className="w-6 h-6 text-gold-400/15" />
        </div>
        
        <div className="absolute top-1/2 right-[10%] animate-[float_7s_ease-in-out_infinite_2.5s]">
          <Star className="w-6 h-6 text-gold-400/15" />
        </div>
      </div>
      
      {/* Contenido central */}
      <div className="relative text-center space-y-8 animate-fade-in">
        {/* Título */}
        <div className="space-y-3">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
            ¿Eres Peleador?
          </h2>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Obtén tu <span className="font-bold text-gold-400">Fighter ID oficial</span>
          </p>
        </div>

        {/* Beneficios minimalistas sin cajas */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12 py-8">
          <div className="flex flex-col items-center gap-2 group">
            <Shield className="w-12 h-12 text-blue-400 transition-transform group-hover:scale-110" />
            <span className="text-sm text-white/70">Licencia Digital</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 group">
            <Trophy className="w-12 h-12 text-gold-400 transition-transform group-hover:scale-110" />
            <span className="text-sm text-white/70">Eventos Oficiales</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 group">
            <Award className="w-12 h-12 text-purple-400 transition-transform group-hover:scale-110" />
            <span className="text-sm text-white/70">Récord Verificado</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="space-y-3">
          <Button 
            size="lg"
            onClick={() => navigate('/license/request')}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold px-10 py-7 text-lg shadow-2xl hover:shadow-red-500/25 transition-all duration-300 hover:scale-105"
          >
            <Shield className="w-5 h-5 mr-2" />
            Solicitar mi Fighter ID
          </Button>
          
          <p className="text-xs text-white/60">
            Aprobación en 24-48 horas
          </p>
        </div>
      </div>
    </section>
  );
}
