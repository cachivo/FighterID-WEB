import { useParams, useNavigate } from 'react-router-dom';
import { useGym } from '@/hooks/useGyms';
import { CoachCard } from '@/components/coach/CoachCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Globe, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield } from 'lucide-react';
import { useGymFighters } from '@/hooks/gyms/useGymFighters';

export default function GimnasioDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: gym, isLoading } = useGym(slug || '');
  const { data: fightersData } = useGymFighters(gym?.id || '');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="px-4 py-8 pt-20">
          <Skeleton className="h-20 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="px-4 py-8 pt-20 text-center">
          <h2 className="text-xl font-bold mb-4">Gimnasio no encontrado</h2>
          <Button onClick={() => window.history.back()}>Volver</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16">
        {/* Banner compacto solo si existe */}
        {gym.banner_url && (
          <div className="h-32 w-full overflow-hidden">
            <img src={gym.banner_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Header compacto */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16 border-2 border-border shadow-sm flex-shrink-0">
              <AvatarImage src={gym.logo_url || undefined} alt={gym.nombre} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <Shield className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold break-words leading-tight">{gym.nombre}</h1>
              {gym.ciudad && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="break-words leading-tight">
                    {gym.direccion && `${gym.direccion}, `}
                    {gym.ciudad}{gym.pais ? `, ${gym.pais}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botones de contacto */}
          <div className="flex flex-wrap gap-2 mt-3">
            {gym.telefono && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${gym.telefono}`}>
                  <Phone className="h-4 w-4 mr-1" />
                  Llamar
                </a>
              </Button>
            )}
            {gym.whatsapp && (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://wa.me/${gym.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <Phone className="h-4 w-4 mr-1" />
                  WhatsApp
                </a>
              </Button>
            )}
            {gym.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${gym.email}`}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </a>
              </Button>
            )}
            {gym.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={gym.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-1" />
                  Web
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="px-4 py-4 space-y-4 pb-8">
          {gym.descripcion && (
            <div className="bg-card rounded-xl p-4 shadow-sm border">
              <h2 className="text-base font-semibold mb-2">Sobre el Gimnasio</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{gym.descripcion}</p>
            </div>
          )}

          {gym.disciplinas && gym.disciplinas.length > 0 && (
            <div className="bg-card rounded-xl p-4 shadow-sm border">
              <h2 className="text-base font-semibold mb-2">Disciplinas</h2>
              <div className="flex flex-wrap gap-2">
                {gym.disciplinas.map(d => (
                  <Badge key={d} variant="secondary" className="text-xs px-2 py-1">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {gym.coaches && gym.coaches.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3">Entrenadores</h2>
              <div className="space-y-3">
                {gym.coaches.map(coach => (
                  <CoachCard key={coach.id} coach={coach} />
                ))}
              </div>
            </div>
          )}

          {/* Peleadores del gimnasio */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Peleadores</h2>
              {fightersData && fightersData.totalCount > 0 && (
                <Badge variant="secondary" className="text-xs">{fightersData.totalCount}</Badge>
              )}
            </div>
            {fightersData && fightersData.fighters.length > 0 ? (
              <div className="space-y-2">
                {fightersData.fighters.map(({ fighter }) => {
                  const discipline = fighter.discipline || 'MMA';
                  const wins = discipline === 'Boxeo' ? fighter.boxeo_record_wins : fighter.mma_record_wins;
                  const losses = discipline === 'Boxeo' ? fighter.boxeo_record_losses : fighter.mma_record_losses;
                  const draws = discipline === 'Boxeo' ? fighter.boxeo_record_draws : fighter.mma_record_draws;
                  
                  return (
                    <div
                      key={fighter.id}
                      className="flex items-center gap-3 p-3 bg-card rounded-xl border cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(`/fighter/${fighter.id}`)}
                    >
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={fighter.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {(fighter.first_name?.[0] || '')}{(fighter.last_name?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-words leading-tight">
                          {fighter.first_name} {fighter.last_name}
                        </p>
                        {fighter.nickname && (
                          <p className="text-xs text-muted-foreground italic break-words">"{fighter.nickname}"</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {fighter.discipline && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{fighter.discipline}</Badge>
                          )}
                          {fighter.weight_class && (
                            <span className="text-[10px] text-muted-foreground">{fighter.weight_class}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono">
                          <span className="text-fighter-success">{wins}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-fighter-danger">{losses}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-muted-foreground">{draws}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Este gimnasio aún no tiene peleadores registrados
              </p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
