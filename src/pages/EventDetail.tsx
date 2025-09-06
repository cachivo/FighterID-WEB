import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Trophy, Clock, Weight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEvents, useFights } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { events, loading: eventsLoading } = useEvents();
  const { fights, loading: fightsLoading, error: fightsError } = useFights(eventId);
  
  const [event, setEvent] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('EventDetail - Debug Info:', {
      eventId,
      eventsLoading,
      fightsLoading,
      fightsError,
      eventsCount: events.length,
      fightsCount: fights.length,
      fights: fights
    });
  }, [eventId, events, fights, eventsLoading, fightsLoading, fightsError]);

  useEffect(() => {
    if (eventId && events.length > 0) {
      const foundEvent = events.find(e => e.id === eventId);
      console.log('EventDetail - Found event:', foundEvent);
      setEvent(foundEvent || null);
    }
  }, [eventId, events]);

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
      case 'live':
        return 'EN VIVO';
      case 'finished':
        return 'Finalizado';
      default:
        return state.toUpperCase();
    }
  };

  const getFightTypeColor = (type: string) => {
    return type === 'PROFESSIONAL' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground';
  };

  if (eventsLoading || fightsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-10 bg-muted rounded"></div>
              <div className="w-48 h-8 bg-muted rounded"></div>
            </div>
            <div className="w-full h-32 bg-muted rounded"></div>
            <div className="grid gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-full h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Evento no encontrado</h2>
          <p className="text-muted-foreground mb-4">El evento que buscas no existe o ha sido eliminado.</p>
          <Button asChild>
            <Link to="/eventos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Eventos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/eventos">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Eventos
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className={getStateColor(event.state)}>
                  {getStateText(event.state)}
                </Badge>
                <Badge variant="outline">
                  {event.discipline.toUpperCase()}
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {event.name}
              </h1>
              
              {event.description && (
                <p className="text-lg text-muted-foreground mb-4">
                  {event.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.venue}</span>
                  </div>
                )}
                
                {event.start_time && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(event.start_time), 'PPP', { locale: es })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {event.state === 'live' && (
              <Button size="lg" className="animate-pulse">
                <Trophy className="w-5 h-5 mr-2" />
                Ver EN VIVO
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Fight Card */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Card de Peleas</h2>
            <p className="text-muted-foreground">
              {fights.length} peleas programadas para este evento
            </p>
          </div>

          {fights.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay peleas programadas</h3>
                <p className="text-muted-foreground">Las peleas se añadirán próximamente.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {fights.map((fight) => (
                <Card key={fight.id} className="border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                          #{fight.fight_number}
                        </Badge>
                        <Badge className={getFightTypeColor(fight.fight_type)}>
                          {fight.fight_type}
                        </Badge>
                        <Badge variant="secondary">
                          <Weight className="w-3 h-3 mr-1" />
                          {fight.weight_class}
                        </Badge>
                      </div>
                      
                      {fight.scheduled_time && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(fight.scheduled_time), 'HH:mm')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6 items-center">
                      {/* Fighter A */}
                      <div className="text-center">
                        <div className="mb-3">
                          {fight.fighter_a?.avatar_url ? (
                            <img 
                              src={fight.fighter_a.avatar_url} 
                              alt={`${fight.fighter_a.first_name} ${fight.fighter_a.last_name}`}
                              className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-border"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full mx-auto bg-muted flex items-center justify-center border-2 border-border">
                              <span className="text-xl font-bold text-muted-foreground">
                                {fight.fighter_a?.first_name?.[0]}{fight.fighter_a?.last_name?.[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-bold text-lg">
                          {fight.fighter_a?.first_name} {fight.fighter_a?.last_name}
                        </h3>
                        
                        {fight.fighter_a?.nickname && (
                          <p className="text-sm text-muted-foreground mb-2">
                            "{fight.fighter_a.nickname}"
                          </p>
                        )}
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-center items-center gap-2">
                            <span className="text-green-500 font-semibold">
                              {fight.fighter_a?.record_wins || 0}W
                            </span>
                            <span className="text-destructive font-semibold">
                              {fight.fighter_a?.record_losses || 0}L
                            </span>
                            {(fight.fighter_a?.record_draws || 0) > 0 && (
                              <span className="text-muted-foreground font-semibold">
                                {fight.fighter_a.record_draws}D
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* VS */}
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">VS</div>
                        {fight.status !== 'scheduled' && (
                          <Badge variant="outline" className="mt-2">
                            {fight.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      {/* Fighter B */}
                      <div className="text-center">
                        <div className="mb-3">
                          {fight.fighter_b?.avatar_url ? (
                            <img 
                              src={fight.fighter_b.avatar_url} 
                              alt={`${fight.fighter_b.first_name} ${fight.fighter_b.last_name}`}
                              className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-border"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full mx-auto bg-muted flex items-center justify-center border-2 border-border">
                              <span className="text-xl font-bold text-muted-foreground">
                                {fight.fighter_b?.first_name?.[0]}{fight.fighter_b?.last_name?.[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-bold text-lg">
                          {fight.fighter_b?.first_name} {fight.fighter_b?.last_name}
                        </h3>
                        
                        {fight.fighter_b?.nickname && (
                          <p className="text-sm text-muted-foreground mb-2">
                            "{fight.fighter_b.nickname}"
                          </p>
                        )}
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-center items-center gap-2">
                            <span className="text-green-500 font-semibold">
                              {fight.fighter_b?.record_wins || 0}W
                            </span>
                            <span className="text-destructive font-semibold">
                              {fight.fighter_b?.record_losses || 0}L
                            </span>
                            {(fight.fighter_b?.record_draws || 0) > 0 && (
                              <span className="text-muted-foreground font-semibold">
                                {fight.fighter_b.record_draws}D
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {fight.winner_id && (
                      <div className="mt-6 pt-6 border-t border-border/50">
                        <div className="text-center">
                          <Badge className="bg-green-600 text-white">
                            Ganador: {fight.winner_id === fight.fighter_a_id 
                              ? `${fight.fighter_a?.first_name} ${fight.fighter_a?.last_name}`
                              : `${fight.fighter_b?.first_name} ${fight.fighter_b?.last_name}`
                            }
                          </Badge>
                          {fight.finish_method && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Por {fight.finish_method}
                              {fight.finish_round && ` - Ronda ${fight.finish_round}`}
                              {fight.finish_time && ` (${fight.finish_time})`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventDetail;