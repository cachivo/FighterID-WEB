import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Trophy, Clock, Weight, Home, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useEvents, useFights } from '@/hooks/useEvents';
import { FighterMiniature } from '@/components/FighterMiniature';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
        <Header />
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-20">
          <div className="animate-pulse space-y-4 sm:space-y-6">
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Evento no encontrado</h2>
            <p className="text-muted-foreground mb-4">El evento que buscas no existe o ha sido eliminado.</p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Inicio
                </Link>
              </Button>
              <Button asChild>
                <Link to="/eventos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Eventos
            </Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Header */}
      <section className="border-b border-border/50 pt-16">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex gap-2 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/eventos">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Eventos
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
                <Card key={fight.id} className="border-border/50 hover:border-primary/50 transition-colors overflow-visible">
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
                    <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-end">
                      {/* Fighter A */}
                      <div className="flex flex-col items-center">
                        {/* Image Container with 3D effect */}
                        <div className="relative h-48 md:h-64 w-full flex items-end justify-center mb-4 overflow-visible">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="cursor-pointer absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
                                {(fight.fighter_a_event_image_url || fight.fighter_a?.avatar_url || fight.fighter_a_external?.image_url) ? (
                                  <img 
                                    src={fight.fighter_a_event_image_url || fight.fighter_a?.avatar_url || fight.fighter_a_external?.image_url} 
                                    alt={fight.fighter_a ? `${fight.fighter_a.first_name} ${fight.fighter_a.last_name}` : fight.fighter_a_external?.name}
                                    className="max-h-52 md:max-h-64 w-auto max-w-[180px] md:max-w-[260px] object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
                                    style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
                                  />
                                ) : (
                                  <div className="h-56 md:h-72 w-48 bg-muted/50 rounded-lg flex items-center justify-center border-2 border-border drop-shadow-2xl">
                                    <span className="text-6xl font-bold text-muted-foreground">
                                      {fight.fighter_a ? `${fight.fighter_a.first_name?.[0]}${fight.fighter_a.last_name?.[0]}` : fight.fighter_a_external?.name?.[0]}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              {fight.fighter_a ? (
                                <FighterMiniature fighter={fight.fighter_a} />
                              ) : fight.fighter_a_external && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold">{fight.fighter_a_external.name}</h4>
                                  {fight.fighter_a_external.nickname && (
                                    <p className="text-sm text-muted-foreground">"{fight.fighter_a_external.nickname}"</p>
                                  )}
                                  {fight.fighter_a_external.gym && (
                                    <p className="text-xs text-muted-foreground">{fight.fighter_a_external.gym}</p>
                                  )}
                                  <Badge variant="secondary">Peleador Invitado</Badge>
                                </div>
                              )}
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        
                        {/* Info Bar - Oval */}
                        <div className="w-full max-w-xs rounded-full bg-background/90 backdrop-blur-md border border-border/50 shadow-lg px-6 py-3 text-center space-y-1">
                          <h3 className="font-bold text-base md:text-lg truncate">
                            {fight.fighter_a ? `${fight.fighter_a.first_name} ${fight.fighter_a.last_name}` : fight.fighter_a_external?.name}
                          </h3>
                          
                          {(fight.fighter_a?.nickname || fight.fighter_a_external?.nickname) && (
                            <p className="text-xs text-muted-foreground truncate">
                              "{fight.fighter_a?.nickname || fight.fighter_a_external?.nickname}"
                            </p>
                          )}
                          
                          <div className="flex items-center justify-center gap-2 pt-1">
                            {fight.fighter_a ? (
                              <Badge className="bg-green-600/20 text-green-600 border-green-600/30 text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Verificado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Invitado
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex justify-center items-center gap-2 text-sm pt-1">
                            <span className="text-green-500 font-semibold">
                              {fight.fighter_a?.record_wins || fight.fighter_a_external?.record?.wins || 0}W
                            </span>
                            <span className="text-destructive font-semibold">
                              {fight.fighter_a?.record_losses || fight.fighter_a_external?.record?.losses || 0}L
                            </span>
                            {((fight.fighter_a?.record_draws || fight.fighter_a_external?.record?.draws || 0) > 0) && (
                              <span className="text-muted-foreground font-semibold">
                                {fight.fighter_a?.record_draws || fight.fighter_a_external?.record?.draws}D
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="flex flex-col items-center justify-center px-4 md:px-8">
                        <div className="text-3xl md:text-4xl font-bold text-primary">VS</div>
                        {fight.status !== 'scheduled' && (
                          <Badge variant="outline" className="mt-2">
                            {fight.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      {/* Fighter B */}
                      <div className="flex flex-col items-center">
                        {/* Image Container with 3D effect */}
                        <div className="relative h-48 md:h-64 w-full flex items-end justify-center mb-4 overflow-visible">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="cursor-pointer absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
                                {(fight.fighter_b_event_image_url || fight.fighter_b?.avatar_url || fight.fighter_b_external?.image_url) ? (
                                  <img 
                                    src={fight.fighter_b_event_image_url || fight.fighter_b?.avatar_url || fight.fighter_b_external?.image_url} 
                                    alt={fight.fighter_b ? `${fight.fighter_b.first_name} ${fight.fighter_b.last_name}` : fight.fighter_b_external?.name}
                                    className="max-h-52 md:max-h-64 w-auto max-w-[180px] md:max-w-[260px] object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
                                    style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
                                  />
                                ) : (
                                  <div className="h-56 md:h-72 w-48 bg-muted/50 rounded-lg flex items-center justify-center border-2 border-border drop-shadow-2xl">
                                    <span className="text-6xl font-bold text-muted-foreground">
                                      {fight.fighter_b ? `${fight.fighter_b.first_name?.[0]}${fight.fighter_b.last_name?.[0]}` : fight.fighter_b_external?.name?.[0]}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              {fight.fighter_b ? (
                                <FighterMiniature fighter={fight.fighter_b} />
                              ) : fight.fighter_b_external && (
                                <div className="space-y-2">
                                  <h4 className="font-semibold">{fight.fighter_b_external.name}</h4>
                                  {fight.fighter_b_external.nickname && (
                                    <p className="text-sm text-muted-foreground">"{fight.fighter_b_external.nickname}"</p>
                                  )}
                                  {fight.fighter_b_external.gym && (
                                    <p className="text-xs text-muted-foreground">{fight.fighter_b_external.gym}</p>
                                  )}
                                  <Badge variant="secondary">Peleador Invitado</Badge>
                                </div>
                              )}
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        
                        {/* Info Bar - Oval */}
                        <div className="w-full max-w-xs rounded-full bg-background/90 backdrop-blur-md border border-border/50 shadow-lg px-6 py-3 text-center space-y-1">
                          <h3 className="font-bold text-base md:text-lg truncate">
                            {fight.fighter_b ? `${fight.fighter_b.first_name} ${fight.fighter_b.last_name}` : fight.fighter_b_external?.name}
                          </h3>
                          
                          {(fight.fighter_b?.nickname || fight.fighter_b_external?.nickname) && (
                            <p className="text-xs text-muted-foreground truncate">
                              "{fight.fighter_b?.nickname || fight.fighter_b_external?.nickname}"
                            </p>
                          )}
                          
                          <div className="flex items-center justify-center gap-2 pt-1">
                            {fight.fighter_b ? (
                              <Badge className="bg-green-600/20 text-green-600 border-green-600/30 text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Verificado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Invitado
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex justify-center items-center gap-2 text-sm pt-1">
                            <span className="text-green-500 font-semibold">
                              {fight.fighter_b?.record_wins || fight.fighter_b_external?.record?.wins || 0}W
                            </span>
                            <span className="text-destructive font-semibold">
                              {fight.fighter_b?.record_losses || fight.fighter_b_external?.record?.losses || 0}L
                            </span>
                            {((fight.fighter_b?.record_draws || fight.fighter_b_external?.record?.draws || 0) > 0) && (
                              <span className="text-muted-foreground font-semibold">
                                {fight.fighter_b?.record_draws || fight.fighter_b_external?.record?.draws}D
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Winner & Finish */}
                    {fight.winner_id && (
                      <div className="mt-8 pt-6 border-t border-border/50">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Ganador</p>
                            <p className="font-bold text-lg">
                              {fight.winner_id === (fight.fighter_a_id || fight.fighter_a_external_id) 
                                ? (fight.fighter_a ? `${fight.fighter_a.first_name} ${fight.fighter_a.last_name}` : fight.fighter_a_external?.name)
                                : (fight.fighter_b ? `${fight.fighter_b.first_name} ${fight.fighter_b.last_name}` : fight.fighter_b_external?.name)
                              }
                            </p>
                          </div>
                          
                          {fight.finish_method && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Método</p>
                              <Badge variant="outline" className="text-sm">
                                {fight.finish_method}
                                {fight.finish_round && ` - Round ${fight.finish_round}`}
                                {fight.finish_time && ` (${fight.finish_time})`}
                              </Badge>
                            </div>
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
      <Footer />
    </div>
  );
};

export default EventDetail;