import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUuidParam } from '@/hooks/useUuidParam';
import { Calendar, MapPin, ArrowLeft, Trophy, Clock, Weight, Home, Shield, Tv } from 'lucide-react';
import VisionEngineIndicator from '@/components/VisionEngineIndicator';
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

// Helper function to get country ISO code
const getCountryCode = (countryCode: string): string => {
  if (!countryCode) return '';

  // Map of country names/codes to ISO codes
  const countryMap: Record<string, string> = {
    'Honduras': 'HN',
    'HN': 'HN',
    'hn': 'HN',
    'Nicaragua': 'NI',
    'NI': 'NI',
    'ni': 'NI',
    'El Salvador': 'SV',
    'SV': 'SV',
    'sv': 'SV',
    'Guatemala': 'GT',
    'GT': 'GT',
    'gt': 'GT',
    'Costa Rica': 'CR',
    'CR': 'CR',
    'cr': 'CR',
    'Panama': 'PA',
    'Panamá': 'PA',
    'PA': 'PA',
    'pa': 'PA',
    'Mexico': 'MX',
    'México': 'MX',
    'MX': 'MX',
    'mx': 'MX',
    'USA': 'US',
    'US': 'US',
    'us': 'US',
    'United States': 'US'
  };

  // Get ISO code
  const isoCode = countryMap[countryCode] || countryCode.toUpperCase();

  // Return 2-letter code
  return isoCode.length === 2 ? isoCode : '';
};
// Helper to get branding from event meta
interface EventBranding {
  key: 'ucc' | 'hoodfights' | 'custom';
  logo_url?: string;
  watermark_url?: string;
  require_billboard_images?: boolean;
}

const getEventBranding = (event: any): EventBranding => {
  const meta = event?.meta as { branding?: EventBranding } | null;
  if (meta?.branding) {
    return meta.branding;
  }
  // Default to UCC
  return {
    key: 'ucc',
    logo_url: '/lovable-uploads/ucc-logo-transparent.png',
    watermark_url: '/lovable-uploads/ucc-logo-transparent.png',
    require_billboard_images: false
  };
};

