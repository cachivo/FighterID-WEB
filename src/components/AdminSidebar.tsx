import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Monitor, 
  Briefcase, 
  TrendingUp, 
  Users, 
  Settings,
  Vote,
  DollarSign,
  LogOut,
  Shield,
  HandHeart,
  Gavel,
  Radio,
  Trophy
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const adminItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Eventos Deportivos', url: '/admin/eventos-deportivos', icon: Calendar },
  { title: 'Eventos de Pelea', url: '/admin/eventos-pelea', icon: Users },
  { title: 'Eventos Digitales', url: '/admin/eventos-digitales', icon: Monitor },
  { title: 'Aliados Estratégicos', url: '/admin/aliados-estrategicos', icon: HandHeart },
  { title: 'Peleadores', url: '/admin/fighters', icon: Users },
  { title: 'Ranking', url: '/admin/ranking', icon: TrendingUp },
  { title: 'Votaciones', url: '/admin/votaciones', icon: Vote },
  { title: 'Betting & Markets', url: '/admin/betting', icon: DollarSign },
  { title: 'Licencias', url: '/admin/licencias', icon: Shield },
  { title: 'Solicitudes de Cambio', url: '/admin/profile-requests', icon: Settings },
  { title: 'Comunidad', url: '/admin/comunidad', icon: Users },
  { title: 'Configuración', url: '/admin/configuracion', icon: Settings },
];

const fightControlItems = [
  { title: 'Jueces & Oficiales', url: '/admin/judges', icon: Gavel },
  { title: 'Control de Peleas', url: '/admin/live-events', icon: Radio },
  { title: 'Resultados & Stats', url: '/admin/fight-results', icon: Trophy },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) => 
    isActive(path) ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="text-lg font-bold text-primary">
            Admin Panel
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/admin'}
                      className={getNavCls(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Control de Peleas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fightControlItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="text-sm text-muted-foreground mb-2">
            {user?.email}
          </div>
        )}
        <Button 
          variant="outline" 
          size={collapsed ? "icon" : "default"}
          onClick={() => signOut()}
          className="w-full"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}