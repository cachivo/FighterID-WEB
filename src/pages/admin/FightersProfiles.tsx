import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDiscipline } from '@/contexts/DisciplineContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Edit, User, Trash2, Eye, Plus, AlertCircle, ChevronLeft, ChevronRight, Building } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { FighterEditModal } from '@/components/admin/FighterEditModal';
import { DeleteFighterDialog } from '@/components/admin/DeleteFighterDialog';
import { FighterDetailModal } from '@/components/admin/FighterDetailModal';
import { useAdminFighters, AdminFighterProfile } from '@/hooks/useAdminFighters';
import { FighterProfile } from '@/hooks/useFighterProfiles';
import { useRealtimeFighterUpdates } from '@/hooks/useRealtimeFighterUpdates';
import { useGyms } from '@/hooks/useGyms';
import { useAddMembership } from '@/hooks/gyms';
import { WEIGHT_CLASSES, getWeightClassLabel } from '@/lib/constants/disciplines';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

// Helper function to get correct record based on discipline
const getRecordDisplay = (fighter: AdminFighterProfile) => {
  if (fighter.discipline === 'MMA') {
    return `${fighter.mma_record_wins || 0}-${fighter.mma_record_losses || 0}-${fighter.mma_record_draws || 0}`;
  } else if (fighter.discipline === 'Boxeo') {
    return `${fighter.boxeo_record_wins || 0}-${fighter.boxeo_record_losses || 0}-${fighter.boxeo_record_draws || 0}`;
  }
  // Fallback to legacy
  return `${fighter.record_wins}-${fighter.record_losses}-${fighter.record_draws}`;
};

