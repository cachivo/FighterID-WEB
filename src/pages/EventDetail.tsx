import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Trophy, Clock, Weight, Home, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEvents, useFights } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Helper function to get country ISO code
const getCountryCode = (countryCode: string): string => {
  if (!countryCode) return '';
  const countryMap: Record<string, string> = {
    'Honduras': 'HN', 'HN': 'HN', 'hn': 'HN',
    'Nicaragua': 'NI', 'NI': 'NI', 'ni': 'NI',
    'El Salvador': 'SV', 'SV': 'SV', 'sv': 'SV',
    'Guatemala': 'GT', 'GT': 'GT', 'gt': 'GT',
    'Costa Rica': 'CR', 'CR': 'CR', 'cr': 'CR',
    'Panama': 'PA', 'Panamá': 'PA', 'PA': 'PA', 'pa': 'PA',
    'Mexico': 'MX', 'México': 'MX', 'MX': 'MX', 'mx': 'MX',
    'USA': 'US', 'US': 'US', 'us': 'US', 'United States': 'US'
  };
  const isoCode = countryMap[countryCode] || countryCode.toUpperCase();
  return isoCode.length === 2 ? isoCode : '';
};

interface EventBranding {
  key: 'ucc' | 'hoodfights' | 'custom';
  logo_url?: string;
  watermark_url?: string;
  require_billboard_images?: boolean;
}

