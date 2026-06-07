import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Trophy, Filter, Mic, Crown, Zap, Target, Radio } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Events = () => {
  const { events, loading } = useEvents();
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'live':
        return 'bg-destructive text-destructive-foreground animate-pulse';
      case 'finished':
        return 'bg-muted-foreground text-background';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'draft':
        return 'Borrador';
      case 'published':
        return 'Próximo';
      case 'live':
        return 'EN VIVO';
      case 'finished':
        return 'Finalizado';
      default:
        return state.toUpperCase();
    }
  };

  // Filtrado mejorado
  const filteredEvents = events.filter(event => {
    // Filtro por disciplina
    if (disciplineFilter !== 'all' && event.discipline !== disciplineFilter) {
      return false;
    }
    
    // Filtro por estado
    if (stateFilter !== 'all') {
      if (stateFilter === 'upcoming' && event.state !== 'published') return false;
      if (stateFilter === 'live' && event.state !== 'live') return false;
      if (stateFilter === 'finished' && event.state !== 'finished') return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-20">
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Cargando Eventos...
              </h1>
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardHeader className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const liveStreamingEvents = events.filter(e => {
    const meta = e.meta as { live_stream?: { is_streaming?: boolean } } | null;
    return e.state === 'live' && meta?.live_stream?.is_streaming;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Live streaming banner */}
      {liveStreamingEvents.length > 0 && (
        <section className="bg-destructive/10 border-b border-destructive/20 pt-16">
          <div className="container mx-auto px-3 sm:px-4 py-3">
            <Link to="/en-vivo" className="flex items-center gap-3 group">
              <div className="relative">
                <Radio className="w-5 h-5 text-destructive" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full animate-ping" />
              </div>
              <span className="font-bold text-destructive">
                🔴 {liveStreamingEvents.length} evento{liveStreamingEvents.length > 1 ? 's' : ''} en vivo ahora
              </span>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                — Ver transmisiones →
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Optimized Hero Section */}
      <section className={`relative py-12 ${liveStreamingEvents.length === 0 ? 'pt-20' : 'pt-4'} bg-gradient-to-b from-background via-background/95 to-background`}>
        <div className="container mx-auto px-3 sm:px-4">
          <PageHeader
            title="Eventos de Combate"
            subtitle="Descubre los próximos eventos, peleas en vivo y resultados de las mejores batallas de MMA."
            backTo="/"
            backLabel="Volver al inicio"
          />
          
          {/* Indicador de sincronización en vivo */}
          <div className="flex items-center gap-2 text-sm text-green-500 mt-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Sincronizado en tiempo real</span>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="py-3 sm:py-4 border-b">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col xs:flex-row flex-wrap gap-2 sm:gap-4">
            {/* Filtro por estado */}
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full xs:w-[180px] sm:w-[200px] min-h-[44px] touch-manipulation">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="upcoming">Próximos</SelectItem>
                <SelectItem value="live">En vivo</SelectItem>
                <SelectItem value="finished">Finalizados</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por disciplina */}
            <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
              <SelectTrigger className="w-full xs:w-[180px] sm:w-[200px] min-h-[44px] touch-manipulation">
                <SelectValue placeholder="Filtrar por disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las disciplinas</SelectItem>
                <SelectItem value="MMA">MMA</SelectItem>
                <SelectItem value="Boxeo">Boxeo</SelectItem>
                <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                <SelectItem value="Muay Thai">Muay Thai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>


      {/* Events Grid */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-2xl font-bold mb-2">No hay eventos disponibles</h3>
              <p className="text-muted-foreground">
                {stateFilter !== 'all' || disciplineFilter !== 'all' 
                  ? 'Intenta cambiar los filtros'
                  : 'Pronto habrá nuevos eventos emocionantes.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="border-border/50 hover:border-primary/50 transition-colors group">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getStateColor(event.state)}>
                        {getStateText(event.state)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {event.discipline.toUpperCase()}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      {event.name}
                    </CardTitle>
                    {event.description && (
                      <CardDescription className="text-sm">
                        {event.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {event.venue && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.venue}</span>
                      </div>
                    )}
                    
                    {event.start_time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(event.start_time), 'PPP', { locale: es })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Ver peleadores y peleas</span>
                    </div>

                    <div className="pt-4">
                      <Button asChild className="w-full">
                        <Link to={`/evento/${event.id}`}>
                          Ver Evento Completo
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Events;