export default function FightersProfiles() {
  const navigate = useNavigate();
  const discipline = useDiscipline();
  const { fighters, loading, error, fetchFighters } = useAdminFighters(discipline);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeightClass, setSelectedWeightClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [showIncomplete, setShowIncomplete] = useState(false);
   const [selectedGymFilter, setSelectedGymFilter] = useState<string>('all');
   const [page, setPage] = useState(1);
  const [editingFighter, setEditingFighter] = useState<AdminFighterProfile | null>(null);
  const [deletingFighter, setDeletingFighter] = useState<AdminFighterProfile | null>(null);
  const [viewingFighter, setViewingFighter] = useState<string | null>(null);
  const [quickAssignFighter, setQuickAssignFighter] = useState<AdminFighterProfile | null>(null);
  const [quickAssignGymId, setQuickAssignGymId] = useState<string>('');

  const { data: gyms } = useGyms();
  const addMembership = useAddMembership();

  // Get fighter IDs with active gym memberships
  const { data: activeMemberships } = useQuery({
    queryKey: ['active-gym-memberships-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fighter_gym_memberships')
        .select('fighter_id, gym_id, gyms(nombre)')
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  // Enable realtime updates for all fighters (global subscription)
  useRealtimeFighterUpdates();

  // Custom window events removed — React Query + Supabase Realtime handle sync

  // Filtrar y ordenar peleadores
   const filteredFighters = useMemo(() => fighters
    .filter(fighter => {
      const matchesSearch = `${fighter.first_name} ${fighter.last_name} ${fighter.nickname || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesWeight = selectedWeightClass === 'all' || fighter.weight_class === selectedWeightClass;
       const matchesDiscipline = fighter.discipline === selectedDiscipline;
      const completionScore = (fighter as any).completion_score || 0;
      const matchesCompletion = !showIncomplete || completionScore < 70;
      
      // Gym filter
      let matchesGym = true;
      if (selectedGymFilter === 'none') {
        matchesGym = !(activeMemberships || []).some(m => m.fighter_id === fighter.id);
      } else if (selectedGymFilter !== 'all') {
        matchesGym = (activeMemberships || []).some(m => m.fighter_id === fighter.id && m.gym_id === selectedGymFilter);
      }
      
       return matchesSearch && matchesWeight && matchesDiscipline && matchesCompletion && matchesGym;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'weight':
          return (a.weight_kg || 0) - (b.weight_kg || 0);
        case 'record':
          return (b.record_wins - b.record_losses) - (a.record_wins - a.record_losses);
        case 'completion':
          return ((b as any).completion_score || 0) - ((a as any).completion_score || 0);
        default:
          return a.first_name.localeCompare(b.first_name);
      }
     }), [fighters, searchTerm, selectedWeightClass, selectedDiscipline, selectedGymFilter, activeMemberships, showIncomplete, sortBy]);

   // Pagination
   const totalPages = Math.ceil(filteredFighters.length / PAGE_SIZE);
   const paginatedFighters = useMemo(() => 
     filteredFighters.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
     [filteredFighters, page]
   );

   // Reset page when filters change
   const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
     setter(value);
     setPage(1);
   };
  
  const incompleteCount = fighters.filter(f => ((f as any).completion_score || 0) < 70).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Gestión de Peleadores</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-muted rounded-full mb-4 mx-auto"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">Gestión de Perfiles de Peleadores</h1>
          <p className="text-muted-foreground text-sm">
            Administra los perfiles de todos los peleadores registrados
          </p>
        </div>
        <Button onClick={() => navigate('/admin/fighters-profiles/invite')} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Invitar Peleador
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredFighters.length} de {fighters.length} peleadores
            </p>
            <Button
              variant={showIncomplete ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowIncomplete(!showIncomplete)}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Perfiles Incompletos ({incompleteCount})
            </Button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar peleadores..."
                  value={searchTerm}
                   onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
             <Select value={selectedWeightClass} onValueChange={handleFilterChange(setSelectedWeightClass)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {WEIGHT_CLASSES.map(wc => (
                  <SelectItem key={wc.value} value={wc.value}>
                    {wc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             <Select value={selectedGymFilter} onValueChange={handleFilterChange(setSelectedGymFilter)}>
               <SelectTrigger className="w-full md:w-44">
                 <SelectValue placeholder="Gimnasio" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos</SelectItem>
                 <SelectItem value="none">Sin gimnasio</SelectItem>
                 {(gyms || []).map(g => (
                   <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nombre</SelectItem>
                <SelectItem value="weight">Peso</SelectItem>
                <SelectItem value="record">Récord</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
         Mostrando {paginatedFighters.length} de {filteredFighters.length} peleadores (página {page} de {totalPages || 1})
      </div>

      {/* Fighters Grid */}
       {paginatedFighters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No se encontraron peleadores</p>
            <p className="text-muted-foreground">
              Ajusta los filtros de búsqueda para encontrar peleadores
            </p>
          </CardContent>
        </Card>
      ) : (
       <div className="grid grid-cols-1 gap-3">
           {paginatedFighters.map((fighter) => (
            <Card key={fighter.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 px-3 pt-3">
                {/* Row 1: Avatar + Name + Nickname */}
                <div className="flex items-center gap-3">
                  <OptimizedImage
                    src={fighter.avatar_url || ''}
                    alt={`${fighter.first_name} ${fighter.last_name}`}
                    className="w-14 h-14 rounded-full border-2 border-primary/30 object-cover aspect-square flex-shrink-0"
                    fallbackIcon={
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-primary/30">
                        <User className="h-7 w-7 text-muted-foreground" />
                      </div>
                    }
                    priority={false}
                  />
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-bold leading-tight break-words font-barlow-condensed uppercase">
                      {fighter.first_name} {fighter.last_name}
                    </CardTitle>
                    {fighter.nickname && (
                      <p className="text-sm text-primary font-medium break-words mt-0.5">
                        "{fighter.nickname}"
                      </p>
                    )}
                  </div>
                </div>
                {/* Row 2: Action buttons — full width, evenly spaced */}
                <div className="flex justify-end gap-1 mt-2 border-t border-border/50 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickAssignFighter(fighter);
                      setQuickAssignGymId('');
                    }}
                    className="h-9 w-9 min-h-[44px] min-w-[44px] touch-manipulation"
                    title="Asignar gimnasio"
                  >
                    <Building className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingFighter(fighter.id);
                    }}
                    className="h-9 w-9 min-h-[44px] min-w-[44px] touch-manipulation"
                    title="Ver información completa"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingFighter(fighter)}
                    className="h-9 w-9 min-h-[44px] min-w-[44px] touch-manipulation"
                    title="Editar peleador"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingFighter(fighter)}
                    className="h-9 w-9 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive touch-manipulation"
                    title="Eliminar peleador"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <div className="space-y-2">
                  {/* Completion Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Completitud:</span>
                      <span className="font-medium">{(fighter as any).completion_score || 0}%</span>
                    </div>
                    <Progress value={(fighter as any).completion_score || 0} className="h-1.5" />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Récord:</span>
                    <Badge variant="secondary">
                      {getRecordDisplay(fighter)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Peso:</span>
                    <span className="text-sm font-medium">{getWeightClassLabel(fighter.weight_class)}</span>
                  </div>
                  
                  {fighter.discipline && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Disciplina:</span>
                      <Badge variant="outline" className="text-xs">
                        {fighter.discipline.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  
                  {fighter.country && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">País:</span>
                      <span className="text-sm">{fighter.country}</span>
                    </div>
                  )}
                  
                  {/* Gimnasio */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm text-muted-foreground flex-shrink-0">Gimnasio:</span>
                    {(() => {
                      const membership = (activeMemberships || []).find(m => m.fighter_id === fighter.id);
                      const gymName = (membership?.gyms as any)?.nombre;
                      return gymName ? (
                        <span className="text-sm font-medium text-right break-words">{gymName}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Independiente</span>
                      );
                    })()}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <Badge variant={fighter.active ? "default" : "secondary"}>
                      {fighter.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

       {/* Pagination Controls */}
       {totalPages > 1 && (
         <div className="flex items-center justify-center gap-2 pt-4">
           <Button
             variant="outline"
             size="sm"
             onClick={() => setPage(p => Math.max(1, p - 1))}
             disabled={page === 1}
           >
             <ChevronLeft className="h-4 w-4" />
             Anterior
           </Button>
           <span className="text-sm text-muted-foreground px-4">
             Página {page} de {totalPages}
           </span>
           <Button
             variant="outline"
             size="sm"
             onClick={() => setPage(p => Math.min(totalPages, p + 1))}
             disabled={page === totalPages}
           >
             Siguiente
             <ChevronRight className="h-4 w-4" />
           </Button>
         </div>
       )}

      {/* Detail Modal */}
      <FighterDetailModal
        fighterId={viewingFighter}
        open={!!viewingFighter}
        onClose={() => setViewingFighter(null)}
      />

      {/* Edit Modal */}
      {editingFighter && (
        <FighterEditModal
          fighter={editingFighter as FighterProfile}
          open={!!editingFighter}
          onClose={() => setEditingFighter(null)}
        />
      )}

      {/* Delete Dialog */}
      <DeleteFighterDialog
        fighter={deletingFighter as FighterProfile}
        isOpen={!!deletingFighter}
        onClose={() => setDeletingFighter(null)}
        onConfirm={async () => {
          setDeletingFighter(null);
          // Force immediate refresh after deletion
          await fetchFighters();
        }}
      />

      {/* Quick Assign Gym Dialog */}
      <Dialog open={!!quickAssignFighter} onOpenChange={(open) => { if (!open) setQuickAssignFighter(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Asignar Gimnasio
            </DialogTitle>
          </DialogHeader>
          {quickAssignFighter && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Asignar <span className="font-medium text-foreground">{quickAssignFighter.first_name} {quickAssignFighter.last_name}</span> a un gimnasio:
              </p>
              <Select value={quickAssignGymId} onValueChange={setQuickAssignGymId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar gimnasio" />
                </SelectTrigger>
                <SelectContent>
                  {(gyms || []).map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setQuickAssignFighter(null)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={!quickAssignGymId || addMembership.isPending}
                  onClick={async () => {
                    if (!quickAssignGymId) return;
                    try {
                      await addMembership.mutateAsync({
                        fighterId: quickAssignFighter.id,
                        gymId: quickAssignGymId,
                      });
                      setQuickAssignFighter(null);
                    } catch {}
                  }}
                >
                  {addMembership.isPending ? 'Asignando...' : 'Asignar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}