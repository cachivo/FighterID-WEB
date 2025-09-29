import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, TrendingUp, Clock, DollarSign, Trophy } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Gamepad2, Mic, Sword, Zap } from "lucide-react";

interface BDGEvent {
  id: string;
  name: string;
  discipline: string;
  description?: string;
  venue?: string;
  state: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  markets?: Market[];
}

interface Market {
  id: string;
  title: string;
  state: string;
  total_pool?: number;
  outcome_count?: number;
}

export default function Predicciones() {
  const [events, setEvents] = useState<BDGEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch events with their markets
      const { data: eventsData, error: eventsError } = await supabase
        .from('bdg_event')
        .select(`
          *,
          market!inner (
            id,
            title,
            state,
            outcome (pool)
          )
        `)
        .in('state', ['live', 'finished'])
        .order('start_time', { ascending: false });

      if (eventsError) throw eventsError;

      // Process the data to calculate market stats
      const processedEvents = eventsData?.map(event => ({
        ...event,
        markets: event.market?.map((market: any) => ({
          id: market.id,
          title: market.title,
          state: market.state,
          total_pool: market.outcome?.reduce((sum: number, outcome: any) => sum + (outcome.pool || 0), 0) || 0,
          outcome_count: market.outcome?.length || 0
        }))
      })) || [];

      setEvents(processedEvents);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los eventos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'live': return 'bg-green-100 text-green-800 border-green-200';
      case 'finished': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'live': return { text: 'EN VIVO', icon: <TrendingUp className="h-3 w-3" /> };
      case 'finished': return { text: 'FINALIZADO', icon: <Trophy className="h-3 w-3" /> };
      default: return { text: state.toUpperCase(), icon: null };
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline.toLowerCase()) {
      case 'boxing': return <Sword className="h-5 w-5" />;
      case 'rap': return <Mic className="h-5 w-5" />;
      case 'chess': return <Zap className="h-5 w-5" />;
      case 'esports': return <Gamepad2 className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.discipline.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiscipline = disciplineFilter === 'all' || event.discipline === disciplineFilter;
    const matchesState = stateFilter === 'all' || event.state === stateFilter;
    
    return matchesSearch && matchesDiscipline && matchesState;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-64"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Optimized Hero Section */}
        <PageHeader
          title="Predicciones BDG"
          subtitle="Apuesta en los mejores eventos de batalla. Boxing, Rap, Chess y más."
          backTo="/"
          backLabel="Volver al inicio"
          className="text-center"
        />

        {/* Filters */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black border-gray-700"
              />
              <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                <SelectTrigger className="bg-black border-gray-700">
                  <SelectValue placeholder="Todas las disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las disciplinas</SelectItem>
                  <SelectItem value="boxing">Boxing</SelectItem>
                  <SelectItem value="rap">Rap Battle</SelectItem>
                  <SelectItem value="chess">Chess</SelectItem>
                  <SelectItem value="esports">Esports</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="bg-black border-gray-700">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="live">En Vivo</SelectItem>
                  <SelectItem value="finished">Finalizados</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {filteredEvents.length} eventos encontrados
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const stateBadge = getStateBadge(event.state);
            const totalPool = event.markets?.reduce((sum, market) => sum + (market.total_pool || 0), 0) || 0;
            const marketCount = event.markets?.length || 0;
            
            return (
              <Card key={event.id} className="bg-gray-900 border-gray-800 hover:border-orange-500 transition-colors group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getDisciplineIcon(event.discipline)}
                      <Badge className={getStateColor(event.state)}>
                        {stateBadge.icon}
                        <span className="ml-1">{stateBadge.text}</span>
                      </Badge>
                    </div>
                    {event.state === 'live' && (
                      <div className="flex items-center gap-1 text-green-400 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-xs font-medium">LIVE</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl text-white group-hover:text-orange-400 transition-colors">
                    {event.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {event.discipline} • {event.venue}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {event.description}
                  </p>
                  
                  {event.start_time && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4" />
                      {new Date(event.start_time).toLocaleDateString('es', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-gray-400">
                        <TrendingUp className="h-4 w-4" />
                        <span>{marketCount} mercados</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <DollarSign className="h-4 w-4" />
                        <span>{totalPool.toFixed(0)} pool total</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link to={`/evento/${event.id}/betting`}>
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                      disabled={event.state === 'finished'}
                    >
                      {event.state === 'live' ? 'Apostar Ahora' : 
                       event.state === 'finished' ? 'Ver Resultados' : 'Ver Evento'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No hay eventos disponibles</h3>
              <p className="text-gray-500">
                Ajusta los filtros o vuelve más tarde para ver nuevos eventos de batalla.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
}