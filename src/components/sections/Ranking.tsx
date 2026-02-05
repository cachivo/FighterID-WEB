import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Target, Award, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizationRanking } from "@/hooks/useOrganizationRanking";
import { useRankingOrganizations } from "@/hooks/useRankingOrganizations";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";
import { useNavigate } from "react-router-dom";
import { InfiniteScrollContainer } from "@/components/InfiniteScrollContainer";

interface RankingProps {
  organizationCode?: string;
}

const Ranking = ({ organizationCode = 'UCC_MMA' }: RankingProps) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  
  const { data: organizations } = useRankingOrganizations();
  const { data: rankingData, isLoading } = useOrganizationRanking(
    organizationCode,
    selectedLevel || undefined,
    undefined,
    page,
    PAGE_SIZE
  );
  
  const navigate = useNavigate();

  const currentOrg = organizations?.find(org => org.code === organizationCode);
  const availableLevels = currentOrg?.allowed_levels || [];

  // Smart auto-select: choose level with most active fighters
  useEffect(() => {
    if (rankingData && availableLevels.length > 0 && !selectedLevel) {
      const levelCounts = rankingData.levelCounts;
      
      // Sort levels by fighter count (descending) and pick the one with most data
      const sortedLevels = [...availableLevels].sort((a, b) => 
        (levelCounts[b] || 0) - (levelCounts[a] || 0)
      );
      
      setSelectedLevel(sortedLevels[0] || availableLevels[0]);
    }
  }, [availableLevels, selectedLevel, rankingData]);

  // Reset page when org or level changes
  useEffect(() => {
    setPage(1);
  }, [organizationCode, selectedLevel]);

  const rankings = rankingData?.rankings || [];
  const hasMore = rankingData?.hasMore || false;

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
    <section id="ranking" className="py-6 sm:py-8 md:py-12 lg:py-16 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-80"
        style={{ backgroundImage: 'url(/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png)' }}
      />
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8 sm:mb-10 md:mb-12 animate-slide-up">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 md:mb-6">
            RANKING <span className="text-purple-neon-primary">{currentOrg?.short_name || 'OFICIAL'}</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {currentOrg?.description || 'Clasificación oficial de peleadores'}
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-10 md:mb-12">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="bg-black/60 border-purple-neon-primary/30 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <EnhancedSkeleton className="h-10 w-10 mx-auto mb-2 rounded-full" />
                  <EnhancedSkeleton className="h-8 w-16 mx-auto mb-2" />
                  <EnhancedSkeleton className="h-4 w-24 mx-auto" />
                </CardContent>
              </Card>
            ))
          ) : (
            estadisticas.map((stat, index) => (
              <Card key={index} className="bg-black/60 border-purple-neon-primary/30 backdrop-blur-sm text-center group hover:scale-105 transition-all duration-300 touch-manipulation">
                <CardContent className="p-4 sm:p-6">
                  <stat.Icon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-purple-neon-primary" />
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-neon-primary mb-2 group-hover:animate-pulse-purple-neon">
                    {stat.numero}
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm md:text-base">
                    {stat.descripcion}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Top Peleadores con Infinite Scroll */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white mb-4 sm:mb-6">
            Top Peleadores <span className="text-purple-neon-primary">{currentOrg?.discipline || ''}</span>
          </h3>
          
          {/* Tabs de nivel */}
          {availableLevels.length > 0 && (
            <div className="flex justify-center mb-6">
              <Tabs value={selectedLevel} onValueChange={setSelectedLevel}>
                <TabsList className="bg-black/60 border border-purple-neon-primary/30">
                  {availableLevels.map(level => (
                    <TabsTrigger 
                      key={level} 
                      value={level}
                      className="data-[state=active]:bg-purple-neon-primary data-[state=active]:text-black"
                    >
                      {level === 'Profesional' ? 'Pro' : level === 'Semi-profesional' ? 'Semi' : 'Amateur'}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
          
          {isLoading && page === 1 ? (
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
              <div className="space-y-3 sm:space-y-4">
                {rankings.map((ranking, index) => {
                  const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
                  const rankColor = index < 3 ? rankColors[index] : 'text-purple-neon-primary';
                  
                  // Get record based on discipline
                  const wins = rankingData?.discipline === 'MMA' 
                    ? ranking.fighter.mma_record_wins 
                    : ranking.fighter.boxeo_record_wins;
                  const losses = rankingData?.discipline === 'MMA'
                    ? ranking.fighter.mma_record_losses
                    : ranking.fighter.boxeo_record_losses;
                  const draws = rankingData?.discipline === 'MMA'
                    ? ranking.fighter.mma_record_draws
                    : ranking.fighter.boxeo_record_draws;
                  
                  return (
                  <Card 
                    key={ranking.id} 
                    className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 cursor-pointer touch-manipulation group"
                    onClick={() => navigate(`/fighter/${ranking.fighter_id}`)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-4">
                        {/* Ranking Position */}
                        <div className={`text-2xl sm:text-3xl font-bold ${rankColor} min-w-[40px] text-center`}>
                          {index < 3 ? <Trophy className="h-6 w-6 sm:h-8 sm:w-8 mx-auto" /> : `#${index + 1}`}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-purple-neon-primary/50">
                          <AvatarImage src={ranking.fighter.avatar_url || undefined} />
                          <AvatarFallback className="bg-purple-neon-primary/20 text-white">
                            {ranking.fighter.first_name[0]}{ranking.fighter.last_name[0]}
                          </AvatarFallback>
                        </Avatar>

                        {/* Fighter Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-neon-primary transition-colors truncate">
                              {ranking.fighter.first_name} {ranking.fighter.last_name}
                            </h4>
                            {ranking.fighter.nickname && (
                              <span className="text-xs text-gray-400 italic truncate">"{ranking.fighter.nickname}"</span>
                            )}
                            {ranking.is_champion && (
                              <Badge className="bg-yellow-500 text-yellow-950 text-[10px] flex items-center gap-0.5">
                                <Crown className="h-3 w-3" /> CAMPEÓN
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs border-purple-neon-primary/50 text-purple-neon-primary">
                              {ranking.weight_class}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {ranking.level}
                            </Badge>
                            {/* Fighter Record */}
                            <span className="text-xs font-mono">
                              <span className="text-green-400">{wins || 0}</span>
                              <span className="text-gray-500">-</span>
                              <span className="text-red-400">{losses || 0}</span>
                              <span className="text-gray-500">-</span>
                              <span className="text-gray-400">{draws || 0}</span>
                            </span>
                          </div>
                        </div>

                        {/* Puntos de Ranking */}
                        <div className="text-right min-w-[70px]">
                          <div className="text-base sm:text-lg font-bold text-purple-neon-primary">
                            {ranking.points}
                          </div>
                          <div className="text-xs text-gray-400">
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
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No hay suficientes peleadores con el mínimo de peleas requeridas</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/fighters')}
            className="bg-purple-neon-primary hover:bg-purple-neon-secondary text-black font-bold px-6 sm:px-8 py-4 text-base sm:text-lg animate-glow-neon min-h-[48px] touch-manipulation"
          >
            Ver Todos los Peleadores
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Ranking;