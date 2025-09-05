import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { FighterIDModal } from "@/components/FighterIDModal";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Trophy, Monitor, Settings, BarChart3, Users, Phone, DollarSign, ChevronDown, Shield, LogOut, User, Coins } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  const handleLogout = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const navigationItems = [
    { name: "Mi Perfil", href: "/fighter/me", icon: Shield },
    { name: "Eventos", href: "/eventos", icon: Trophy },
    { name: "Fighters", href: "/fighters", icon: Users },
    { name: "Predicciones", href: "/predicciones", icon: DollarSign },
    { name: "Ranking", href: "#ranking", icon: BarChart3 },
  ];

  const sectionItems = [
    { name: "Ranking", href: "#ranking", icon: BarChart3 },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/07f90240-de72-4763-ba2b-eb451fe8473c.png" 
              alt="Batalla de Gimnasios" 
              className="h-8 md:h-10 w-auto"
            />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-2">
            {/* Mi ID - Always visible and prominent */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <FighterIDModal>
                  <div className="group inline-flex h-10 w-max items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90 focus:bg-primary/90 focus:outline-none cursor-pointer">
                    <Coins className="h-4 w-4 text-amber-400" />
                    Mi ID
                  </div>
                </FighterIDModal>
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
              <NavigationMenuLink asChild>
                <a 
                  href="#ranking" 
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  Ranking
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Simplified Navigation for Medium Screens */}
        <nav className="hidden md:flex lg:hidden items-center space-x-4">
          <FighterIDModal>
            <div className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/90 transition-colors cursor-pointer">
              <Coins className="h-3 w-3 text-amber-400" />
              Mi ID
            </div>
          </FighterIDModal>
          <Link to="/eventos" className="text-sm text-foreground hover:text-primary transition-colors">
            Eventos
          </Link>
          <Link to="/fighters" className="text-sm text-foreground hover:text-primary transition-colors">
            Fighters
          </Link>
          <Link to="/predicciones" className="text-sm text-foreground hover:text-primary transition-colors">
            Predicciones
          </Link>
          <a href="#ranking" className="text-sm text-foreground hover:text-primary transition-colors">
            Ranking
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
                  <Link 
                    to="/" 
                    className="hover:opacity-80 transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <img 
                      src="/lovable-uploads/07f90240-de72-4763-ba2b-eb451fe8473c.png" 
                      alt="Batalla de Gimnasios" 
                      className="h-10 w-auto"
                    />
                  </Link>
                </div>
                
                {/* Navigation Items */}
                <div className="flex-1 py-2">
                  {/* Featured Mi ID */}
                  <div className="px-4 pb-4">
                    <FighterIDModal>
                      <div
                        className="flex items-center gap-3 rounded-lg px-4 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-2 border-primary/20 cursor-pointer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Coins className="h-6 w-6 text-amber-400" />
                        <div>
                          <span className="font-semibold text-base">Mi ID</span>
                          <p className="text-xs opacity-90 mt-0.5">
                            Ver tu ID digital
                          </p>
                        </div>
                      </div>
                    </FighterIDModal>
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
                            <IconComponent className="h-5 w-5 text-accent-foreground opacity-90 hover:text-primary" />
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
                           <IconComponent className="h-5 w-5 text-accent-foreground opacity-90 hover:text-primary" />
                           <span className="font-medium">{item.name}</span>
                         </Link>
                       );
                     })}
                  </nav>
                </div>
                
                {/* Call to Actions */}
                <div className="border-t border-border p-6 space-y-3">
                  {user ? (
                    <>
                      <div className="text-center mb-4">
                        <p className="text-sm font-medium text-foreground">{user.email}</p>
                      </div>
                      {isAdmin && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setMobileMenuOpen(false)}
                          asChild
                        >
                          <Link to="/admin">
                            <Shield className="h-4 w-4 mr-2 text-accent-foreground opacity-90 hover:text-primary" />
                            Admin Panel
                          </Link>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2 text-accent-foreground opacity-90 hover:text-primary" />
                        Cerrar Sesión
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                      asChild
                    >
                      <Link to="/auth">Iniciar Sesión</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">Admin Panel</Link>
              </Button>
            )}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={user.email || 'Usuario'} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/fighter/me" className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-accent-foreground opacity-90 hover:text-primary" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-accent-foreground opacity-90 hover:text-primary" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2 text-accent-foreground opacity-90 hover:text-primary" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">Iniciar Sesión</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;