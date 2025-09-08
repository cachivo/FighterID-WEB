import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Calendar, Monitor, Briefcase, TrendingUp, Users, Settings, Download, 
  CheckCircle, Clock, AlertCircle, Bot } from 'lucide-react';
import { useSystemStats } from '@/hooks/useSystemStats';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import AdminLayoutWithAI from '@/components/admin/AIAssistant/AdminLayoutWithAI';

export default function Dashboard() {
  const { stats, isLoading } = useSystemStats();
  const { dbConnected, authActive, lastUpdate } = useSystemStatus();

  const statsConfig = [
    {
      title: 'Eventos Deportivos',
      value: stats?.eventosDeportivos?.toString() || '0',
      description: 'Tipos de eventos activos',
      icon: Calendar,
    },
    {
      title: 'Eventos Digitales',
      value: stats?.eventosDigitales?.toString() || '0',
      description: 'Servicios digitales disponibles',
      icon: Monitor,
    },
    {
      title: 'Estadísticas',
      value: stats?.estadisticas?.toString() || '0',
      description: 'Métricas en el ranking',
      icon: TrendingUp,
    },
  ];
  return (
    <AdminLayoutWithAI>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h2>
          <p className="text-muted-foreground">
            Panel de control con asistencia AI para la gestión completa del sistema
          </p>
        </div>

        {/* AI Assistant Intro Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <CardTitle>Asistente AI Administrativo Disponible</CardTitle>
            </div>
            <CardDescription>
              Tu asistente inteligente bilingüe está listo para ayudarte con gestión de torneos, 
              Fighter IDs, licencias y más. Encuéntralo en la esquina inferior derecha.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* AI Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Comandos AI Sugeridos</CardTitle>
              <CardDescription>
                Prueba estos comandos con el asistente AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-md bg-muted/50 border border-dashed">
                <Users className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">"Buscar peleadores activos"</p>
                  <p className="text-xs text-muted-foreground">Encontrar peleadores por criterios</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-md bg-muted/50 border border-dashed">
                <TrendingUp className="h-5 w-5 text-green-600" />
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
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Accesos directos a las funciones más utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    Gestionar Eventos Deportivos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Añadir, editar o eliminar tipos de eventos
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/admin/eventos-deportivos">Gestionar</Link>
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
                  <Link to="/admin/fighters">Gestionar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status and Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
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