import { Outlet } from 'react-router-dom';
import { Shield, QrCode, Calendar, FileText, LogOut, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger 
} from '@/components/ui/sidebar';

const navigation = [
  { name: 'Mi Licencia', href: '/license/dashboard', icon: Shield },
  { name: 'Código QR', href: '/license/qr', icon: QrCode },
  { name: 'Próximas Peleas', href: '/license/fights', icon: Calendar },
  { name: 'Historial', href: '/license/history', icon: FileText },
];

export default function LicenseLayout() {
  const { user, licenseData, signOut } = useLicenseAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'SUSPENDED': return 'bg-red-500';
      case 'PENDING_REVIEW': return 'bg-orange-500';
      case 'EXPIRED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activa';
      case 'SUSPENDED': return 'Suspendida';
      case 'PENDING_REVIEW': return 'En Revisión';
      case 'EXPIRED': return 'Expirada';
      default: return status;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-urban-light">
        {/* Header with trigger */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-sm border-b border-border flex items-center px-4">
          <SidebarTrigger className="text-primary" />
          <div className="ml-4 flex items-center gap-3">
            <Shield className="h-6 w-6 text-professional-primary" />
            <span className="font-bold text-lg">Licencia de Pelea</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {licenseData && (
              <Badge variant="outline" className={`${getStatusColor(licenseData.status)} text-white border-0`}>
                {getStatusText(licenseData.status)}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </header>

        <Sidebar className="mt-16">
          <SidebarContent>
            {/* User Profile */}
            <div className="p-4 border-b border-border">
              <Card className="p-4 bg-gradient-professional-light border border-professional-border/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-professional-accent/30">
                    <AvatarFallback className="bg-professional-primary text-professional-primary-foreground">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {user?.email}
                    </p>
                    {licenseData && (
                      <p className="text-sm text-muted-foreground">
                        {licenseData.license_number}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Navegación</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.href}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-professional-primary/10 text-professional-primary border-l-2 border-professional-accent' 
                                : 'hover:bg-muted/50'
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 mt-16 p-4">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}