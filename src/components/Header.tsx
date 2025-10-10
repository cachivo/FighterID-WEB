import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useFighterProfiles } from "@/hooks/useFighterProfiles";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/optimized-dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Trophy, Calendar, Home, BarChart3, Users, DollarSign, Shield, LogOut, User, CreditCard, Compass, Bell } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasFighterProfile, setHasFighterProfile] = useState(false);
  const { user, signOut } = useAuth();
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
    { name: "Inicio", href: "/", icon: Home },
    { name: "Social", href: "/social/feed", icon: Users },
    { name: "Eventos", href: "/eventos", icon: Calendar },
    { name: "Peleadores", href: "/fighters", icon: Trophy },
    { name: "Predicciones", href: "/predicciones", icon: BarChart3 },
    { name: "Mi Perfil", href: "/profile", icon: User },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo + Título */}
        <div className="flex items-center gap-3">
          <Link to="/" className="hover:scale-105 hover:opacity-90 transition-all duration-300 ease-out drop-shadow-lg touch-manipulation cursor-pointer">
            <img 
              src="/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png" 
              alt="Fighter ID" 
              className="h-7 sm:h-8 md:h-10 w-auto"
            />
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-sm md:text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Fighter ID
            </h1>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">Sistema de Licencias</p>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="mr-2 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 font-semibold shadow-lg"
                >
                  <Shield className="h-4 w-4" />
                  Fighter ID
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sistema de Licencias</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hasFighterProfile ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/license/dashboard" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Ver mi Fighter ID
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/license/welcome" className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Obtén tu licencia
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Inicio</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/social/feed">Social</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/eventos">Eventos</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/fighters">Peleadores</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/predicciones">Predicciones</Link>
          </Button>
        </div>

        {/* Simplified Navigation for Medium Screens */}
        <div className="hidden md:flex lg:hidden items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Inicio</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/social/feed">Social</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/eventos">Eventos</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/fighters">Peleadores</Link>
          </Button>
        </div>
        
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
                    className="hover:scale-105 hover:opacity-90 transition-all duration-300 ease-out drop-shadow-lg touch-manipulation cursor-pointer"
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
                  <div className="mb-4 px-3 sm:px-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Principal
                    </h3>
                    {user && (
                      <Button 
                        variant="default" 
                        asChild 
                        className="w-full justify-start gap-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 font-semibold shadow-lg text-base h-12"
                        size="lg"
                      >
                        <Link to={hasFighterProfile ? "/license/dashboard" : "/license/welcome"} onClick={() => setMobileMenuOpen(false)}>
                          <Shield className="h-6 w-6" />
                          {hasFighterProfile ? "Mi Fighter ID" : "Obtén tu Fighter ID"}
                        </Link>
                      </Button>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 px-3 sm:px-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Navegación
                    </h3>
                    <nav className="space-y-1">
                      {navigationItems.map((item) => {
                        const IconComponent = item.icon;
                        
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors min-h-[48px] touch-manipulation"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <IconComponent className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium text-base">{item.name}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </div>
                
                {/* Call to Actions */}
                {user && (
                  <div className="border-t border-border pt-4 px-3 sm:px-4 pb-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Mi Cuenta
                    </h3>
                    <div className="space-y-1 mb-4">
                      <div className="text-sm font-medium text-foreground px-3 py-2">{user.email}</div>
                      <Link 
                        to="/profile"
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors min-h-[44px] touch-manipulation"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Mi Perfil</span>
                      </Link>
                      <Link 
                        to={hasFighterProfile ? "/license/dashboard" : "/license/welcome"}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors min-h-[44px] touch-manipulation"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="h-4 w-4" />
                        <span>{hasFighterProfile ? "Fighter ID" : "Obtén tu Fighter ID"}</span>
                      </Link>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground min-h-[44px]"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </div>
                )}
                
                {!user && (
                  <div className="border-t border-border p-4 sm:p-6">
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                      asChild
                    >
                      <Link to="/auth">Iniciar Sesión</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* User Actions - Visible on all screens */}
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0 min-h-[44px] min-w-[44px] touch-manipulation">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarImage src="" alt={user.email || 'Usuario'} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 z-[100]">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <div className="px-2 py-1.5">
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer min-h-[44px] touch-manipulation">
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={hasFighterProfile ? "/license/dashboard" : "/license/welcome"} className="cursor-pointer min-h-[44px] touch-manipulation">
                      <Shield className="mr-2 h-4 w-4" />
                      {hasFighterProfile ? "Fighter ID" : "Obtén tu Fighter ID"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer min-h-[44px] touch-manipulation">
                      <Home className="mr-2 h-4 w-4" />
                      Feed
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/social/friends" className="cursor-pointer min-h-[44px] touch-manipulation">
                      <Users className="mr-2 h-4 w-4" />
                      Amigos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/social/discover" className="cursor-pointer min-h-[44px] touch-manipulation">
                      <Compass className="mr-2 h-4 w-4" />
                      Descubrir
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/social/notifications" className="cursor-pointer min-h-[44px] touch-manipulation">
                      <Bell className="mr-2 h-4 w-4" />
                      Notificaciones
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive min-h-[44px] touch-manipulation">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" asChild className="hidden sm:inline-flex">
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