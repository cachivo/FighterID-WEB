import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Search, User, Loader2, Check, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useAdminFighters } from '@/hooks/useAdminFighters';
import { useAddMembership, useTransferFighter, useGymStaff } from '@/hooks/gyms';
import { supabase } from '@/integrations/supabase/client';
import { getWeightClassLabel } from '@/lib/constants/disciplines';

interface AssignFighterToGymModalProps {
  open: boolean;
  onClose: () => void;
  gymId: string;
  gymName: string;
}

export function AssignFighterToGymModal({ open, onClose, gymId, gymName }: AssignFighterToGymModalProps) {
  const { fighters, loading: loadingFighters } = useAdminFighters();
  const addMembership = useAddMembership();
  const transferFighter = useTransferFighter();
  const { data: staff } = useGymStaff(gymId);

  const [search, setSearch] = useState('');
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<string>('none');

  // Check if selected fighter already has an active gym
  const { data: existingMembership, isLoading: checkingMembership } = useQuery({
    queryKey: ['gym-membership', selectedFighter],
    queryFn: async () => {
      if (!selectedFighter) return null;
      const { data, error } = await supabase
        .from('fighter_gym_memberships')
        .select('id, gym_id, gyms(id, nombre)')
        .eq('fighter_id', selectedFighter)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedFighter,
  });

  const coaches = useMemo(() => {
    if (!staff) return [];
    return staff.filter(s => s.role === 'HEAD_COACH' || s.role === 'ASSISTANT_COACH' || s.role === 'OWNER');
  }, [staff]);

  const filteredFighters = useMemo(() => {
    if (!search.trim()) return fighters.slice(0, 10);
    const q = search.toLowerCase();
    return fighters.filter(f =>
      `${f.first_name} ${f.last_name} ${f.nickname || ''}`.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [fighters, search]);

  const selectedFighterData = fighters.find(f => f.id === selectedFighter);

  const alreadyInThisGym = existingMembership?.gym_id === gymId;
  const hasOtherGym = existingMembership && existingMembership.gym_id !== gymId;

  const handleAssign = async () => {
    if (!selectedFighter) return;
    const coachUserId = selectedCoach !== 'none' ? selectedCoach : undefined;

    if (hasOtherGym) {
      await transferFighter.mutateAsync({
        fighterId: selectedFighter,
        fromGymId: existingMembership.gym_id,
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
    setSelectedCoach('none');
    onClose();
  };

  const isMutating = addMembership.isPending || transferFighter.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
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

          {/* Fighter list */}
          <ScrollArea className="h-48 border rounded-lg">
            {loadingFighters ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFighters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron peleadores
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredFighters.map((fighter) => (
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
                      <p className="font-medium truncate">
                        {fighter.first_name} {fighter.last_name}
                      </p>
                      {fighter.nickname && (
                        <p className="text-xs text-muted-foreground truncate">"{fighter.nickname}"</p>
                      )}
                    </div>
                    {fighter.weight_class && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {getWeightClassLabel(fighter.weight_class)}
                      </Badge>
                    )}
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
              {checkingMembership ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Verificando membresía...
                </div>
              ) : alreadyInThisGym ? (
                <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  Este peleador ya pertenece a {gymName}.
                </div>
              ) : hasOtherGym ? (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Este peleador pertenece a {(existingMembership.gyms as any)?.nombre || 'otro gimnasio'}.</p>
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
            disabled={!selectedFighter || alreadyInThisGym || checkingMembership || isMutating}
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
