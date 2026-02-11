import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, ArrowLeft, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { useFighterSearch, type FighterSearchResult } from '@/hooks/gyms/useFighterSearch';
import { useAddMembership } from '@/hooks/gyms';
import { useGymStaffRole } from '@/hooks/gyms/useMyGymStaff';
import { useGymDashboard } from '@/hooks/gyms/useGymDashboard';
import { ENABLED_DISCIPLINES, FIGHTER_LEVELS, WEIGHT_CLASSES } from '@/lib/constants/disciplines';
import Header from '@/components/Header';

export default function GymAddFighter() {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const { data: staffRole, isLoading: loadingRole } = useGymStaffRole(gymId || '');
  const { data: gymData } = useGymDashboard(gymId || '');
  const addMembership = useAddMembership();
  

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('__none__');
  const [filterLevel, setFilterLevel] = useState('__none__');
  const [filterWeight, setFilterWeight] = useState('__none__');
  const [addingFighterId, setAddingFighterId] = useState<string | null>(null);

  // Debounce search
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
    gymId: gymId,
    limit: 30,
    enabled: !!gymId,
  });

  const activeFilters = [filterDiscipline, filterLevel, filterWeight].filter(f => f !== '__none__').length;

  const selectedFighterData = addingFighterId ? fighters.find(f => f.id === addingFighterId) : null;
  const alreadyInThisGym = selectedFighterData?.active_gym_id === gymId;

  const confirmAdd = async () => {
    if (!gymId || !addingFighterId || !selectedFighterData || alreadyInThisGym) return;

    addMembership.mutate({
      fighterId: addingFighterId,
      gymId,
    }, {
      onSuccess: () => setAddingFighterId(null),
    });
  };

  if (loadingRole) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 p-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!staffRole?.canManageFighters) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 p-4 text-center text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No tienes permisos para agregar peleadores</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
        </div>
      </div>
    );
  }

  const isMutating = addMembership.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 pb-20">
        {/* Top bar */}
        <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">Agregar Peleador</h1>
              {gymData?.gym && <p className="text-xs text-muted-foreground truncate">{gymData.gym.nombre}</p>}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar peleador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            <select
              value={filterDiscipline}
              onChange={e => setFilterDiscipline(e.target.value)}
              className="h-8 px-3 rounded-full border bg-card text-xs font-medium appearance-none cursor-pointer min-w-fit"
            >
              <option value="__none__">Disciplina</option>
              {ENABLED_DISCIPLINES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="h-8 px-3 rounded-full border bg-card text-xs font-medium appearance-none cursor-pointer min-w-fit"
            >
              <option value="__none__">Nivel</option>
              {FIGHTER_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <select
              value={filterWeight}
              onChange={e => setFilterWeight(e.target.value)}
              className="h-8 px-3 rounded-full border bg-card text-xs font-medium appearance-none cursor-pointer min-w-fit"
            >
              <option value="__none__">Peso</option>
              {WEIGHT_CLASSES.map(w => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
            {activeFilters > 0 && (
              <button
                onClick={() => { setFilterDiscipline('__none__'); setFilterLevel('__none__'); setFilterWeight('__none__'); }}
                className="h-8 px-3 rounded-full bg-destructive/10 text-destructive text-xs font-medium whitespace-nowrap"
              >
                Limpiar ({activeFilters})
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="px-4 mt-4 space-y-3">
          {loadingFighters ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : fighters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No se encontraron peleadores</p>
            </div>
          ) : (
            fighters.map(f => {
              const name = [f.first_name, f.last_name].filter(Boolean).join(' ') || 'Sin nombre';
              const record = `${f.mma_record_wins || 0}-${f.mma_record_losses || 0}-${f.mma_record_draws || 0}`;

              return (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={f.avatar_url || undefined} alt={name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {(f.first_name?.[0] || '') + (f.last_name?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{name}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-sm font-mono font-bold">{record}</span>
                      {f.discipline && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">{f.discipline}</Badge>
                      )}
                      {f.level && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">{f.level}</Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="flex-shrink-0 h-10 min-w-[80px] touch-manipulation"
                    onClick={() => setAddingFighterId(f.id)}
                    disabled={isMutating || f.active_gym_id === gymId}
                  >
                    {f.active_gym_id === gymId ? (
                      'Ya vinculado'
                    ) : (
                      <><Plus className="h-4 w-4 mr-1" /> Agregar</>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Confirmation overlay */}
        {addingFighterId && selectedFighterData && !alreadyInThisGym && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-bold mb-2">Confirmar</h3>
              <p className="text-sm text-muted-foreground">
                ¿Agregar a <strong>{selectedFighterData.first_name} {selectedFighterData.last_name}</strong> al gimnasio?
              </p>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setAddingFighterId(null)} disabled={isMutating}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 h-12"
                  onClick={confirmAdd}
                  disabled={isMutating}
                >
                  {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
