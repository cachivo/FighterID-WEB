import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useFighterProfiles, FighterProfile as FighterProfileType } from '@/hooks/useFighterProfiles';
import { useCombinedFighterRecord } from '@/hooks/useCombinedFighterRecord';
import { useRealtimeFighterUpdates } from '@/hooks/useRealtimeFighterUpdates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Shield, Trophy, MapPin, Users, BarChart3, Info, Home, GraduationCap, Edit, ExternalLink, CreditCard, ChevronDown } from 'lucide-react';
import { Crown, Award, Swords } from 'lucide-react';
import FighterUpdatesFeed from '@/components/FighterUpdatesFeed';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getWeightClassLabel } from '@/lib/constants/disciplines';
import { useFighterActiveLeagues } from '@/hooks/useFighterActiveLeagues';
import { MARTIAL_ARTS_TRAINING } from '@/lib/constants/disciplines';
import { supabase } from '@/integrations/supabase/client';
import { DigitalFighterToken } from '@/components/DigitalFighterToken';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function FighterProfile() {
  const { id } = useParams<{ id: string }>();
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
          .single();
        
        setIsOwner(appUser?.id === fighter.user_id);
      } catch (error) {
        console.error('[FighterProfile] Error checking ownership:', error);
        setIsOwner(false);
      }
    };
    
    checkOwnership();
  }, [fighter?.user_id]);

  const fetchFighter = useCallback(async () => {
    if (id) {
      const profile = await getFighterById(id);
      setFighter(profile);
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
      case 'active': return 'bg-green-500 text-white';
      case 'suspended': return 'bg-red-500 text-white';
      case 'expired': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
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
      {/* Header */}
      <div className="border-b border-border pt-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Inicio
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/fighters">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Fighters
                </Link>
              </Button>
            </div>
            
            {/* Edit button for profile owner */}
            {isOwner && (
              <Button 
                asChild 
                variant="default" 
                className="min-h-[44px] touch-manipulation w-full sm:w-auto"
              >
                <Link to="/license/dashboard">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Mi Perfil
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Fighter Header */}
        <Card>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-center">
              {/* Fighter Info */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                  <Badge className={`${getStatusColor(fighter.license_status)} text-xs sm:text-sm`}>
                    {fighter.license_status === 'active' ? 'Activo' : fighter.license_status}
                  </Badge>
                  <Badge variant="outline" className="text-xs sm:text-sm">{getWeightClassLabel(fighter.weight_class)}</Badge>
                </div>
                
                {fighter.nickname && (
                  <p className="text-sm sm:text-base md:text-lg font-medium text-muted-foreground truncate">
                    "{fighter.nickname}"
                  </p>
                )}
                
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-foreground break-words">
                    {fighter.first_name} {fighter.last_name}
                  </h1>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{fighter.country}</span>
                </div>

                {/* Disciplina de Competencia - Badge prominente */}
                <div className="my-4 sm:my-6">
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Swords className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Disciplina</p>
                      <p className="font-bold text-sm sm:text-base md:text-lg truncate">{fighter.discipline || 'No definida'}</p>
                    </div>
                    {fighter.level && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {fighter.level}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Fight Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-green-500/10">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-0.5 sm:mb-1">
                      {currentRecord.wins}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Victorias</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-red-500/10">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 mb-0.5 sm:mb-1">
                      {currentRecord.losses}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Derrotas</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-muted-foreground mb-0.5 sm:mb-1">
                      {currentRecord.draws}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Empates</div>
                  </div>
                </div>

                {/* Record Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-green-600" />
                    {currentRecord.wins} Victoria{currentRecord.wins !== 1 ? 's' : ''}
                  </div>
                  {currentRecord.source && (
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {getRecordSourceText()}
                    </div>
                  )}
                </div>
              </div>

              {/* Fighter Image */}
              <div className="flex justify-center lg:justify-end order-first lg:order-last">
                <div className="relative">
                  {fighter.avatar_url ? (
                    <div className="h-48 w-36 sm:h-64 sm:w-48 md:h-80 md:w-60 flex items-end justify-center overflow-hidden rounded-xl bg-muted">
                      <img 
                        src={fighter.avatar_url} 
                        alt={`${fighter.first_name} ${fighter.last_name}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-36 sm:h-64 sm:w-48 md:h-80 md:w-60 bg-muted rounded-xl flex items-center justify-center">
                      <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-muted-foreground">
                        {fighter.first_name?.charAt(0) || 'F'}
                        {fighter.last_name?.charAt(0) || 'F'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <p className="text-xs text-muted-foreground uppercase mb-0.5 sm:mb-1 truncate">{stat.label}</p>
                <p className="text-sm sm:text-base md:text-lg font-semibold truncate">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

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
                {activeLeagues && activeLeagues.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Ligas Activas
                      </h4>
                      <div className="space-y-3">
                        {activeLeagues.map((league) => (
                          <div 
                            key={league.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <Swords className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {league.organization_short_name}
                                  {league.is_champion && (
                                    <Crown className="h-4 w-4 text-yellow-500" />
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {league.discipline} • {league.level} • {league.weight_class}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">{league.points} pts</div>
                              {league.ranking_position && (
                                <div className="text-xs text-muted-foreground">
                                  Posición #{league.ranking_position}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Fighting Style */}
                {fighter.fighting_style && (
                  <div>
                    <h4 className="font-semibold mb-2">Estilo de Pelea</h4>
                    <p className="text-muted-foreground">{fighter.fighting_style}</p>
                  </div>
                )}

                {/* Gym */}
                {(fighter.gym_id || fighter.gym_name) && (
                  <div>
                    <h4 className="font-semibold mb-2">Gimnasio</h4>
                    {fighter.gym_id ? (
                      <Link
                        to={`/gym/${fighter.gym_id}/dashboard`}
                        className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                      >
                        {fighter.gym_name || 'Ver gimnasio'}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <p className="text-muted-foreground">{fighter.gym_name}</p>
                    )}
                  </div>
                )}

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