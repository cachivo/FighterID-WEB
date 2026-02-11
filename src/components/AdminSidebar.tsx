import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Monitor, 
  Briefcase, 
  TrendingUp, 
  Users, 
  Settings,
  DollarSign,
  LogOut,
  Shield,
  HandHeart,
  Gavel,
  Radio,
  Trophy,
  Activity,
  TestTube2,
  Mail,
  Send,
  Medal,
  ImageIcon
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
import { useSuperAdmin } from '@/hooks/useSuperAdmin';

const adminItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Centro de Moderación', url: '/admin/pending-changes', icon: Activity },
  { title: 'Eventos de Pelea', url: '/admin/eventos-pelea', icon: Calendar },
  { title: 'Aliados Estratégicos', url: '/admin/aliados-estrategicos', icon: HandHeart },
  { title: 'Perfiles de Peleadores', url: '/admin/fighters-profiles', icon: Users },
  { title: 'Gestión de Rankings', url: '/admin/rankings', icon: Medal },
  { title: 'Gimnasios / Escuelas', url: '/admin/gimnasios', icon: Briefcase },
  { title: 'Entrenadores', url: '/admin/entrenadores', icon: Users },
  { title: 'Licencias Fighter ID', url: '/admin/licencias', icon: Shield },
  { title: 'Betting & Markets', url: '/admin/betting', icon: DollarSign },
  { title: 'Monitor de Emails', url: '/admin/email-monitoring', icon: Mail },
  { title: 'Campañas de Email', url: '/admin/email-campaigns', icon: Mail },
  { title: 'Editor de Emails', url: '/admin/email-campaigns/editor', icon: Send },
  { title: 'Comunidad', url: '/admin/comunidad', icon: Users },
];

const superAdminItems = [
  { title: 'Assets del Sistema', url: '/admin/system-assets', icon: ImageIcon },
  { title: 'Gestión de Roles', url: '/admin/user-roles', icon: Shield },
  { title: 'Configuración', url: '/admin/configuracion', icon: Settings },
];

const fightControlItems = [
  { title: 'Jueces & Oficiales', url: '/admin/judges', icon: Gavel },
  { title: 'Estaciones de Scoring', url: '/admin/scoring/stations', icon: Monitor },
  { title: 'Control de Peleas', url: '/admin/live-events', icon: Radio },
  { title: 'Resultados & Stats', url: '/admin/fight-results', icon: Trophy },
  { title: 'Monitor de IA', url: '/admin/ai-strike-monitor', icon: Activity },
  { title: '🧪 Pruebas IA', url: '/admin/ai-strike-test', icon: TestTube2 },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
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

        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Cuenta Maestra</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminItems.map((item) => (
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
        )}
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