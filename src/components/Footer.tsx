const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="sm:col-span-2 md:col-span-2">
            <div className="mb-4">
              <img 
                src="/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png" 
                alt="Fighter ID" 
                className="h-6 sm:h-8 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              La plataforma líder para eventos urbanos en vivo. 
              Conectando la cultura callejera con tecnología de vanguardia.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-8 sm:h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform touch-manipulation">
                <span className="text-xs sm:text-sm font-bold">IG</span>
              </div>
              <div className="w-10 h-10 sm:w-8 sm:h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform touch-manipulation">
                <span className="text-xs sm:text-sm font-bold">YT</span>
              </div>
              <div className="w-10 h-10 sm:w-8 sm:h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform touch-manipulation">
                <span className="text-xs sm:text-sm font-bold">TW</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-accent">Eventos</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Próximas Batallas</a></li>
              <li><a href="#" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Calendario</a></li>
              <li><a href="#" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Resultados</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-accent">Comunidad</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Registro Artista</a></li>
              <li><a href="#" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Ser Jurado</a></li>
              <li><a href="#" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Contacto</a></li>
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