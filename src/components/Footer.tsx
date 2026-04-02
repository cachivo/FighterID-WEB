import { useSystemAssets } from "@/hooks/useSystemAssets";
import { Link } from "react-router-dom";

const Footer = () => {
  const { logoUrl } = useSystemAssets();
  return (
    <footer className="bg-[hsl(0_0%_12%)] text-foreground py-8 sm:py-10 md:py-14 px-4 border-t border-[hsl(0_0%_100%/0.05)]">
      <div className="max-w-6xl mx-auto">
        {/* Editorial divider */}
        <div className="editorial-divider h-12 mb-8 opacity-50" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="mb-4">
              <img 
                src={logoUrl} 
                alt="Fighter ID" 
                className="h-6 sm:h-8 w-auto"
              />
            </div>
            <p className="text-[hsl(0_0%_95%/0.6)] mb-5 text-sm leading-relaxed">
              Plataforma profesional de certificación y gestión de peleadores.
            </p>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full border border-[hsl(0_0%_100%/0.15)] flex items-center justify-center cursor-pointer hover:bg-[hsl(0_0%_100%/0.1)] transition-colors touch-manipulation">
                <span className="text-[10px] font-bold text-[hsl(0_0%_95%/0.7)]">IG</span>
              </div>
              <div className="w-10 h-10 rounded-full border border-[hsl(0_0%_100%/0.15)] flex items-center justify-center cursor-pointer hover:bg-[hsl(0_0%_100%/0.1)] transition-colors touch-manipulation">
                <span className="text-[10px] font-bold text-[hsl(0_0%_95%/0.7)]">YT</span>
              </div>
              <div className="w-10 h-10 rounded-full border border-[hsl(0_0%_100%/0.15)] flex items-center justify-center cursor-pointer hover:bg-[hsl(0_0%_100%/0.1)] transition-colors touch-manipulation">
                <span className="text-[10px] font-bold text-[hsl(0_0%_95%/0.7)]">TW</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold mb-4 text-[hsl(0_0%_95%/0.4)] uppercase tracking-[0.15em]">Eventos</h4>
            <ul className="space-y-3 text-[hsl(0_0%_95%/0.6)]">
              <li><Link to="/eventos" className="hover:text-foreground transition-colors text-sm touch-manipulation">Próximas Batallas</Link></li>
              <li><Link to="/eventos" className="hover:text-foreground transition-colors text-sm touch-manipulation">Calendario</Link></li>
              <li><Link to="/resultados" className="hover:text-foreground transition-colors text-sm touch-manipulation">Resultados</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-bold mb-4 text-[hsl(0_0%_95%/0.4)] uppercase tracking-[0.15em]">Comunidad</h4>
            <ul className="space-y-3 text-[hsl(0_0%_95%/0.6)]">
              <li><Link to="/license/auth" className="hover:text-foreground transition-colors text-sm touch-manipulation">Licencia de Peleador</Link></li>
              <li><Link to="/contacto" className="hover:text-foreground transition-colors text-sm touch-manipulation">Ser Jurado</Link></li>
              <li><Link to="/contacto" className="hover:text-foreground transition-colors text-sm touch-manipulation">Contacto</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400">
          <p className="text-xs sm:text-sm">&copy; 2025. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;