import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDisciplineContext } from '@/contexts/DisciplineContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Search, User, Medal, Filter, Edit, Crown, UserPlus } from 'lucide-react';
import { useRankingOrganizations } from '@/hooks/useRankingOrganizations';
import { useOrganizationRanking } from '@/hooks/useOrganizationRanking';
import { PointAdjustmentModal } from '@/components/admin/PointAdjustmentModal';
import { EnrollFighterModal } from '@/components/admin/EnrollFighterModal';
import { getWeightClassLabel } from '@/lib/constants/disciplines';
import { useRealtimeFighterUpdates, useRealtimeRankingUpdates } from '@/hooks/useRealtimeFighterUpdates';

export default function RankingsManagement() {
  const { data: organizations, isLoading: loadingOrgs } = useRankingOrganizations();
  const disciplineCtx = useDisciplineContext();
  const selectedDiscipline = disciplineCtx?.discipline ?? 'MMA';
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedWeightClass, setSelectedWeightClass] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustmentModal, setAdjustmentModal] = useState<{
    open: boolean;
    rankingId: string;
    fighterName: string;
    currentPoints: number;
  } | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  // Realtime subscriptions for database changes  
  useRealtimeFighterUpdates();
  useRealtimeRankingUpdates();

  // Custom window events removed — React Query + Supabase Realtime handle sync

  const { data: rankingData, isLoading: loadingRanking } = useOrganizationRanking(
    selectedOrg,
    selectedLevel !== 'all' ? selectedLevel : undefined,
    selectedWeightClass !== 'all' ? selectedWeightClass : undefined,
    undefined, // gender filter not used in admin
    1,
    100
  );

  // Smart auto-select: choose level with most active fighters (avoid empty states)
  useEffect(() => {
    if (rankingData && rankingData.levels.length > 0 && selectedLevel === 'all') {
      const levelCounts = rankingData.levelCounts;
      
      // Sort levels by fighter count (descending) and pick the one with most data
      const sortedLevels = [...rankingData.levels].sort((a, b) => 
        (levelCounts[b] || 0) - (levelCounts[a] || 0)
      );
      
      if (sortedLevels[0]) {
        setSelectedLevel(sortedLevels[0]);
      }
    }
  }, [rankingData, selectedLevel]);

  const currentOrgs = organizations?.filter(org => org.discipline === selectedDiscipline) || [];

  // Auto-select first org when discipline changes or on mount
  useEffect(() => {
    if (currentOrgs.length > 0 && !currentOrgs.find(o => o.code === selectedOrg)) {
      setSelectedOrg(currentOrgs[0].code);
    }
  }, [currentOrgs, selectedOrg]);

  const currentOrg = currentOrgs.find(o => o.code === selectedOrg);

  const filteredRankings = useMemo(() => {
    if (!rankingData?.rankings) return [];
    return rankingData.rankings.filter(r => 
      `${r.fighter.first_name} ${r.fighter.last_name} ${r.fighter.nickname || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [rankingData?.rankings, searchTerm]);

  // handleDisciplineChange removed — discipline comes from context

  const openAdjustmentModal = (rankingId: string, fighterName: string, currentPoints: number) => {
    setAdjustmentModal({ open: true, rankingId, fighterName, currentPoints });
  };

  const loading = loadingOrgs || loadingRanking;

  if (loading && !rankingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Gestión de Rankings</h1>
            <p className="text-muted-foreground">Cargando rankings...</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Gestión de Rankings</h1>
          <p className="text-muted-foreground">
            Administra los rankings por disciplina y organización
          </p>
        </div>
      </div>

      <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Organización</CardTitle>
              <CardDescription>
                Selecciona la liga o federación para ver su ranking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentOrgs.map((org) => (
                  <Button
                    key={org.code}
                    variant={selectedOrg === org.code ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedOrg(org.code)}
                    className="min-h-[44px] touch-manipulation"
                  >
                    <div className="flex flex-col items-start">
                      <span>{org.short_name}</span>
                      <span className="text-[10px] opacity-70">
                        {org.allowed_levels.map(l => 
                          l === 'Profesional' ? 'Pro' : l === 'Semi-profesional' ? 'Semi' : 'Am'
                        ).join(' · ')}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar peleador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedWeightClass} onValueChange={setSelectedWeightClass}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {(rankingData?.weightClasses || []).map(wc => (
                      <SelectItem key={wc} value={wc}>
                        {getWeightClassLabel(wc)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    {(rankingData?.levels || []).map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                <Filter className="inline h-4 w-4 mr-1" />
                Mostrando {filteredRankings.length} peleadores en ranking
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Ranking {currentOrg?.short_name || selectedOrg}
                </CardTitle>
                <Button size="sm" onClick={() => setEnrollModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Peleador
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRankings.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No hay peleadores</p>
                  <p className="text-muted-foreground">
                    No se encontraron peleadores en este ranking
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Peleador</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Nivel</TableHead>
                        <TableHead className="text-center">Pts</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRankings.map((ranking, index) => (
                        <TableRow key={ranking.id}>
                          <TableCell>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold relative ${
                              index === 0 ? 'bg-fighter-warning text-background' :
                              index === 1 ? 'bg-muted-foreground text-background' :
                              index === 2 ? 'bg-fighter-warning/70 text-background' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {index + 1}
                              {ranking.is_champion && (
                                <Crown className="absolute -top-2 -right-2 h-4 w-4 text-fighter-warning" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <OptimizedImage
                                src={ranking.fighter.avatar_url || ''}
                                alt={`${ranking.fighter.first_name} ${ranking.fighter.last_name}`}
                                className="w-10 h-10 rounded-full object-cover border"
                                fallbackIcon={
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                }
                              />
                              <div>
                                <p className="font-medium">
                                  {ranking.fighter.first_name} {ranking.fighter.last_name}
                                </p>
                                {ranking.fighter.nickname && (
                                  <p className="text-xs text-muted-foreground">"{ranking.fighter.nickname}"</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {getWeightClassLabel(ranking.weight_class)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {ranking.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-primary text-lg">{ranking.points}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openAdjustmentModal(
                                ranking.id,
                                `${ranking.fighter.first_name} ${ranking.fighter.last_name}`,
                                ranking.points
                              )}
                              className="h-8 px-2"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Ajustar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {adjustmentModal && (
        <PointAdjustmentModal
          open={adjustmentModal.open}
          onOpenChange={(open) => !open && setAdjustmentModal(null)}
          rankingId={adjustmentModal.rankingId}
          fighterName={adjustmentModal.fighterName}
          currentPoints={adjustmentModal.currentPoints}
          organizationCode={selectedOrg}
        />
      )}

      {currentOrg && (
        <EnrollFighterModal
          open={enrollModalOpen}
          onClose={() => setEnrollModalOpen(false)}
          organization={currentOrg}
        />
      )}
    </div>
  );
}