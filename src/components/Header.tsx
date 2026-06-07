import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useFighterProfiles } from "@/hooks/useFighterProfiles";
import { useNotifications } from "@/hooks/useNotifications";
import { useMyGymStaff } from "@/hooks/gyms/useMyGymStaff";
import { useUserRole } from "@/hooks/useUserRole";
import { ProfileIncompleteNotification } from "@/components/ProfileIncompleteNotification";
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
import { Badge } from "@/components/ui/badge";
import { Menu, Trophy, Calendar, Home, Users, Shield, LogOut, User, Compass, Bell, Dumbbell, Radio, Building2, LayoutGrid, Timer } from "lucide-react";
import { useSystemAssets } from "@/hooks/useSystemAssets";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasFighterProfile, setHasFighterProfile] = useState(false);
  const { user, signOut } = useAuth();
  const { getUserFighterProfile } = useFighterProfiles();
  const { unreadCount } = useNotifications();
  const { logoUrl } = useSystemAssets();
  const { data: myGymStaff } = useMyGymStaff();
  const { isAdmin, loading: rolesLoading } = useUserRole();

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
    { name: "ARENA", href: "/arena", icon: Radio, highlight: true },
    { name: "Arena Control", href: "/time-master", icon: Timer },
    { name: "Social", href: "/social/feed", icon: Users },
    { name: "Eventos", href: "/eventos", icon: Calendar },
    { name: "En Vivo", href: "/en-vivo", icon: Radio },
    { name: "Peleadores", href: "/fighters", icon: Trophy },
    { name: "Mi Perfil", href: "/profile", icon: User },
  ];

  return (
    <>
      <ProfileIncompleteNotification />
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo + Título */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/" className="hover:scale-105 hover:opacity-90 transition-all duration-300 ease-out drop-shadow-lg touch-manipulation cursor-pointer min-h-[44px] flex items-center">
            <img 
              src={logoUrl} 
              alt="Fighter ID" 
              className="h-7 sm:h-8 md:h-9 w-auto"
            />
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-xs sm:text-sm md:text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Fighter ID
            </h1>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">Sistema de Licencias</p>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/social/feed">Social</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/eventos">Eventos</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/en-vivo" className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              En Vivo
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/fighters">Peleadores</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/arena" className="flex items-center gap-1.5 text-primary">
              <Radio className="h-3.5 w-3.5" />
              ARENA
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/time-master" className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" />
              Arena Control
            </Link>
          </Button>
          <Link to="/contacto" className="pill-button px-4 py-1.5 text-xs uppercase tracking-[0.12em] font-medium text-foreground/70 ml-2">
            Contacto
          </Link>
        </div>

        {/* Simplified Navigation for Medium Screens */}
        <div className="hidden md:flex lg:hidden items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/social/feed">Social</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/eventos">Eventos</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/en-vivo" className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              En Vivo
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/fighters">Peleadores</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/time-master" className="flex items-center gap-1.5 text-primary">
              <Timer className="h-3.5 w-3.5" />
              Time Master
            </Link>
          </Button>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Time Master - Mobile only, always visible */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px] touch-manipulation text-primary"
            asChild
          >
            <Link to="/time-master" aria-label="Time Master">
              <Timer className="h-5 w-5" />
            </Link>
          </Button>

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
                      src={logoUrl} 
                      alt="Fighter ID" 
                      className="h-8 sm:h-10 w-auto"
                    />
                  </Link>
                </div>
                
                {/* Navigation Items */}
                <div className="flex-1 py-2 overflow-y-auto">
                  <div className="border-b border-border pb-4 px-3 sm:px-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Navegación
                    </h3>
                    <nav className="space-y-1">
                      {navigationItems.map((item) => {
                        const IconComponent = item.icon;
                        const isHighlight = (item as { highlight?: boolean }).highlight;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors min-h-[48px] touch-manipulation ${
                              isHighlight
                                ? "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15"
                                : "text-foreground hover:bg-muted hover:text-primary"
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <IconComponent className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium text-base">{item.name}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Mis Módulos - Mobile */}
                  {user && (
                    <div className="border-b border-border py-4 px-3 sm:px-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Mis Módulos
                      </h3>
                      <nav className="space-y-1">
                        {hasFighterProfile ? (
                          <Link
                            to="/license/dashboard"
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors min-h-[48px] touch-manipulation"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Shield className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium text-base">Mi Fighter ID</span>
                          </Link>
                        ) : (
                          <Link
                            to="/license/onboarding"
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors min-h-[48px] touch-manipulation"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Shield className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium text-base">Obtén tu Fighter ID</span>
                          </Link>
                        )}

                        {myGymStaff ? (
                          <Link
                            to={`/gym/${myGymStaff.gymId}/dashboard`}
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors min-h-[48px] touch-manipulation"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Building2 className="h-5 w-5 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="font-medium text-base truncate block">{myGymStaff.gymName}</span>
                              <span className="text-xs text-muted-foreground">Dashboard</span>
                            </div>
                          </Link>
                        ) : (
                          <Link
                            to="/gym/onboarding"
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors min-h-[48px] touch-manipulation"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Building2 className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium text-base">Registrar Gimnasio</span>
                          </Link>
                        )}

                        {isAdmin && (
                          <Link
                            to="/admin/dashboard"
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors min-h-[48px] touch-manipulation"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Shield className="h-5 w-5 flex-shrink-0 text-amber-500" />
                            <span className="font-medium text-base">Panel Admin</span>
                          </Link>
                        )}

                        <Link
                          to="/profile/hub"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground hover:bg-muted hover:text-primary transition-colors min-h-[48px] touch-manipulation"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LayoutGrid className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium text-base">Gestionar Módulos</span>
                        </Link>
                      </nav>
                    </div>
                  )}
                </div>
                
                {/* User Actions */}
                {user && (
                  <div className="border-t border-border pt-4 px-3 sm:px-4 pb-4">
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
              <>
                {/* Notification Bell */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative min-h-[44px] min-w-[44px] touch-manipulation" 
                  asChild
                >
                  <Link to="/social/notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Link>
                </Button>

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
                <DropdownMenuContent align="end" className="w-64 bg-background/95 backdrop-blur-md z-[100]">
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

                  {/* Mis Módulos Section */}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Mis Módulos</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to={hasFighterProfile ? "/license/dashboard" : "/license/onboarding"} className="cursor-pointer min-h-[44px] touch-manipulation">
                      <Shield className="mr-2 h-4 w-4" />
                      {hasFighterProfile ? "Mi Fighter ID" : "Obtén tu Fighter ID"}
                    </Link>
                  </DropdownMenuItem>
                  {myGymStaff ? (
                    <DropdownMenuItem asChild>
                      <Link to={`/gym/${myGymStaff.gymId}/dashboard`} className="cursor-pointer min-h-[44px] touch-manipulation">
                        <Building2 className="mr-2 h-4 w-4" />
                        {myGymStaff.gymName}
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link to="/gym/onboarding" className="cursor-pointer min-h-[44px] touch-manipulation">
                        <Building2 className="mr-2 h-4 w-4" />
                        Registrar Gimnasio
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard" className="cursor-pointer min-h-[44px] touch-manipulation">
                        <Shield className="mr-2 h-4 w-4 text-amber-500" />
                        Panel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/profile/hub" className="cursor-pointer min-h-[44px] touch-manipulation">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Gestionar Módulos
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer min-h-[44px] touch-manipulation">
                      <Home className="mr-2 h-4 w-4" />
                      Inicio
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive min-h-[44px] touch-manipulation">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <Button variant="default" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/auth">Iniciar Sesión</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;
