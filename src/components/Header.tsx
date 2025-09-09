import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useFighterProfiles } from "@/hooks/useFighterProfiles";
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
import { Menu, Trophy, Monitor, Settings, BarChart3, Users, Phone, DollarSign, ChevronDown, Shield, LogOut, User } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasFighterProfile, setHasFighterProfile] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { getUserFighterProfile } = useFighterProfiles();

  const handleLogout = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  // Check if user has fighter profile
  useEffect(() => {
    const checkFighterProfile = async () => {
      if (user) {
        try {
          const profile = await getUserFighterProfile();
          setHasFighterProfile(!!profile);
        } catch {
          setHasFighterProfile(false);
        }
      } else {
        setHasFighterProfile(false);
      }
    };

    checkFighterProfile();
  }, [user, getUserFighterProfile]);

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="hover:opacity-80 transition-opacity touch-manipulation">
            <img 
              src="/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png" 
              alt="Fighter ID" 
              className="h-7 sm:h-8 md:h-10 w-auto"
            />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-2">
            {/* Fighter ID - Only show in central nav if user is logged in AND has fighter profile */}
            {user && hasFighterProfile && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link 
                    to="/license/dashboard" 
                    className="group inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Fighter ID
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link 
                  to="/eventos" 
                  className="group inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-1 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                >
                  Eventos
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link 
                  to="/fighters" 
                  className="group inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-1 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                >
                  Fighters
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link 
                  to="/predicciones" 
                  className="group inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-1 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                >
                  Predicciones
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a 
                  href="#ranking" 
                  className="group inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-1 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                >
                  Ranking
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Simplified Navigation for Medium Screens */}
        <nav className="hidden md:flex lg:hidden items-center space-x-4">
          {user && hasFighterProfile && (
            <Link 
              to="/license/dashboard"
              className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              <Shield className="h-3 w-3" />
              Fighter ID
            </Link>
          )}
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
              <Button variant="ghost" size="icon" className="md:hidden min-h-[44px] min-w-[44px] touch-manipulation">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
              <div className="flex flex-col h-full">
                {/* Header del Sheet */}
                <div className="border-b border-border p-4 sm:p-6">
                  <Link 
                    to="/" 
                    className="hover:opacity-80 transition-opacity touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <img 
                      src="/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png" 
                      alt="Fighter ID" 
                      className="h-8 sm:h-10 w-auto"
                    />
                  </Link>
                </div>
                
                {/* Navigation Items */}
                <div className="flex-1 py-2">
                  {/* Featured Fighter ID - Only for non-fighters */}
                  {(!user || !hasFighterProfile) && (
                    <div className="px-3 sm:px-4 pb-4">
                      <Link
                        to="/license/dashboard"
                        className="flex items-center gap-3 rounded-lg px-4 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-2 border-primary/20 min-h-[56px] touch-manipulation"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="h-6 w-6 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-base">Fighter ID</span>
                          <p className="text-xs opacity-90 mt-0.5">
                            Obtén tu licencia de peleador
                          </p>
                        </div>
                      </Link>
                    </div>
                  )}
                  
                  <nav className="space-y-1 px-3 sm:px-4">
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
                            className="flex items-center gap-3 rounded-lg px-3 py-4 text-foreground hover:bg-muted hover:text-primary transition-colors min-h-[48px] touch-manipulation"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <IconComponent className="h-5 w-5 text-accent-foreground opacity-90 hover:text-primary flex-shrink-0" />
                            <span className="font-medium text-base">{item.name}</span>
                          </Link>
                        );
                     })}
                  </nav>
                </div>
                
                {/* Call to Actions */}
                <div className="border-t border-border p-4 sm:p-6 space-y-3">
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
          <div className="hidden sm:flex items-center gap-2">
            {/* Fighter ID - Show in actions when not logged in OR logged in without fighter profile */}
            {(!user || (user && !hasFighterProfile)) && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/license/dashboard" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Fighter ID
                </Link>
              </Button>
            )}
            
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