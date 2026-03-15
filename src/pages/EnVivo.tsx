import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Calendar, MapPin, Trophy, Tv, MessageSquare, Lock, Share2, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import LiveFightStatsWidget from '@/components/LiveFightStatsWidget';
import { toast } from 'sonner';

interface LiveEvent {
  id: string;
  name: string;
  description?: string;
  discipline: string;
  venue?: string;
  state: string;
  start_time?: string;
  meta: any;
  organization_id?: string;
}

interface LiveStreamData {
  embed_url: string;
  chat_embed_url?: string;
  is_streaming: boolean;
}

const parseMeta = (meta: any): Record<string, any> | null => {
  if (!meta) return null;
  if (typeof meta === 'string') {
    try { return JSON.parse(meta); } catch { return null; }
  }
  return meta;
};

const getEventLiveStream = (event: LiveEvent): LiveStreamData | null => {
  const meta = parseMeta(event?.meta);
  const liveStream = meta?.live_stream;
  if (liveStream && liveStream.is_streaming && liveStream.embed_url) {
    return liveStream as LiveStreamData;
  }
  return null;
};

const getEventBrandingLogo = (event: LiveEvent): string => {
  const meta = parseMeta(event?.meta);
  if (meta?.branding?.logo_url) return meta.branding.logo_url;
  return '/lovable-uploads/ucc-logo-transparent.png';
};

const EnVivo = () => {
  const { user } = useAuth();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch all events and filter by streaming status client-side
        const { data: allEvents } = await supabase
          .from('bdg_event')
          .select('id, name, description, discipline, venue, state, start_time, meta, organization_id')
          .order('start_time', { ascending: true });

        const all = allEvents || [];
        const liveStreaming = all.filter(e => getEventLiveStream(e));
        setLiveEvents(liveStreaming);

        // Upcoming = published events that are NOT currently streaming
        const upcoming = all
          .filter(e => e.state === 'published' && !getEventLiveStream(e))
          .slice(0, 6);
        setUpcomingEvents(upcoming);
      } catch (error) {
        console.error('Error fetching live events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Real-time subscription for live updates
    const channel = supabase
      .channel('live-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bdg_event' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleChat = (eventId: string) => {
    setShowChat(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Dark arena background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-red-950/8 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-red-900/6 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero */}
        <section className="pt-20 pb-8 border-b border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Radio className="w-8 h-8 text-destructive" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                EN VIVO
              </h1>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl">
              Transmisiones en vivo de los mejores eventos de combate. UCC, Honduras Hoodfights y más.
            </p>
          </div>
        </section>

        {/* Live streams */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {liveEvents.length === 0 ? (
              <div className="text-center py-20">
                <Tv className="w-20 h-20 mx-auto text-muted-foreground/30 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-3">No hay transmisiones en vivo</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  No hay eventos transmitiendo en este momento. Revisa los próximos eventos.
                </p>
              </div>
            ) : !user ? (
              /* Not logged in — show CTA */
              <div className="text-center py-20">
                <Lock className="w-16 h-16 mx-auto text-destructive/60 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-3">
                  {liveEvents.length} transmisi{liveEvents.length === 1 ? 'ón' : 'ones'} en vivo ahora
                </h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Regístrate o inicia sesión para ver las transmisiones en vivo de los eventos de combate.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button asChild size="lg" className="bg-destructive hover:bg-destructive/90 text-white font-bold">
                    <Link to="/auth">Regístrate Gratis</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Link to="/auth">Iniciar Sesión</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                {liveEvents.map((event) => {
                  const stream = getEventLiveStream(event)!;
                  const chatVisible = showChat[event.id];

                  return (
                    <div key={event.id} className="space-y-4">
                      {/* Event header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <img
                            src={getEventBrandingLogo(event)}
                            alt="Logo"
                            className="h-10 w-auto opacity-90"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                                🔴 EN VIVO
                              </Badge>
                              <Badge variant="outline" className="text-white border-white/20">
                                {event.discipline}
                              </Badge>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-white mt-1">{event.name}</h2>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {stream.chat_embed_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleChat(event.id)}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {chatVisible ? 'Ocultar Chat' : 'Ver Chat'}
                            </Button>
                          )}
                          <Button asChild size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                            <Link to={`/evento/${event.id}`}>
                              <Trophy className="w-4 h-4 mr-1" />
                              Ver Fight Card
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Video + Chat layout */}
                      <div className={`grid ${chatVisible && stream.chat_embed_url ? 'lg:grid-cols-[1fr_350px]' : 'grid-cols-1'} gap-4`}>
                        {/* YouTube Embed */}
                        <div className="relative w-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            src={stream.embed_url}
                            title={event.name}
                            className="absolute top-0 left-0 w-full h-full"
                            style={{ width: '100%', height: '100%' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>

                        {/* Chat */}
                        {chatVisible && stream.chat_embed_url && (
                          <div className="hidden lg:block rounded-xl overflow-hidden border border-white/10 bg-gray-950">
                            <iframe
                              src={stream.chat_embed_url}
                              title={`Chat - ${event.name}`}
                              className="w-full h-full min-h-[400px]"
                            />
                          </div>
                        )}
                      </div>

                      {/* AI Vision Stats Widget */}
                      {(() => {
                        const meta = parseMeta(event?.meta);
                        const activeFightId = meta?.active_fight_id;
                        return activeFightId ? <LiveFightStatsWidget fightId={activeFightId} /> : null;
                      })()}

                      {/* Event info */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        {event.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {event.venue}
                          </div>
                        )}
                        {event.start_time && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(event.start_time), 'PPP', { locale: es })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <section className="py-12 border-t border-white/5">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-white mb-6">Próximos Eventos</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="bg-gray-950/60 border-white/10 hover:border-primary/40 transition-colors">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <img src={getEventBrandingLogo(event)} alt="" className="h-6 w-auto opacity-70" />
                        <Badge variant="outline" className="text-xs">{event.discipline}</Badge>
                      </div>
                      <h3 className="font-bold text-white">{event.name}</h3>
                      <div className="text-sm text-gray-400 space-y-1">
                        {event.start_time && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(event.start_time), 'PPP', { locale: es })}
                          </div>
                        )}
                        {event.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.venue}
                          </div>
                        )}
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                        <Link to={`/evento/${event.id}`}>Ver Detalles</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default EnVivo;
