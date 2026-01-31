import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Calendar, Users, Download, CheckCircle, Clock, Bot, Shield, Trophy } from 'lucide-react';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import AdminLayoutWithAI from '@/components/admin/AIAssistant/AdminLayoutWithAI';
import AdminAnalytics from '@/components/AdminAnalytics';

export default function Dashboard() {
  const { stats, isLoading } = useRealTimeStats();
  const { dbConnected, authActive, lastUpdate } = useSystemStatus();

  const statsConfig = [
    {
      title: 'Peleadores Activos',
      value: stats?.totalFighters?.toString() || '0',
      description: 'Fighter IDs registrados',
      icon: Users,
    },
    {
      title: 'Eventos Totales',
      value: stats?.totalEvents?.toString() || '0',
      description: 'Eventos de pelea creados',
      icon: Calendar,
    },
    {
      title: 'Eventos en Vivo',
      value: stats?.liveEvents?.length?.toString() || '0',
      description: 'Peleas transmitiendo ahora',
      icon: Trophy,
    },
    {
      title: 'Licencias Activas',
      value: stats?.activeLicenses?.toString() || '0',
      description: 'Fighter IDs vigentes',
      icon: Shield,
    },
  ];
  return (
    <AdminLayoutWithAI>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Administrativo</h2>
        </div>

        {/* AI Assistant Intro Card - Compact */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">Asistente AI disponible</p>
              <p className="text-xs text-muted-foreground">
                Ayuda con torneos, Fighter IDs y más. Esquina inferior derecha.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {statsConfig.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* AI Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Comandos AI Sugeridos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-md bg-muted/50 border border-dashed">
                <Users className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">"Buscar peleadores activos"</p>
                  <p className="text-xs text-muted-foreground">Encontrar peleadores por criterios</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-md bg-muted/50 border border-dashed">
                <Trophy className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">"Estadísticas del sistema"</p>
                  <p className="text-xs text-muted-foreground">Ver métricas actuales</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-md bg-muted/50 border border-dashed">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">"Crear torneo de MMA"</p>
                  <p className="text-xs text-muted-foreground">Asistencia para nuevos eventos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <Download className="h-5 w-5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Importar Batalla de Gimnasios #1
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cargar evento completo con 36 peleadores
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/import-event">Importar</Link>
                </Button>
              </div>
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <Calendar className="h-5 w-5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Gestionar Eventos de Pelea
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Crear y administrar eventos MMA
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/admin/eventos-pelea">Gestionar</Link>
                </Button>
              </div>
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <Users className="h-5 w-5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Gestionar Peleadores
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Fighter IDs y perfiles con AI
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/admin/fighters-profiles">Gestionar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics Section */}
        <AdminAnalytics />

        {/* System Status and Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
              <CardDescription>
                Información general del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Base de Datos</span>
                <span className={`text-sm ${
                  dbConnected === null 
                    ? 'text-yellow-600' 
                    : dbConnected 
                      ? 'text-green-600' 
                      : 'text-red-600'
                }`}>
                  {dbConnected === null ? 'Verificando...' : dbConnected ? 'Conectada' : 'Desconectada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Autenticación</span>
                <span className={`text-sm ${authActive ? 'text-green-600' : 'text-red-600'}`}>
                  {authActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Asistente AI</span>
                <span className="text-sm text-green-600">Activo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Última actualización</span>
                <span className="text-sm text-muted-foreground">{lastUpdate}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Asistente AI activado</p>
                    <p className="text-xs text-muted-foreground">Sistema bilingüe disponible</p>
                  </div>
                  <Badge variant="secondary">Nuevo</Badge>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Dashboard actualizado</p>
                    <p className="text-xs text-muted-foreground">Integración AI completada</p>
                  </div>
                  <Badge>Hoy</Badge>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Funciones AI disponibles</p>
                    <p className="text-xs text-muted-foreground">Gestión de torneos y Fighter IDs</p>
                  </div>
                  <Badge variant="outline">Listo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayoutWithAI>
  );
}