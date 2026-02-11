import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Search, User, Loader2, Check, AlertTriangle, ArrowRightLeft, X } from 'lucide-react';
import { useFighterSearch, type FighterSearchResult } from '@/hooks/gyms/useFighterSearch';
import { useAddMembership, useTransferFighter, useGymStaff } from '@/hooks/gyms';
import { supabase } from '@/integrations/supabase/client';
import { ENABLED_DISCIPLINES, FIGHTER_LEVELS, WEIGHT_CLASSES } from '@/lib/constants/disciplines';

interface AssignFighterToGymModalProps {
  open: boolean;
  onClose: () => void;
  gymId: string;
  gymName: string;
}

export function AssignFighterToGymModal({ open, onClose, gymId, gymName }: AssignFighterToGymModalProps) {
  const addMembership = useAddMembership();
  const transferFighter = useTransferFighter();
  const { data: staff } = useGymStaff(gymId);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<string>('none');
  const [filterDiscipline, setFilterDiscipline] = useState('__none__');
  const [filterLevel, setFilterLevel] = useState('__none__');
  const [filterWeight, setFilterWeight] = useState('__none__');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Server-side search via RPC
  const { data: fighters = [], isLoading: loadingFighters } = useFighterSearch({
    search: debouncedSearch,
    discipline: filterDiscipline,
    level: filterLevel,
    weightClass: filterWeight,
    gymId,
    limit: 30,
    enabled: open,
  });

  // Selected fighter data from results
  const selectedFighterData = fighters.find(f => f.id === selectedFighter);

  // Use active_gym info from the RPC result instead of a separate query
  const alreadyInThisGym = selectedFighterData?.active_gym_id === gymId;
  const hasOtherGym = selectedFighterData?.active_gym_id != null && selectedFighterData.active_gym_id !== gymId;

  const coaches = (staff || []).filter(s => s.role === 'HEAD_COACH' || s.role === 'ASSISTANT_COACH' || s.role === 'OWNER');

  const hasActiveFilters = filterDiscipline !== '__none__' || filterLevel !== '__none__' || filterWeight !== '__none__';

  const handleAssign = async () => {
    if (!selectedFighter || !selectedFighterData) return;
    const coachUserId = selectedCoach !== 'none' ? selectedCoach : undefined;

    if (hasOtherGym) {
      await transferFighter.mutateAsync({
        fighterId: selectedFighter,
        fromGymId: selectedFighterData.active_gym_id!,
        toGymId: gymId,
        coachUserId,
      });
    } else {
      await addMembership.mutateAsync({
        fighterId: selectedFighter,
        gymId,
        coachUserId,
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setSelectedFighter(null);
    setSearch('');
    setDebouncedSearch('');
    setSelectedCoach('none');
    setFilterDiscipline('__none__');
    setFilterLevel('__none__');
    setFilterWeight('__none__');
    onClose();
  };

  const clearFilters = () => {
    setFilterDiscipline('__none__');
    setFilterLevel('__none__');
    setFilterWeight('__none__');
  };

  const isMutating = addMembership.isPending || transferFighter.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Peleador a {gymName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div>
            <Label>Buscar Peleador</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nombre o apodo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Filtros</Label>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                  <X className="h-3 w-3 mr-1" /> Limpiar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todas</SelectItem>
                  {ENABLED_DISCIPLINES.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todos</SelectItem>
                  {FIGHTER_LEVELS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterWeight} onValueChange={setFilterWeight}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Peso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todos</SelectItem>
                  {WEIGHT_CLASSES.map(w => (
                    <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fighter list */}
          <ScrollArea className="h-56 border rounded-lg">
            {loadingFighters ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : fighters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No se encontraron peleadores
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {fighters.map((fighter) => (
                  <div
                    key={fighter.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedFighter === fighter.id
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedFighter(fighter.id)}
                  >
                    <OptimizedImage
                      src={fighter.avatar_url || ''}
                      alt={fighter.first_name}
                      className="w-8 h-8 rounded-full object-cover"
                      fallbackIcon={
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {fighter.first_name} {fighter.last_name}
                      </p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {fighter.nickname && (
                          <span className="text-xs text-muted-foreground">"{fighter.nickname}"</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {fighter.mma_record_wins ?? fighter.record_wins ?? 0}-
                          {fighter.mma_record_losses ?? fighter.record_losses ?? 0}-
                          {fighter.mma_record_draws ?? fighter.record_draws ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {fighter.discipline && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {fighter.discipline}
                        </Badge>
                      )}
                      {fighter.level && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {fighter.level}
                        </Badge>
                      )}
                    </div>
                    {selectedFighter === fighter.id && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Selected fighter info + warnings */}
          {selectedFighterData && (
            <div className="space-y-3">
              {alreadyInThisGym ? (
                <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  Este peleador ya pertenece a {gymName}.
                </div>
              ) : hasOtherGym ? (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Este peleador pertenece a {selectedFighterData.active_gym_name || 'otro gimnasio'}.</p>
                    <p className="text-muted-foreground">Se realizará una transferencia.</p>
                  </div>
                </div>
              ) : null}

              {/* Coach selector */}
              {coaches.length > 0 && !alreadyInThisGym && (
                <div>
                  <Label>Entrenador asignado (opcional)</Label>
                  <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin entrenador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin entrenador</SelectItem>
                      {coaches.map((c) => (
                        <SelectItem key={c.user_id} value={c.user_id}>
                          {c.user?.first_name} {c.user?.last_name} ({c.role.replace('_', ' ')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedFighter || alreadyInThisGym || isMutating}
          >
            {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {hasOtherGym ? (
              <><ArrowRightLeft className="h-4 w-4 mr-1" /> Transferir</>
            ) : (
              'Vincular'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
