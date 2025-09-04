import { Outlet } from 'react-router-dom';
import { Shield, Users, FileCheck, Settings, LogOut, TrendingUp } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
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
  { name: 'Panel Principal', href: '/admin-cert', icon: TrendingUp },
  { name: 'Validar Licencias', href: '/admin-cert/validate', icon: FileCheck },
  { name: 'Gestionar Peleadores', href: '/admin-cert/fighters', icon: Users },
  { name: 'Certificaciones Médicas', href: '/admin-cert/medical', icon: Shield },
  { name: 'Configuración', href: '/admin-cert/settings', icon: Settings },
];

export default function AdminCertLayout() {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-urban-light">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-sm border-b border-border flex items-center px-4">
          <SidebarTrigger className="text-primary" />
          <div className="ml-4 flex items-center gap-3">
            <Shield className="h-6 w-6 text-professional-primary" />
            <span className="font-bold text-lg">Panel de Certificación</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Admin: {user?.email}
            </span>
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
            <SidebarGroup>
              <SidebarGroupLabel>Administración</SidebarGroupLabel>
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
        <main className="flex-1 mt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}