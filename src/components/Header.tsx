import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu, Trophy, Monitor, Settings, BarChart3, Users, Phone, DollarSign, ChevronDown, Shield } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const navigationItems = [
    { name: "Mi Fighter ID", href: "/fighters/me", icon: Shield },
    { name: "Eventos", href: "/eventos", icon: Trophy },
    { name: "Fighters", href: "/fighters", icon: Users },
    { name: "Predicciones", href: "/predicciones", icon: DollarSign },
    { name: "Eventos Deportivos", href: "#eventos-deportivos", icon: Trophy },
    { name: "Eventos Digitales", href: "#eventos-digitales", icon: Monitor },
    { name: "Servicios", href: "#servicios", icon: Settings },
    { name: "Ranking", href: "#ranking", icon: BarChart3 },
    { name: "Comunidad", href: "#comunidad", icon: Users },
    { name: "Contacto", href: "#contacto", icon: Phone },
  ];

  const sectionItems = [
    { name: "Eventos Deportivos", href: "#eventos-deportivos", icon: Trophy },
    { name: "Eventos Digitales", href: "#eventos-digitales", icon: Monitor },
    { name: "Servicios", href: "#servicios", icon: Settings },
    { name: "Ranking", href: "#ranking", icon: BarChart3 },
    { name: "Comunidad", href: "#comunidad", icon: Users },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/07f90240-de72-4763-ba2b-eb451fe8473c.png" 
            alt="Logo" 
            className="h-8 md:h-10 w-auto"
          />
        </div>
        
        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-2">
            {/* Mi Fighter ID - Always visible and prominent */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link 
                  to={user ? "/fighters/me" : "/auth"}
                  className="group inline-flex h-10 w-max items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90 focus:bg-primary/90 focus:outline-none"
                >
                  <Shield className="h-4 w-4" />
                  Mi Fighter ID
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link 
                  to="/eventos" 
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  Eventos
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link 
                  to="/fighters" 
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  Fighters
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link 
                  to="/predicciones" 
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  Predicciones
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-sm">
                Secciones
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-80 gap-1 p-4">
                  {sectionItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <NavigationMenuLink key={item.name} asChild>
                        <a
                          href={item.href}
                          className="group grid h-auto w-full items-center justify-start gap-1 rounded-md bg-background p-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                        >
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-primary" />
                            <div className="text-sm font-medium leading-none">
                              {item.name}
                            </div>
                          </div>
                        </a>
                      </NavigationMenuLink>
                    );
                  })}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a 
                  href="#contacto" 
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  Contacto
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Simplified Navigation for Medium Screens */}
        <nav className="hidden md:flex lg:hidden items-center space-x-4">
          <Link 
            to={user ? "/fighters/me" : "/auth"}
            className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            <Shield className="h-3 w-3" />
            Mi Fighter ID
          </Link>
          <Link to="/eventos" className="text-sm text-foreground hover:text-primary transition-colors">
            Eventos
          </Link>
          <Link to="/fighters" className="text-sm text-foreground hover:text-primary transition-colors">
            Fighters
          </Link>
          <Link to="/predicciones" className="text-sm text-foreground hover:text-primary transition-colors">
            Predicciones
          </Link>
          <a href="#contacto" className="text-sm text-foreground hover:text-primary transition-colors">
            Contacto
          </a>
        </nav>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Header del Sheet */}
                <div className="border-b border-border p-6">
                  <img 
                    src="/lovable-uploads/07f90240-de72-4763-ba2b-eb451fe8473c.png" 
                    alt="Logo" 
                    className="h-10 w-auto"
                  />
                </div>
                
                {/* Navigation Items */}
                <div className="flex-1 py-2">
                  {/* Featured Mi Fighter ID */}
                  <div className="px-4 pb-4">
                    <Link
                      to={user ? "/fighters/me" : "/auth"}
                      className="flex items-center gap-3 rounded-lg px-4 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-2 border-primary/20"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-6 w-6" />
                      <div>
                        <span className="font-semibold text-base">Mi Fighter ID</span>
                        <p className="text-xs opacity-90 mt-0.5">
                          {user ? "Gestiona tu perfil" : "Crea tu perfil"}
                        </p>
                      </div>
                    </Link>
                  </div>
                  
                  <nav className="space-y-1 px-4">
                     {navigationItems.slice(1).map((item) => {
                       const IconComponent = item.icon;
                       const isExternalLink = item.href.startsWith('#');
                       
                       if (isExternalLink) {
                         return (
                           <a
                             key={item.name}
                             href={item.href}
                             className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors"
                             onClick={() => setMobileMenuOpen(false)}
                           >
                             <IconComponent className="h-5 w-5 text-primary" />
                             <span className="font-medium">{item.name}</span>
                           </a>
                         );
                       }
                       
                       return (
                         <Link
                           key={item.name}
                           to={item.href}
                           className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors"
                           onClick={() => setMobileMenuOpen(false)}
                         >
                           <IconComponent className="h-5 w-5 text-primary" />
                           <span className="font-medium">{item.name}</span>
                         </Link>
                       );
                     })}
                  </nav>
                </div>
                
                {/* Call to Actions */}
                <div className="border-t border-border p-6">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setMobileMenuOpen(false)}
                    asChild
                  >
                    <Link to="/auth">Admin Panel</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Actions */}
          <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
            <Link to="/auth">Admin Panel</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;