const getEventBranding = (event: any): EventBranding => {
  const meta = event?.meta as { branding?: EventBranding } | null;
  if (meta?.branding) return meta.branding;
  return {
    key: 'ucc',
    logo_url: '/lovable-uploads/ucc-logo-transparent.png',
    watermark_url: '/lovable-uploads/ucc-logo-transparent.png',
    require_billboard_images: false
  };
};

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { events, loading: eventsLoading } = useEvents();
  const { fights, loading: fightsLoading } = useFights(eventId);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    if (eventId && events.length > 0) {
      const foundEvent = events.find(e => e.id === eventId);
      setEvent(foundEvent || null);
    }
  }, [eventId, events]);

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'live': return 'bg-destructive text-destructive-foreground animate-pulse';
      case 'finished': return 'bg-muted-foreground text-background';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'draft': return 'Borrador';
      case 'live': return 'EN VIVO';
      case 'finished': return 'Finalizado';
      default: return state.toUpperCase();
    }
  };

  if (eventsLoading || fightsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6 pt-20">
          <div className="animate-pulse space-y-3">
            <div className="w-48 h-8 bg-muted rounded"></div>
            <div className="grid gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="w-full h-20 bg-muted rounded"></div>)}
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
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h2 className="text-xl font-bold mb-2">Evento no encontrado</h2>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline" size="sm">
                <Link to="/"><Home className="h-4 w-4 mr-1" />Inicio</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/eventos"><ArrowLeft className="w-4 h-4 mr-1" />Eventos</Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const branding = getEventBranding(event);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
      <Header />
      
      {/* Compact Header */}
      <section className="pt-16 pb-4 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
              <Link to="/eventos"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <Badge className={`${getStateColor(event.state)} text-xs`}>{getStateText(event.state)}</Badge>
            <Badge variant="outline" className="text-xs">{event.discipline.toUpperCase()}</Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <img src={branding.logo_url} alt="Logo" className="w-12 h-12 object-contain opacity-90" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-white truncate">{event.name}</h1>
              <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                {event.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>}
                {event.start_time && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(event.start_time), 'PPP', { locale: es })}</span>}
              </div>
            </div>
            <span className="text-sm text-gray-400 font-medium">{fights.length} peleas</span>
          </div>
        </div>
      </section>

      {/* Compact Fight List */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          {fights.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-gray-400">No hay peleas programadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fights.map((fight, index) => (
                <div 
                  key={fight.id} 
                  className="relative bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/80 border border-white/10 rounded-lg overflow-hidden hover:border-primary/30 transition-all"
                >
                  {/* Main Event Highlight */}
                  {fight.card_position === 'main_event' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5 pointer-events-none" />
                  )}
                  
                  <div className="relative p-3 md:p-4">
                    {/* Fight Header - Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-black text-white/80">#{fight.fight_number}</span>
                        {fight.card_position === 'main_event' && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-red-500 text-white text-[10px] px-2 py-0.5 font-bold">
                            ESTELAR
                          </Badge>
                        )}
                        {fight.card_position === 'co_main_event' && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] px-2 py-0.5 font-bold">
                            CO-ESTELAR
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                          <Weight className="w-3 h-3 mr-1" />{fight.weight_class}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          {fight.fight_type}
                        </Badge>
                      </div>
                      {fight.scheduled_time && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {format(new Date(fight.scheduled_time), 'HH:mm')}
                        </div>
                      )}
                    </div>

                    {/* Fighters Row - Compact */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Fighter A */}
                      <div className="flex-1 flex items-center gap-3">
                        <div className="relative w-16 h-20 md:w-20 md:h-24 flex-shrink-0">
                          {/* Country Code BG */}
                          {(fight.fighter_a?.country || fight.fighter_a_external?.country) && (
                            <span className="absolute inset-0 flex items-center justify-center text-3xl md:text-4xl font-black text-white/10 pointer-events-none">
                              {getCountryCode(fight.fighter_a?.country || fight.fighter_a_external?.country)}
                            </span>
                          )}
                          {fight.fighter_a_event_image_url || fight.fighter_a?.avatar_url || fight.fighter_a_external?.image_url ? (
                            <img 
                              src={`${fight.fighter_a_event_image_url || fight.fighter_a?.avatar_url || fight.fighter_a_external?.image_url}?t=${new Date(fight.updated_at).getTime()}`}
                              alt={fight.fighter_a ? `${fight.fighter_a.first_name} ${fight.fighter_a.last_name}` : fight.fighter_a_external?.name}
                              className="w-full h-full object-contain"
                              style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                            />
                          ) : (
                            <div className="w-full h-full bg-red-500/20 rounded flex items-center justify-center border border-red-500/30">
                              <span className="text-2xl font-bold text-white">
                                {fight.fighter_a ? `${fight.fighter_a.first_name?.[0]}${fight.fighter_a.last_name?.[0]}` : fight.fighter_a_external?.name?.[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Badge className="bg-red-600/80 text-white text-[9px] px-1.5 py-0 mb-1">ROJA</Badge>
                          <p className="text-sm md:text-base font-bold text-white truncate">
                            {fight.fighter_a ? `${fight.fighter_a.first_name} ${fight.fighter_a.last_name}` : fight.fighter_a_external?.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-400 font-medium">{fight.fighter_a?.record_wins || fight.fighter_a_external?.record?.wins || 0}V</span>
                            <span className="text-red-400 font-medium">{fight.fighter_a?.record_losses || fight.fighter_a_external?.record?.losses || 0}D</span>
                            {fight.fighter_a && <Shield className="w-3 h-3 text-green-500" />}
                          </div>
                        </div>
                      </div>

                      {/* VS */}
                      <div className="flex flex-col items-center px-2 md:px-4">
                        <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-red-500 via-white to-blue-500 bg-clip-text text-transparent">
                          VS
                        </span>
                      </div>

                      {/* Fighter B */}
                      <div className="flex-1 flex items-center gap-3 flex-row-reverse text-right">
                        <div className="relative w-16 h-20 md:w-20 md:h-24 flex-shrink-0">
                          {/* Country Code BG */}
                          {(fight.fighter_b?.country || fight.fighter_b_external?.country) && (
                            <span className="absolute inset-0 flex items-center justify-center text-3xl md:text-4xl font-black text-white/10 pointer-events-none">
                              {getCountryCode(fight.fighter_b?.country || fight.fighter_b_external?.country)}
                            </span>
                          )}
                          {fight.fighter_b_event_image_url || fight.fighter_b?.avatar_url || fight.fighter_b_external?.image_url ? (
                            <img 
                              src={`${fight.fighter_b_event_image_url || fight.fighter_b?.avatar_url || fight.fighter_b_external?.image_url}?t=${new Date(fight.updated_at).getTime()}`}
                              alt={fight.fighter_b ? `${fight.fighter_b.first_name} ${fight.fighter_b.last_name}` : fight.fighter_b_external?.name}
                              className="w-full h-full object-contain"
                              style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-500/20 rounded flex items-center justify-center border border-blue-500/30">
                              <span className="text-2xl font-bold text-white">
                                {fight.fighter_b ? `${fight.fighter_b.first_name?.[0]}${fight.fighter_b.last_name?.[0]}` : fight.fighter_b_external?.name?.[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Badge className="bg-blue-600/80 text-white text-[9px] px-1.5 py-0 mb-1">AZUL</Badge>
                          <p className="text-sm md:text-base font-bold text-white truncate">
                            {fight.fighter_b ? `${fight.fighter_b.first_name} ${fight.fighter_b.last_name}` : fight.fighter_b_external?.name}
                          </p>
                          <div className="flex items-center justify-end gap-2 text-xs">
                            {fight.fighter_b && <Shield className="w-3 h-3 text-green-500" />}
                            <span className="text-green-400 font-medium">{fight.fighter_b?.record_wins || fight.fighter_b_external?.record?.wins || 0}V</span>
                            <span className="text-red-400 font-medium">{fight.fighter_b?.record_losses || fight.fighter_b_external?.record?.losses || 0}D</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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