const EventDetail = () => {
  const { value: eventId, redirect } = useUuidParam('eventId');
  if (redirect) return redirect;
  const {
    events,
    loading: eventsLoading
  } = useEvents();
  const {
    fights,
    loading: fightsLoading,
    error: fightsError
  } = useFights(eventId);
  type EventItem = (typeof events)[number];
  const [event, setEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    if (eventId && events.length > 0) {
      const foundEvent = events.find(e => e.id === eventId);
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
    return <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-20">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-10 bg-muted rounded"></div>
              <div className="w-48 h-8 bg-muted rounded"></div>
            </div>
            <div className="w-full h-32 bg-muted rounded"></div>
            <div className="grid gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="w-full h-24 bg-muted rounded"></div>)}
            </div>
          </div>
        </div>
      </div>;
  }
  if (!event) {
    return <div className="min-h-screen bg-background">
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
      </div>;
  }
  return <div className="min-h-screen bg-black relative">
      {/* Dark spatial background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Deep space effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black"></div>
        
        {/* Nebula effects */}
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-red-950/8 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-red-900/6 rounded-full blur-[150px] animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-red-950/5 rounded-full blur-[150px] animate-pulse" style={{
        animationDelay: '4s'
      }}></div>
        
        {/* Subtle stars effect */}
        <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,0.8), transparent), radial-gradient(1.5px 1.5px at 60% 70%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 80% 10%, rgba(255,255,255,0.7), transparent), radial-gradient(1.5px 1.5px at 90% 60%, rgba(255,255,255,0.5), transparent)',
        backgroundSize: '200px 200px, 300px 300px, 250px 250px, 280px 280px, 220px 220px',
        backgroundPosition: '0 0, 40px 60px, 130px 270px, 70px 100px, 150px 50px'
      }}></div>
        
        {/* Subtle vignette for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>
      
      <div className="relative z-10">
        <Header /></div>
        {/* Header */}
        <section className="border-b border-white/5 pt-16 bg-black/40 backdrop-blur-sm">
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
              
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg">
                {event.name}
              </h1>
              
              {event.description && <p className="text-lg text-gray-200 mb-4">
                  {event.description}
                </p>}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                {event.venue && <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.venue}</span>
                  </div>}
                
                {event.start_time && <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(event.start_time), 'PPP', {
                    locale: es
                  })}
                    </span>
                  </div>}
              </div>
            </div>
            
            {event.state === 'live' && (() => {
              const meta = event.meta as { live_stream?: { is_streaming?: boolean } } | null;
              const isStreaming = meta?.live_stream?.is_streaming;
              return isStreaming ? (
                <Button asChild size="lg" className="bg-destructive hover:bg-destructive/90 animate-pulse">
                  <Link to="/en-vivo">
                    <Tv className="w-5 h-5 mr-2" />
                    📺 Ver En Vivo
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="animate-pulse">
                  <Trophy className="w-5 h-5 mr-2" />
                  EN VIVO
                </Button>
              );
            })()}
          </div>
        </div>
        </section>

        {/* Fight Card */}
        <section className="relative py-12 overflow-hidden">
          {/* Subtle Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-red-950/5 to-black/50"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(206,16,16,0.03),transparent_70%)]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Dynamic Event Logo Header */}
          {(() => {
            const branding = getEventBranding(event);
            return (
              <div className="flex flex-col items-center mb-12">
                <img 
                  src={branding.logo_url || '/lovable-uploads/ucc-logo-transparent.png'} 
                  alt={`${branding.key?.toUpperCase() || 'Event'} Logo`} 
                  className="w-48 md:w-64 mb-6 animate-fade-in opacity-90" 
                />
                <div className="text-center space-y-2">
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-2xl animate-fade-in">
                    FIGHT CARD
                  </h2>
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                    <p className="text-lg text-gray-200 font-semibold">
                      {fights.length} COMBATES PROGRAMADOS
                    </p>
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                  </div>
                </div>
              </div>
            );
          })()}

          {fights.length === 0 ? <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">No hay peleas programadas</h3>
                <p className="text-gray-300">Las peleas se añadirán próximamente.</p>
              </CardContent>
            </Card> : <div className="space-y-8">
              {fights.map((fight, index) => <div key={fight.id} className="relative group animate-fade-in" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                  {/* Fight Card Container */}
                  <Card className="relative border-2 border-primary/20 bg-gradient-to-br from-gray-950/80 to-black/70 backdrop-blur-md hover:border-primary/40 transition-all duration-300 overflow-visible shadow-xl hover:shadow-2xl hover:shadow-primary/20">
                    {/* Glow Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Dynamic Watermark in Card */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                      <img src={getEventBranding(event).watermark_url || '/lovable-uploads/ucc-logo-transparent.png'} alt="Watermark" className="w-64 h-64 object-contain" />
                    </div>
                    
                    <CardHeader className="relative p-3 sm:p-4 md:pb-4 border-b border-primary/10">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Badge variant="outline" className="text-xl sm:text-2xl font-black px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-primary/30 bg-primary/10 text-white">
                            #{fight.fight_number}
                          </Badge>
                          {fight.card_position === 'main_event' && <Badge className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white border-0 shadow-lg shadow-yellow-500/50 animate-pulse flex items-center gap-1">
                              PELEA ESTELAR
                            </Badge>}
                          {fight.card_position === 'co_main_event' && <Badge className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/50 flex items-center gap-1">
                              CO-ESTELAR
                            </Badge>}
                          <Badge className={`${getFightTypeColor(fight.fight_type)} px-3 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm`}>
                            {fight.fight_type}
                          </Badge>
                          <Badge variant="secondary" className="px-3 sm:px-4 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm">
                            <Weight className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            {fight.weight_class}
                          </Badge>
                          <VisionEngineIndicator fightId={fight.id} />
                        </div>
                        
                        {fight.scheduled_time && <div className="flex items-center gap-2 text-sm text-gray-200 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                            <Clock className="w-4 h-4" />
                            <span className="font-semibold">
                              {format(new Date(fight.scheduled_time), 'HH:mm')}
                            </span>
                          </div>}
                      </div>
                    </CardHeader>
                  
                    <CardContent className="relative pt-6 sm:pt-8 pb-4 sm:pb-6 p-3 sm:p-4 md:p-6">
                      <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 md:gap-12">
                        {/* Mobile Layout - Horizontal */}
                        <div className="flex md:hidden justify-between items-center gap-2 relative">
                          {/* Fighter A - Mobile */}
                          <div className="flex-1 flex flex-col items-center">
                            <Badge className="bg-red-600/90 text-white font-bold px-2.5 py-0.5 text-xs mb-2">
                              ROJA
                            </Badge>
                            <div className="relative w-full max-w-[120px] h-[140px] flex items-end justify-center">
                              {/* Country Code Background */}
                              {(fight.fighter_a?.country || fight.fighter_a_external?.country) && <div className="absolute inset-0 flex items-center justify-center opacity-15 select-none pointer-events-none">
                                  <span className="text-[3.5rem] sm:text-[4rem] font-black text-white">
                                    {getCountryCode(fight.fighter_a?.country || fight.fighter_a_external?.country)}
                                  </span>
                                </div>}
                              {fight.fighter_a_event_image_url || fight.fighter_a?.avatar_url || fight.fighter_a_external?.image_url ? <img src={`${fight.fighter_a_event_image_url || fight.fighter_a?.avatar_url || fight.fighter_a_external?.image_url}?t=${new Date(fight.updated_at).getTime()}`} alt={fight.fighter_a ? `${fight.fighter_a.first_name} ${fight.fighter_a.last_name}` : fight.fighter_a_external?.name} className="relative h-full w-auto object-contain" style={{
                          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                        }} /> : <div className="h-full w-full bg-gradient-to-br from-red-500/20 to-black/50 rounded-lg flex items-center justify-center border border-red-500/30">
                                  <span className="text-4xl font-bold text-white">
                                    {fight.fighter_a ? `${fight.fighter_a.first_name?.[0]}${fight.fighter_a.last_name?.[0]}` : fight.fighter_a_external?.name?.[0]}
                                  </span>
                                </div>}
                            </div>
                            <div className="mt-2 text-center max-w-[140px]">
                              <p className="text-xs font-bold text-white truncate">
                                {fight.fighter_a ? `${fight.fighter_a.first_name} ${fight.fighter_a.last_name}` : fight.fighter_a_external?.name}
                              </p>
                              <div className="flex justify-center gap-2 text-[10px] font-semibold mt-1">
                                <span className="text-green-400">{fight.fighter_a?.record_wins || fight.fighter_a_external?.record?.wins || 0}V</span>
                                <span className="text-red-400">{fight.fighter_a?.record_losses || fight.fighter_a_external?.record?.losses || 0}D</span>
                              </div>
                            </div>
                          </div>

                          {/* VS - Mobile */}
                          <div className="flex flex-col items-center px-2">
                            <img src={getEventBranding(event).watermark_url || '/lovable-uploads/ucc-logo-transparent.png'} alt="VS" className="w-10 h-10 opacity-70" />
                            <div className="text-2xl font-black bg-gradient-to-r from-red-500 via-primary to-blue-500 bg-clip-text text-transparent">
                              VS
                            </div>
                          </div>

                          {/* Fighter B - Mobile */}
                          <div className="flex-1 flex flex-col items-center">
                            <Badge className="bg-blue-600/90 text-white font-bold px-2.5 py-0.5 text-xs mb-2">
                              AZUL
                            </Badge>
                            <div className="relative w-full max-w-[120px] h-[140px] flex items-end justify-center">
                              {/* Country Code Background */}
                              {(fight.fighter_b?.country || fight.fighter_b_external?.country) && <div className="absolute inset-0 flex items-center justify-center opacity-15 select-none pointer-events-none">
                                  <span className="text-[3.5rem] sm:text-[4rem] font-black text-white">
                                    {getCountryCode(fight.fighter_b?.country || fight.fighter_b_external?.country)}
                                  </span>
                                </div>}
                              {fight.fighter_b_event_image_url || fight.fighter_b?.avatar_url || fight.fighter_b_external?.image_url ? <img src={`${fight.fighter_b_event_image_url || fight.fighter_b?.avatar_url || fight.fighter_b_external?.image_url}?t=${new Date(fight.updated_at).getTime()}`} alt={fight.fighter_b ? `${fight.fighter_b.first_name} ${fight.fighter_b.last_name}` : fight.fighter_b_external?.name} className="relative h-full w-auto object-contain" style={{
                          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                        }} /> : <div className="h-full w-full bg-gradient-to-br from-blue-500/20 to-black/50 rounded-lg flex items-center justify-center border border-blue-500/30">
                                  <span className="text-4xl font-bold text-white">
                                    {fight.fighter_b ? `${fight.fighter_b.first_name?.[0]}${fight.fighter_b.last_name?.[0]}` : fight.fighter_b_external?.name?.[0]}
                                  </span>
                                </div>}
                            </div>
                            <div className="mt-2 text-center max-w-[140px]">
                              <p className="text-xs font-bold text-white truncate">
                                {fight.fighter_b ? `${fight.fighter_b.first_name} ${fight.fighter_b.last_name}` : fight.fighter_b_external?.name}
                              </p>
                              <div className="flex justify-center gap-2 text-[10px] font-semibold mt-1">
                                <span className="text-green-400">{fight.fighter_b?.record_wins || fight.fighter_b_external?.record?.wins || 0}V</span>
                                <span className="text-red-400">{fight.fighter_b?.record_losses || fight.fighter_b_external?.record?.losses || 0}D</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        {/* Fighter A */}
                        <div className="hidden md:flex flex-col items-center group/fighter">
                          {/* Corner Label */}
                          <div className="mb-2">
                            <Badge className="bg-red-600/90 text-white font-bold px-6 py-1 text-sm shadow-lg">
                              ESQUINA ROJA
                            </Badge>
                          </div>
                          
                          {/* Image Container with enhanced 3D effect */}
                          <div className="relative h-64 md:h-80 w-full flex items-end justify-center mb-6 overflow-visible">
                            {/* Dramatic lighting effect */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-2/3 bg-gradient-to-t from-red-500/20 via-transparent to-transparent blur-2xl"></div>
                            
                            {/* Country Code Background */}
                            {(fight.fighter_a?.country || fight.fighter_a_external?.country) && <div className="absolute inset-0 flex items-center justify-center opacity-20 select-none pointer-events-none z-0">
                                <span className="text-[12rem] md:text-[18rem] font-black text-white leading-none filter drop-shadow-2xl">
                                  {getCountryCode(fight.fighter_a?.country || fight.fighter_a_external?.country)}
                                </span>
                              </div>}
                            
                            {/* Stage/Platform Effect */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-8 bg-gradient-to-t from-border/30 to-transparent rounded-full blur-xl"></div>
                            
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="cursor-pointer absolute bottom-0 left-1/2 -translate-x-1/2 z-20 transition-transform duration-500 hover:scale-110 group-hover/fighter:brightness-110">
                                  {fight.fighter_a_event_image_url || fight.fighter_a?.avatar_url || fight.fighter_a_external?.image_url ? <div className="relative">
                                      {/* Red corner glow */}
                                      <div className="absolute -inset-4 bg-red-500/20 blur-2xl rounded-full animate-pulse"></div>
                                       <img src={`${fight.fighter_a_event_image_url || fight.fighter_a?.avatar_url || fight.fighter_a_external?.image_url}?t=${new Date(fight.updated_at).getTime()}`} alt={fight.fighter_a ? `${fight.fighter_a.first_name} ${fight.fighter_a.last_name}` : fight.fighter_a_external?.name} className="relative max-h-64 md:max-h-80 w-auto max-w-[220px] md:max-w-[320px] object-contain" style={{
                                filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5)) drop-shadow(0 0 30px rgba(239,68,68,0.3))'
                              }} />
                                    </div> : <div className="h-64 md:h-80 w-56 bg-gradient-to-br from-red-500/20 to-black/50 rounded-lg flex items-center justify-center border-2 border-red-500/30 shadow-2xl backdrop-blur-sm">
                                       <span className="text-7xl font-bold text-white drop-shadow-lg">
                                         {fight.fighter_a ? `${fight.fighter_a.first_name?.[0]}${fight.fighter_a.last_name?.[0]}` : fight.fighter_a_external?.name?.[0]}
                                       </span>
                                     </div>}
                                </div>
                              </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              {fight.fighter_a ? <FighterMiniature fighter={fight.fighter_a} /> : fight.fighter_a_external && <div className="space-y-2">
                                  <h4 className="font-semibold">{fight.fighter_a_external.name}</h4>
                                  {fight.fighter_a_external.nickname && <p className="text-sm text-muted-foreground">"{fight.fighter_a_external.nickname}"</p>}
                                  {fight.fighter_a_external.gym && <p className="text-xs text-muted-foreground">{fight.fighter_a_external.gym}</p>}
                                  <Badge variant="secondary">Peleador Invitado</Badge>
                                </div>}
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        
                          {/* Enhanced Info Bar */}
                          <div className="w-full max-w-sm">
                            <div className="relative bg-gradient-to-br from-gray-950/70 via-gray-900/60 to-gray-950/70 backdrop-blur-xl border-2 border-red-500/30 rounded-2xl shadow-2xl px-6 py-4 text-center space-y-2 group-hover/fighter:border-red-500/50 transition-colors">
                              {/* Corner accent */}
                              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500 rounded-tl-2xl"></div>
                              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500 rounded-br-2xl"></div>
                              
                              <h3 className="font-black text-lg md:text-xl truncate tracking-wide text-white drop-shadow-lg">
                                {fight.fighter_a ? `${fight.fighter_a.first_name} ${fight.fighter_a.last_name}` : fight.fighter_a_external?.name}
                              </h3>
                              
                              {(fight.fighter_a?.nickname || fight.fighter_a_external?.nickname) && <p className="text-sm font-semibold text-gray-300 truncate italic">
                                  "{fight.fighter_a?.nickname || fight.fighter_a_external?.nickname}"
                                </p>}
                              
                              <div className="flex items-center justify-center gap-2 pt-2">
                                {fight.fighter_a ? <Badge className="bg-green-600/20 text-green-400 border-green-600/40 font-bold px-3 py-1">
                                    <Shield className="w-3 h-3 mr-1" />
                                    VERIFICADO
                                  </Badge> : <Badge variant="outline" className="font-bold px-3 py-1 text-white border-white/30">
                                    INVITADO
                                  </Badge>}
                              </div>
                              
                              <div className="flex justify-center items-center gap-3 text-base font-bold pt-2 border-t border-white/10">
                                <span className="text-green-400 flex items-center gap-1">
                                  <span className="text-xs">V:</span>
                                  {fight.fighter_a?.record_wins || fight.fighter_a_external?.record?.wins || 0}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="text-red-400 flex items-center gap-1">
                                  <span className="text-xs">D:</span>
                                  {fight.fighter_a?.record_losses || fight.fighter_a_external?.record?.losses || 0}
                                </span>
                                {(fight.fighter_a?.record_draws || fight.fighter_a_external?.record?.draws || 0) > 0 && <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-yellow-400 flex items-center gap-1">
                                      <span className="text-xs">E:</span>
                                      {fight.fighter_a?.record_draws || fight.fighter_a_external?.record?.draws}
                                    </span>
                                  </>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced VS Divider - Desktop Only */}
                        <div className="hidden md:flex flex-col items-center justify-center px-6 md:px-12 my-8 md:my-0">
                          <div className="relative">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full"></div>
                            
                            {/* UCC Logo in VS */}
                            <div className="relative flex flex-col items-center gap-4">
                              <img alt="VS" className="w-16 h-16 md:w-24 md:h-24 opacity-80 animate-pulse" src="/lovable-uploads/8d2ed2c0-f2be-4577-9514-8e96c6c99034.png" />
                              <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-red-500 via-primary to-blue-500 bg-clip-text text-transparent tracking-wider drop-shadow-2xl">
                                VS
                              </div>
                            </div>
                            
                            {/* Lightning bolts */}
                            <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-4xl opacity-50 animate-pulse text-yellow-400">|</div>
                            <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-4xl opacity-50 animate-pulse text-yellow-400" style={{
                        animationDelay: '0.5s'
                      }}>|</div>
                          </div>
                          
                          {fight.status !== 'scheduled' && <Badge variant="outline" className="mt-4 font-bold px-4 py-2">
                              {fight.status.toUpperCase()}
                            </Badge>}
                        </div>

                        {/* Fighter B - Desktop Only */}
                        <div className="hidden md:flex flex-col items-center group/fighter">
                          {/* Corner Label */}
                          <div className="mb-2">
                            <Badge className="bg-blue-600/90 text-white font-bold px-6 py-1 text-sm shadow-lg">
                              ESQUINA AZUL
                            </Badge>
                          </div>
                          
                          {/* Image Container with enhanced 3D effect */}
                          <div className="relative h-64 md:h-80 w-full flex items-end justify-center mb-6 overflow-visible">
                            {/* Dramatic lighting effect */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-2/3 bg-gradient-to-t from-blue-500/20 via-transparent to-transparent blur-2xl"></div>
                            
                            {/* Country Code Background */}
                            {(fight.fighter_b?.country || fight.fighter_b_external?.country) && <div className="absolute inset-0 flex items-center justify-center opacity-20 select-none pointer-events-none z-0">
                                <span className="text-[12rem] md:text-[18rem] font-black text-white leading-none filter drop-shadow-2xl">
                                  {getCountryCode(fight.fighter_b?.country || fight.fighter_b_external?.country)}
                                </span>
                              </div>}
                            
                            {/* Stage/Platform Effect */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-8 bg-gradient-to-t from-border/30 to-transparent rounded-full blur-xl"></div>
                            
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="cursor-pointer absolute bottom-0 left-1/2 -translate-x-1/2 z-20 transition-transform duration-500 hover:scale-110 group-hover/fighter:brightness-110">
                                  {fight.fighter_b_event_image_url || fight.fighter_b?.avatar_url || fight.fighter_b_external?.image_url ? <div className="relative">
                                      {/* Blue corner glow */}
                                      <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
                                       <img src={`${fight.fighter_b_event_image_url || fight.fighter_b?.avatar_url || fight.fighter_b_external?.image_url}?t=${new Date(fight.updated_at).getTime()}`} alt={fight.fighter_b ? `${fight.fighter_b.first_name} ${fight.fighter_b.last_name}` : fight.fighter_b_external?.name} className="relative max-h-64 md:max-h-80 w-auto max-w-[220px] md:max-w-[320px] object-contain" style={{
                                filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5)) drop-shadow(0 0 30px rgba(59,130,246,0.3))'
                              }} />
                                    </div> : <div className="h-64 md:h-80 w-56 bg-gradient-to-br from-blue-500/20 to-black/50 rounded-lg flex items-center justify-center border-2 border-blue-500/30 shadow-2xl backdrop-blur-sm">
                                       <span className="text-7xl font-bold text-white drop-shadow-lg">
                                         {fight.fighter_b ? `${fight.fighter_b.first_name?.[0]}${fight.fighter_b.last_name?.[0]}` : fight.fighter_b_external?.name?.[0]}
                                       </span>
                                     </div>}
                                </div>
                              </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              {fight.fighter_b ? <FighterMiniature fighter={fight.fighter_b} /> : fight.fighter_b_external && <div className="space-y-2">
                                  <h4 className="font-semibold">{fight.fighter_b_external.name}</h4>
                                  {fight.fighter_b_external.nickname && <p className="text-sm text-muted-foreground">"{fight.fighter_b_external.nickname}"</p>}
                                  {fight.fighter_b_external.gym && <p className="text-xs text-muted-foreground">{fight.fighter_b_external.gym}</p>}
                                  <Badge variant="secondary">Peleador Invitado</Badge>
                                </div>}
                            </HoverCardContent>
                            </HoverCard>
                          </div>
                          
                          {/* Enhanced Info Bar */}
                          <div className="w-full max-w-sm">
                            <div className="relative bg-gradient-to-br from-gray-950/70 via-gray-900/60 to-gray-950/70 backdrop-blur-xl border-2 border-blue-500/30 rounded-2xl shadow-2xl px-6 py-4 text-center space-y-2 group-hover/fighter:border-blue-500/50 transition-colors">
                              {/* Corner accent */}
                              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500 rounded-tr-2xl"></div>
                              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500 rounded-bl-2xl"></div>
                              
                              <h3 className="font-black text-lg md:text-xl truncate tracking-wide text-white drop-shadow-lg">
                                {fight.fighter_b ? `${fight.fighter_b.first_name} ${fight.fighter_b.last_name}` : fight.fighter_b_external?.name}
                              </h3>
                              
                              {(fight.fighter_b?.nickname || fight.fighter_b_external?.nickname) && <p className="text-sm font-semibold text-gray-300 truncate italic">
                                  "{fight.fighter_b?.nickname || fight.fighter_b_external?.nickname}"
                                </p>}
                              
                              <div className="flex items-center justify-center gap-2 pt-2">
                                {fight.fighter_b ? <Badge className="bg-green-600/20 text-green-400 border-green-600/40 font-bold px-3 py-1">
                                    <Shield className="w-3 h-3 mr-1" />
                                    VERIFICADO
                                  </Badge> : <Badge variant="outline" className="font-bold px-3 py-1 text-white border-white/30">
                                    INVITADO
                                  </Badge>}
                              </div>
                              
                              <div className="flex justify-center items-center gap-3 text-base font-bold pt-2 border-t border-white/10">
                                <span className="text-green-400 flex items-center gap-1">
                                  <span className="text-xs">V:</span>
                                  {fight.fighter_b?.record_wins || fight.fighter_b_external?.record?.wins || 0}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="text-red-400 flex items-center gap-1">
                                  <span className="text-xs">D:</span>
                                  {fight.fighter_b?.record_losses || fight.fighter_b_external?.record?.losses || 0}
                                </span>
                                {(fight.fighter_b?.record_draws || fight.fighter_b_external?.record?.draws || 0) > 0 && <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-yellow-400 flex items-center gap-1">
                                      <span className="text-xs">E:</span>
                                      {fight.fighter_b?.record_draws || fight.fighter_b_external?.record?.draws}
                                    </span>
                                  </>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    {/* Winner & Finish */}
                    {fight.winner_id && <div className="mt-8 pt-6 border-t border-white/10 bg-gradient-to-br from-gray-950/50 to-gray-900/40 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <p className="text-sm text-gray-300 mb-1">Ganador</p>
                            <p className="font-bold text-lg text-yellow-400 drop-shadow-lg">
                              {fight.winner_id === (fight.fighter_a_id || fight.fighter_a_external_id) ? fight.fighter_a ? `${fight.fighter_a.first_name} ${fight.fighter_a.last_name}` : fight.fighter_a_external?.name : fight.fighter_b ? `${fight.fighter_b.first_name} ${fight.fighter_b.last_name}` : fight.fighter_b_external?.name}
                            </p>
                          </div>
                          
                          {fight.finish_method && <div>
                              <p className="text-sm text-gray-300 mb-1">Método</p>
                              <Badge variant="outline" className="text-sm text-white border-white/30 bg-white/10">
                                {fight.finish_method}
                                {fight.finish_round && ` - Round ${fight.finish_round}`}
                                {fight.finish_time && ` (${fight.finish_time})`}
                              </Badge>
                            </div>}
                        </div>
                      </div>}
                  </CardContent>
                </Card>
                </div>)}
            </div>}
        </div>
      </section>
      <Footer />
    </div>;
};
export default EventDetail;