import { useState, useEffect } from "react";
import { getWeightClassLabel, GENDERS, WEIGHT_CLASSES } from "@/lib/constants/disciplines";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Target, Award, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizationRanking } from "@/hooks/useOrganizationRanking";
import { useRankingOrganizations } from "@/hooks/useRankingOrganizations";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";
import { useNavigate } from "react-router-dom";
import { InfiniteScrollContainer } from "@/components/InfiniteScrollContainer";
import { useRealtimeFighterUpdates, useRealtimeRankingUpdates } from "@/hooks/useRealtimeFighterUpdates";
import { useSystemAssets } from "@/hooks/useSystemAssets";

interface RankingProps {
  organizationCode?: string;
}

const Ranking = ({ organizationCode = 'UCC_MMA' }: RankingProps) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedWeightClass, setSelectedWeightClass] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  
  // Realtime subscriptions for automatic sync across modules
  useRealtimeFighterUpdates();
  useRealtimeRankingUpdates();
  const { rankingBgUrl } = useSystemAssets();
  
  const { data: organizations } = useRankingOrganizations();
  const { data: rankingData, isLoading } = useOrganizationRanking(
    organizationCode,
    selectedLevel || undefined,
    selectedWeightClass || undefined,
    selectedGender || undefined,
    page,
    PAGE_SIZE
  );
  
  const navigate = useNavigate();

  const currentOrg = organizations?.find(org => org.code === organizationCode);
  const availableLevels = currentOrg?.allowed_levels || [];
  const availableWeightClasses = rankingData?.weightClasses || [];

  // Smart default level selection: prioritize levels with data
  useEffect(() => {
    if (availableLevels.length > 0 && !selectedLevel) {
      const levelCounts = rankingData?.levelCounts || {};
      
      // Prioridad: Profesional > Semi-profesional > Amateur, pero solo si tienen datos
      if (availableLevels.includes('Profesional') && (levelCounts['Profesional'] || 0) > 0) {
        setSelectedLevel('Profesional');
      } else if (availableLevels.includes('Semi-profesional') && (levelCounts['Semi-profesional'] || 0) > 0) {
        setSelectedLevel('Semi-profesional');
      } else if (availableLevels.includes('Amateur') && (levelCounts['Amateur'] || 0) > 0) {
        setSelectedLevel('Amateur');
      } else {
        // Fallback: nivel con más peleadores
        const bestLevel = Object.entries(levelCounts)
          .filter(([level]) => availableLevels.includes(level))
          .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0];
        
        setSelectedLevel(bestLevel || availableLevels[0]);
      }
    }
  }, [availableLevels, selectedLevel, rankingData?.levelCounts]);

  // Reset page and filters when org changes
  useEffect(() => {
    setPage(1);
    setSelectedLevel('');  // Reset level so smart selection can run for the new org
    setSelectedWeightClass('');
    setSelectedGender('');
  }, [organizationCode]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedLevel, selectedWeightClass, selectedGender]);

  const rankings = rankingData?.rankings || [];
  const hasMore = rankingData?.hasMore || false;

  // Helper function for record fallback logic (discipline-specific → legacy)
  const getRecordWithFallback = (fighter: typeof rankings[0]['fighter'], discipline: 'MMA' | 'Boxeo') => {
    if (discipline === 'MMA') {
      const hasSpecificRecord = (fighter.mma_record_wins || 0) + (fighter.mma_record_losses || 0) + (fighter.mma_record_draws || 0) > 0;
      if (hasSpecificRecord) {
        return { wins: fighter.mma_record_wins || 0, losses: fighter.mma_record_losses || 0, draws: fighter.mma_record_draws || 0 };
      }
    } else {
      const hasSpecificRecord = (fighter.boxeo_record_wins || 0) + (fighter.boxeo_record_losses || 0) + (fighter.boxeo_record_draws || 0) > 0;
      if (hasSpecificRecord) {
        return { wins: fighter.boxeo_record_wins || 0, losses: fighter.boxeo_record_losses || 0, draws: fighter.boxeo_record_draws || 0 };
      }
    }
    // Fallback to legacy record fields
    return { wins: fighter.record_wins || 0, losses: fighter.record_losses || 0, draws: fighter.record_draws || 0 };
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const estadisticas = [
    {
      numero: rankingData?.totalCount.toString() || "0",
      descripcion: "Peleadores Registrados",
      Icon: Users
    },
    {
      numero: rankingData?.totalCount.toString() || "0",
      descripcion: "Peleas Realizadas",
      Icon: Target
    },
    {
      numero: rankings.filter(r => r.level === 'Profesional').length.toString(),
      descripcion: "Profesionales Activos",
      Icon: Award
    },
    {
      numero: rankings.filter(r => r.is_champion).length.toString(),
      descripcion: "Campeones",
      Icon: TrendingUp
    }
  ];

  return (
    <section id="ranking" className="py-4 xs:py-6 sm:py-8 md:py-12 lg:py-16 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-80"
        style={{ backgroundImage: `url(${rankingBgUrl})` }}
      />
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="container mx-auto px-2 xs:px-3 sm:px-4 relative z-10">
        <div className="text-center mb-4 xs:mb-6 sm:mb-8 md:mb-10 animate-slide-up">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">
            Ranking <span className="text-purple-neon-primary">{currentOrg?.short_name || 'OFICIAL'}</span>
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed px-2">
            {currentOrg?.description || 'Clasificación oficial de peleadores'}
          </p>
        </div>

        {/* Estadísticas - Mobile optimized grid */}
        <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:grid-cols-4 md:gap-6 mb-4 xs:mb-6 sm:mb-8 md:mb-12">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="bg-black/60 border-purple-neon-primary/30 backdrop-blur-sm">
                <CardContent className="p-2.5 xs:p-3 sm:p-4 md:p-6">
                  <EnhancedSkeleton className="h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 xs:mb-2 rounded-full" />
                  <EnhancedSkeleton className="h-5 xs:h-6 sm:h-8 w-10 xs:w-12 sm:w-16 mx-auto mb-1.5 xs:mb-2" />
                  <EnhancedSkeleton className="h-2.5 xs:h-3 sm:h-4 w-14 xs:w-16 sm:w-24 mx-auto" />
                </CardContent>
              </Card>
            ))
          ) : (
            estadisticas.map((stat, index) => (
              <Card key={index} className="bg-black/60 border-purple-neon-primary/30 backdrop-blur-sm text-center group hover:scale-105 transition-all duration-300 touch-manipulation">
                <CardContent className="p-2.5 xs:p-3 sm:p-4 md:p-6">
                  <stat.Icon className="h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 mx-auto mb-1 xs:mb-1.5 sm:mb-2 text-purple-neon-primary" />
                  <div className="text-base xs:text-lg sm:text-xl md:text-3xl font-bold text-purple-neon-primary mb-0.5 xs:mb-1 sm:mb-2 group-hover:animate-pulse-purple-neon">
                    {stat.numero}
                  </div>
                  <p className="text-gray-300 text-[9px] xs:text-[10px] sm:text-xs md:text-sm leading-tight">
                    {stat.descripcion}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Top Peleadores con Infinite Scroll */}
        <div className="mb-6 xs:mb-8 sm:mb-12">
          <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center text-white mb-3 xs:mb-4 sm:mb-6">
            Top Peleadores <span className="text-purple-neon-primary">{currentOrg?.discipline || ''}</span>
          </h3>
          
          {/* Tabs de nivel - Mobile optimized */}
          {availableLevels.length > 0 && (
            <div className="flex justify-center mb-3 xs:mb-4 px-2">
              <Tabs value={selectedLevel} onValueChange={setSelectedLevel}>
                <TabsList className="bg-black/60 border border-purple-neon-primary/30 h-10 xs:h-11">
                  {availableLevels.map(level => (
                    <TabsTrigger 
                      key={level} 
                      value={level}
                      className="data-[state=active]:bg-purple-neon-primary data-[state=active]:text-black px-3 xs:px-4 text-xs xs:text-sm min-h-[40px] touch-manipulation"
                    >
                      {level === 'Profesional' ? 'Pro' : level === 'Semi-profesional' ? 'Semi' : 'Amateur'}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Filtros de peso y género - Mobile optimized */}
          <div className="flex flex-wrap justify-center gap-2 mb-4 xs:mb-6 px-2">
            {/* Filtro de Peso */}
            <Select 
              value={selectedWeightClass || '__all__'} 
              onValueChange={(val) => setSelectedWeightClass(val === '__all__' ? '' : val)}
            >
              <SelectTrigger className="w-[130px] xs:w-[150px] sm:w-[170px] bg-black/60 border-purple-neon-primary/30 h-10 xs:h-11 text-xs xs:text-sm min-h-[44px] touch-manipulation">
                <SelectValue placeholder="División" />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-purple-neon-primary/30">
                <SelectItem value="__all__">Todas las divisiones</SelectItem>
                {availableWeightClasses.map(wc => (
                  <SelectItem key={wc} value={wc} className="text-xs xs:text-sm">
                    {getWeightClassLabel(wc)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro de Género */}
            <Select 
              value={selectedGender || '__all__'} 
              onValueChange={(val) => setSelectedGender(val === '__all__' ? '' : val)}
            >
              <SelectTrigger className="w-[110px] xs:w-[130px] sm:w-[140px] bg-black/60 border-purple-neon-primary/30 h-10 xs:h-11 text-xs xs:text-sm min-h-[44px] touch-manipulation">
                <SelectValue placeholder="Género" />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-purple-neon-primary/30">
                <SelectItem value="__all__">Todos</SelectItem>
                {GENDERS.map(g => (
                  <SelectItem key={g.value} value={g.value} className="text-xs xs:text-sm">
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Show skeleton while loading OR while initializing level selection */}
          {(isLoading && page === 1) || (!selectedLevel && availableLevels.length > 0) ? (
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <EnhancedSkeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1">
                        <EnhancedSkeleton className="h-5 w-32 mb-2" />
                        <EnhancedSkeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : rankings.length > 0 ? (
            <InfiniteScrollContainer
              onLoadMore={loadMore}
              hasMore={hasMore}
              loading={isLoading}
            >
              <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                {rankings.map((ranking, index) => {
                  const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
                  const rankColor = index < 3 ? rankColors[index] : 'text-purple-neon-primary';
                  
                  // Get record with fallback to legacy fields
                  const { wins, losses, draws } = getRecordWithFallback(
                    ranking.fighter, 
                    rankingData?.discipline || 'MMA'
                  );
                  
                  return (
                  <Card 
                    key={ranking.id} 
                    className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 cursor-pointer touch-manipulation group"
                    onClick={() => navigate(`/fighter/${ranking.fighter_id}`)}
                  >
                    <CardContent className="p-2.5 xs:p-3 sm:p-4 md:p-6">
                      <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                        {/* Ranking Position */}
                        <div className={`text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold ${rankColor} min-w-[28px] xs:min-w-[32px] sm:min-w-[40px] text-center shrink-0`}>
                          {index < 3 ? <Trophy className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto" /> : `#${index + 1}`}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 border-2 border-purple-neon-primary/50 shrink-0">
                          <AvatarImage src={ranking.fighter.avatar_url || undefined} />
                          <AvatarFallback className="bg-purple-neon-primary/20 text-white text-xs xs:text-sm">
                            {ranking.fighter.first_name[0]}{ranking.fighter.last_name[0]}
                          </AvatarFallback>
                        </Avatar>

                        {/* Fighter Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-wrap mb-0.5 xs:mb-1">
                            <h4 className="text-xs xs:text-sm sm:text-base font-bold text-white group-hover:text-purple-neon-primary transition-colors truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none">
                              {ranking.fighter.first_name} {ranking.fighter.last_name}
                            </h4>
                            {ranking.is_champion && (
                              <Badge className="bg-yellow-500 text-yellow-950 text-[8px] xs:text-[10px] flex items-center gap-0.5 px-1 xs:px-1.5">
                                <Crown className="h-2.5 w-2.5 xs:h-3 xs:w-3" /> 
                                <span className="hidden xs:inline">CAMPEÓN</span>
                                <span className="xs:hidden">🏆</span>
                              </Badge>
                            )}
                          </div>
                          {ranking.fighter.nickname && (
                            <span className="text-[9px] xs:text-[10px] sm:text-xs text-white/90 font-medium truncate block mb-0.5">
                              "{ranking.fighter.nickname}"
                            </span>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-1 xs:gap-1.5 sm:gap-2">
                            <Badge variant="outline" className="text-[9px] xs:text-[10px] sm:text-xs border-purple-neon-primary/50 text-purple-neon-primary px-1 xs:px-1.5">
                              {getWeightClassLabel(ranking.weight_class)}
                            </Badge>
                            {/* Fighter Record - Always visible */}
                            <span className="text-[9px] xs:text-[10px] sm:text-xs font-mono">
                              <span className="text-green-400">{wins || 0}</span>
                              <span className="text-gray-500">-</span>
                              <span className="text-red-400">{losses || 0}</span>
                              <span className="text-gray-500">-</span>
                              <span className="text-gray-400">{draws || 0}</span>
                            </span>
                          </div>
                        </div>

                        {/* Puntos de Ranking */}
                        <div className="text-right shrink-0 min-w-[45px] xs:min-w-[55px] sm:min-w-[70px]">
                          <div className="text-sm xs:text-base sm:text-lg font-bold text-purple-neon-primary">
                            {ranking.points}
                          </div>
                          <div className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400">
                            pts
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </InfiniteScrollContainer>
          ) : (
            <Card className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm">
              <CardContent className="p-4 xs:p-6 sm:p-8 text-center">
                <Users className="h-10 w-10 xs:h-12 xs:w-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400 text-xs xs:text-sm sm:text-base mb-3">
                  No hay peleadores registrados en {selectedLevel || 'esta categoría'}
                </p>
                {selectedLevel && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedLevel('')}
                    className="border-purple-neon-primary/50 text-purple-neon-primary hover:bg-purple-neon-primary/10"
                  >
                    Ver todos los niveles
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center px-2">
          <Button 
            size="lg" 
            onClick={() => navigate('/fighters')}
            className="w-full xs:w-auto bg-purple-neon-primary hover:bg-purple-neon-secondary text-black font-bold px-4 xs:px-6 sm:px-8 py-3 xs:py-4 text-sm xs:text-base sm:text-lg animate-glow-neon min-h-[48px] touch-manipulation"
          >
            Ver Todos los Peleadores
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Ranking;