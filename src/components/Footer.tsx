const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="mb-4">
              <img 
                src="/lovable-uploads/19e8d3e6-b5ff-48b7-bd8f-c14e12a47b0f.png" 
                alt="Batalla de Gimnasios" 
                className="h-8 w-auto filter brightness-0 invert"
              />
            </div>
            <p className="text-gray-300 mb-4">
              La plataforma líder para eventos urbanos en vivo. 
              Conectando la cultura callejera con tecnología de vanguardia.
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <span className="text-sm font-bold">IG</span>
              </div>
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <span className="text-sm font-bold">YT</span>
              </div>
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <span className="text-sm font-bold">TW</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-accent">Eventos</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-accent transition-colors">Próximas Batallas</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Calendario</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Resultados</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-accent">Comunidad</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-accent transition-colors">Registro Artista</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Ser Jurado</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Contacto</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Batalla de Gimnasios. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;