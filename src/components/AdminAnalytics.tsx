import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, TrendingUp, Award, Filter, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('30');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics', dateRange, categoryFilter],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const [
        fightersGrowth,
        eventsByDiscipline,
        licensesByStatus,
        recentActivity,
        topFighters
      ] = await Promise.all([
        // Fighters growth over time
        supabase
          .from('fighter_profiles')
          .select('created_at, discipline')
          .gte('created_at', startDate.toISOString())
          .eq('active', true)
          .order('created_at'),

        // Events by discipline
        supabase
          .from('bdg_event')
          .select('discipline, state, created_at')
          .gte('created_at', startDate.toISOString()),

        // License status distribution
        supabase
          .from('fighter_licenses')
          .select('status, created_at')
          .gte('created_at', startDate.toISOString()),

        // Recent activity
        supabase
          .from('fighter_status_updates')
          .select('created_at, fighter_id')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(100),

        // Top performers
        supabase
          .from('fighter_profiles')
          .select('first_name, last_name, record_wins, record_losses, country, discipline')
          .eq('active', true)
          .order('record_wins', { ascending: false })
          .limit(10)
      ]);

      // Process fighters growth data
      const growthData = processGrowthData(fightersGrowth.data || [], dateRange);

      // Process events by discipline
      const disciplineData = processDisciplineData(eventsByDiscipline.data || []);

      // Process license status
      const licenseData = processLicenseData(licensesByStatus.data || []);

      // Calculate activity metrics
      const activityMetrics = {
        totalNewFighters: fightersGrowth.data?.length || 0,
        totalEvents: eventsByDiscipline.data?.length || 0,
        averageDailyActivity: Math.round((recentActivity.data?.length || 0) / parseInt(dateRange)),
        topCountries: getTopCountries(fightersGrowth.data || [])
      };

      return {
        growthData,
        disciplineData,
        licenseData,
        activityMetrics,
        topFighters: topFighters.data || [],
        recentActivity: recentActivity.data || []
      };
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = analytics!;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Analytics Avanzados</h3>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="90">90 días</SelectItem>
              <SelectItem value="365">1 año</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="MMA">MMA</SelectItem>
              <SelectItem value="Boxeo">Boxeo</SelectItem>
              <SelectItem value="Judo">Judo</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Peleadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activityMetrics.totalNewFighters}</div>
            <p className="text-xs text-muted-foreground">
              Últimos {dateRange} días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Creados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activityMetrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: {Math.round(stats.activityMetrics.totalEvents / parseInt(dateRange) * 7)} por semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Diaria</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activityMetrics.averageDailyActivity}</div>
            <p className="text-xs text-muted-foreground">
              Updates promedio por día
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">País Líder</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activityMetrics.topCountries[0]?.country || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activityMetrics.topCountries[0]?.count || 0} peleadores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Crecimiento de Peleadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Discipline Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Eventos por Disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.disciplineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="discipline" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* License Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estado de Licencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.licenseData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.licenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getLicenseColor(entry.status)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Fighters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Peleadores por Récord</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topFighters.slice(0, 5).map((fighter, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <div>
                    <p className="font-medium">{fighter.first_name} {fighter.last_name}</p>
                    <p className="text-sm text-muted-foreground">{fighter.country} • {fighter.discipline}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{fighter.record_wins}-{fighter.record_losses}</p>
                  <p className="text-xs text-muted-foreground">
                    {fighter.record_wins + fighter.record_losses > 0 
                      ? `${fighter.record_wins + fighter.record_losses} peleas`
                      : 'Debut'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function processGrowthData(data: any[], dateRange: string) {
  const days = parseInt(dateRange);
  const result = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dayStr = date.toISOString().split('T')[0];
    
    const count = data.filter(item => 
      item.created_at.split('T')[0] <= dayStr
    ).length;
    
    result.push({
      date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      total: count
    });
  }
  
  return result;
}

function processDisciplineData(data: any[]) {
  const disciplines = data.reduce((acc, item) => {
    acc[item.discipline] = (acc[item.discipline] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(disciplines).map(([discipline, count]) => ({
    discipline,
    count
  }));
}

function processLicenseData(data: any[]) {
  const statuses = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(statuses).map(([status, count]) => ({
    status,
    count
  }));
}

function getTopCountries(data: any[]): Array<{country: string, count: number}> {
  const countries: Record<string, number> = data.reduce((acc, item) => {
    const country = item.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(countries)
    .map(([country, count]) => ({ country, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getLicenseColor(status: string) {
  switch (status) {
    case 'ACTIVE': return '#10B981';
    case 'PENDING_REVIEW': return '#F59E0B';
    case 'SUSPENDED': return '#EF4444';
    case 'EXPIRED': return '#6B7280';
    default: return '#8B5CF6';
  }
}