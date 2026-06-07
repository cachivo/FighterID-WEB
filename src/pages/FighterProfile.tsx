import { Link } from 'react-router-dom';
import { useUuidParam } from '@/hooks/useUuidParam';
import { useEffect, useState, useCallback } from 'react';
import { useFighterProfiles, FighterProfile as FighterProfileType } from '@/hooks/useFighterProfiles';
import { useCombinedFighterRecord } from '@/hooks/useCombinedFighterRecord';
import { useRealtimeFighterUpdates } from '@/hooks/useRealtimeFighterUpdates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Shield, Trophy, MapPin, Users, BarChart3, Info, Home, GraduationCap, Edit, ExternalLink, CreditCard, ChevronDown, Building2, Swords } from 'lucide-react';
import cageBackground from "@/assets/mma-cage-background.png";
import { Crown, Award } from 'lucide-react';
import FighterUpdatesFeed from '@/components/FighterUpdatesFeed';
import FighterRecordHistory from '@/components/FighterRecordHistory';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getWeightClassLabel } from '@/lib/constants/disciplines';
import { useFighterActiveLeagues } from '@/hooks/useFighterActiveLeagues';
import { MARTIAL_ARTS_TRAINING } from '@/lib/constants/disciplines';
import { supabase } from '@/integrations/supabase/client';
import { DigitalFighterToken } from '@/components/DigitalFighterToken';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function FighterProfile() {
  const { value: id, redirect } = useUuidParam('id');
  if (redirect) return redirect;
  const { getFighterById } = useFighterProfiles();
  const { getDisciplineRecord, fighterProfile: recordProfile, isLoading: isLoadingRecord } = useCombinedFighterRecord(id || null);
  const { data: activeLeagues, isLoading: isLoadingLeagues } = useFighterActiveLeagues(id || null);
  const [fighter, setFighter] = useState<FighterProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  
  // Enable realtime updates for this fighter
  useRealtimeFighterUpdates(id);

  // Check if current user is the owner of this fighter profile
  useEffect(() => {
    const checkOwnership = async () => {
      if (!fighter?.user_id) {
        setIsOwner(false);
        return;
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsOwner(false);
          return;
        }
        
        const { data: appUser } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        setIsOwner(appUser?.id === fighter.user_id);
      } catch (error) {
        console.error('[FighterProfile] Error checking ownership:', error);
        setIsOwner(false);
      }
    };
    
    checkOwnership();
  }, [fighter?.user_id]);

  const fetchFighter = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const profile = await getFighterById(id);
      setFighter(profile);
    } catch (err) {
      console.error('[FighterProfile] Error fetching fighter:', err);
      setFighter(null);
    } finally {
      setLoading(false);
    }
  }, [id, getFighterById]);

  useEffect(() => {
    fetchFighter();
  }, [fetchFighter]);

  // Custom window events removed — useRealtimeFighterUpdates handles sync via React Query

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <h2 className="text-xl font-semibold">Cargando perfil del peleador...</h2>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!fighter) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Peleador no encontrado</h2>
            <p className="text-muted-foreground mb-4">El perfil que buscas no existe o no está disponible.</p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Inicio
                </Link>
              </Button>
              <Button asChild>
                <Link to="/fighters">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Peleadores
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-fighter-success text-white';
      case 'suspended': return 'bg-fighter-danger text-white';
      case 'expired': return 'bg-fighter-info text-white';
      case 'pending': return 'bg-fighter-warning text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Calcular récord basado en disciplina de competencia (no Amateur/Pro)
  const currentRecord = getDisciplineRecord();
  const record = `${currentRecord.wins}-${currentRecord.losses}-${currentRecord.draws}`;

  // Record source indicator
  const getRecordSourceText = () => {
    switch (currentRecord.source) {
      case 'manual': return 'Récord oficial';
      case 'fights': return 'Desde peleas';
      case 'combined': return 'Récord combinado';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ========== CINEMATIC PROFILE HERO ========== */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-end overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={cageBackground} alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 pb-8 pt-6">
          {/* Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div className="flex gap-2">
              <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Inicio
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                <Link to="/fighters">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Fighters
                </Link>
              </Button>
            </div>
            {isOwner && (
              <Button asChild variant="default" className="min-h-[44px] touch-manipulation w-full sm:w-auto">
                <Link to="/license/dashboard">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Mi Perfil
                </Link>
              </Button>
            )}
          </div>

          {/* Fighter Info Layout */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {fighter.avatar_url ? (
                <div className="h-48 w-36 sm:h-64 sm:w-48 overflow-hidden rounded-xl border-2 border-white/20 shadow-2xl">
                  <img
                    src={fighter.avatar_url}
                    alt={`${fighter.first_name} ${fighter.last_name}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 w-36 sm:h-64 sm:w-48 rounded-xl border-2 border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-bold text-white/60">
                    {fighter.first_name?.charAt(0) || 'F'}{fighter.last_name?.charAt(0) || 'F'}
                  </span>
                </div>
              )}
            </div>

            {/* Fighter Details */}
            <div className="flex-1 space-y-3">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={`${getStatusColor(fighter.license_status)} text-xs sm:text-sm`}>
                  {fighter.license_status === 'active' ? 'Activo' : fighter.license_status}
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20 text-xs sm:text-sm">
                  {getWeightClassLabel(fighter.weight_class)}
                </Badge>
                {fighter.level && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs sm:text-sm">
                    {fighter.level}
                  </Badge>
                )}
              </div>

              {/* Nickname */}
              {fighter.nickname && (
                <p className="ufc-label text-sm sm:text-base md:text-lg text-primary tracking-wider">
                  "{fighter.nickname}"
                </p>
              )}

              {/* Full Name */}
              <h1 className="ufc-label text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-wider leading-tight">
                {fighter.first_name} {fighter.last_name}
              </h1>

              {/* Info row */}
              <div className="flex flex-wrap items-center gap-3 text-white/70 text-sm sm:text-base">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {fighter.country || 'N/A'}
                </span>
                <span className="w-px h-4 bg-white/20" />
                <span className="flex items-center gap-1.5">
                  <Swords className="h-4 w-4 text-primary" />
                  {fighter.discipline || 'N/A'}
                </span>
                {fighter.gym_id && (
                  <>
                    <span className="w-px h-4 bg-white/20" />
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      {fighter.gym_id ? (
                        <Link
                          to={`/gimnasios/${(fighter as any).gym?.slug || fighter.gym_id}`}
                          className="text-white hover:text-primary transition-colors hover:underline"
                        >
                          {(fighter as any).gym?.nombre || fighter.gym_name || 'Ver gimnasio'}
                        </Link>
                      ) : (
                        <span>{fighter.gym_name || 'Independiente'}</span>
                      )}
                    </span>
                  </>
                )}
              </div>

              {/* Record Bar */}
              <div className="combat-cut inline-flex items-center gap-3 sm:gap-5 bg-white/5 backdrop-blur-md border border-white/10 px-4 sm:px-6 py-3 mt-2">
                <div className="text-center">
                  <p className="ufc-label text-xl sm:text-2xl md:text-3xl font-bold text-fighter-success">{currentRecord.wins}</p>
                  <p className="ufc-label text-[10px] sm:text-xs text-white/60 tracking-wider">Victorias</p>
                </div>
                <div className="w-px h-8 bg-white/15" />
                <div className="text-center">
                  <p className="ufc-label text-xl sm:text-2xl md:text-3xl font-bold text-fighter-danger">{currentRecord.losses}</p>
                  <p className="ufc-label text-[10px] sm:text-xs text-white/60 tracking-wider">Derrotas</p>
                </div>
                <div className="w-px h-8 bg-white/15" />
                <div className="text-center">
                  <p className="ufc-label text-xl sm:text-2xl md:text-3xl font-bold text-white/70">{currentRecord.draws}</p>
                  <p className="ufc-label text-[10px] sm:text-xs text-white/60 tracking-wider">Empates</p>
                </div>
                {currentRecord.source && (
                  <>
                    <div className="w-px h-8 bg-white/15" />
                    <div className="flex items-center gap-1 text-white/40 text-xs">
                      <Info className="h-3 w-3" />
                      {getRecordSourceText()}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Red accent line */}
          <div className="w-24 h-1 bg-primary mt-6" />
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {[
            { label: 'Altura', value: fighter.height_cm ? `${fighter.height_cm} cm` : 'N/A', icon: BarChart3 },
            { label: 'Peso', value: fighter.weight_kg ? `${fighter.weight_kg} kg` : 'N/A', icon: BarChart3 },
            { label: 'Alcance', value: fighter.reach_cm ? `${fighter.reach_cm} cm` : 'N/A', icon: BarChart3 },
            { label: 'Guardia', value: fighter.stance || 'N/A', icon: Users }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 w-fit mx-auto mb-1 sm:mb-2">
                  <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground uppercase mb-0.5 sm:mb-1 break-words leading-tight">{stat.label}</p>
                <p className="text-sm sm:text-base md:text-lg font-semibold break-words leading-tight">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Leagues - Separate Card */}
        {activeLeagues && activeLeagues.length > 0 && (
          <Card className="border-l-4 border-l-fighter-warning">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-fighter-warning" />
                Ligas Activas
              </CardTitle>
              <p className="text-sm text-muted-foreground">Organizaciones donde compite</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeLeagues.map((league) => (
                  <div 
                    key={league.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-fighter-warning/10">
                        <Trophy className="h-4 w-4 text-fighter-warning" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {league.organization_name}
                          {league.is_champion && (
                            <Crown className="h-4 w-4 text-fighter-warning" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {league.organization_short_name} • {league.discipline} • {league.level} • {league.weight_class}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-fighter-warning">{league.points} pts</div>
                      {league.ranking_position && (
                        <div className="text-xs text-muted-foreground">
                          Posición #{league.ranking_position}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fighter Updates Feed - Prominently placed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Actividad del Peleador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FighterUpdatesFeed fighterId={fighter.id} />
          </CardContent>
        </Card>

        {/* Record change audit trail */}
        <FighterRecordHistory fighterId={fighter.id} />


        {/* Fighter Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Biography */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Perfil del Peleador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fighter.bio ? (
                  <div>
                    <h4 className="font-semibold mb-2">Biografía</h4>
                    <p className="text-muted-foreground leading-relaxed">{fighter.bio}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay información biográfica disponible</p>
                  </div>
                )}

                <Separator />

                {/* Martial Arts */}
                <div>
                  <h4 className="font-semibold mb-2">Artes Marciales (Entrenamiento)</h4>
                  <div className="flex flex-wrap gap-2">
                    {fighter.martial_arts && fighter.martial_arts.length > 0 ? (
                      fighter.martial_arts.map((art) => (
                        <Badge key={art} variant="outline">
                          {MARTIAL_ARTS_TRAINING.find(m => m.value === art)?.label || art}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">{fighter.discipline || 'N/A'}</Badge>
                    )}
                  </div>
                </div>

                {/* Active Leagues - Separated from martial arts */}
                {/* Ligas Activas moved to separate Card below */}

                {/* Fighting Style */}
                {fighter.fighting_style && (
                  <div>
                    <h4 className="font-semibold mb-2">Estilo de Pelea</h4>
                    <p className="text-muted-foreground">{fighter.fighting_style}</p>
                  </div>
                )}

                {/* Gym info moved to header section above */}

                {/* Coach */}
                {fighter.coach && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Entrenador
                    </h4>
                    <Link 
                      to={`/entrenadores/${fighter.coach.slug}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={fighter.coach.avatar_url} alt={fighter.coach.nombre} />
                        <AvatarFallback>
                          {fighter.coach.nombre?.charAt(0) || 'E'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {fighter.coach.nombre} {fighter.coach.apellidos || ''}
                        </p>
                        {fighter.coach.especialidades && fighter.coach.especialidades.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {fighter.coach.especialidades.slice(0, 3).map((esp) => (
                              <Badge key={esp} variant="secondary" className="text-xs">
                                {esp}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                )}

                {/* External Profile Links */}
                {(fighter.boxrec_url || fighter.tapology_url) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Perfiles Externos
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {fighter.boxrec_url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild 
                            className="min-h-[44px] touch-manipulation"
                          >
                            <a 
                              href={fighter.boxrec_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              BoxRec
                            </a>
                          </Button>
                        )}
                        {fighter.tapology_url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            className="min-h-[44px] touch-manipulation"
                          >
                            <a 
                              href={fighter.tapology_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Tapology
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="space-y-6">
            {/* Record Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Récord {fighter.discipline || 'General'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold">{record}</div>
                  <p className="text-sm text-muted-foreground">
                    {currentRecord.totalFights} peleas totales
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Digital License Card */}
            <Card>
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Licencia Digital
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <DigitalFighterToken 
                      profile={{
                        id: fighter.id,
                        first_name: fighter.first_name,
                        last_name: fighter.last_name,
                        nickname: fighter.nickname,
                        country: fighter.country,
                        avatar_url: fighter.avatar_url,
                        weight_class: fighter.weight_class,
                        discipline: fighter.discipline,
                        level: fighter.level,
                        record_wins: fighter.record_wins || 0,
                        record_losses: fighter.record_losses || 0,
                        record_draws: fighter.record_draws || 0,
                        license_number: fighter.license_number,
                        license_issue_date: fighter.license_issued_date,
                        license_expiry_date: fighter.license_expires_date,
                        license_state: fighter.license_status,
                        active: fighter.active
                      }}
                    />
                    <div className="mt-3 text-center">
                      <Badge className={getStatusColor(fighter.license_status)}>
                        {fighter.license_status === 'active' ? 'Licencia Activa' : fighter.license_status}
                      </Badge>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}