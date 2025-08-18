import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/19e8d3e6-b5ff-48b7-bd8f-c14e12a47b0f.png" 
            alt="Batalla de Gimnasios" 
            className="h-8 md:h-10 w-auto"
          />
        </div>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#eventos" className="text-foreground hover:text-muted-foreground transition-colors">
            Eventos
          </a>
          <a href="#ranking" className="text-foreground hover:text-muted-foreground transition-colors">
            Ranking
          </a>
          <a href="#comunidad" className="text-foreground hover:text-muted-foreground transition-colors">
            Comunidad
          </a>
        </nav>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            Iniciar Sesión
          </Button>
          <Button variant="default" size="sm">
            Únete
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;