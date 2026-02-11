import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Pencil, Trash2, LayoutDashboard, Users, UserPlus, Swords } from 'lucide-react';
import { GymEditModal } from './GymEditModal';
import { DeleteGymDialog } from './DeleteGymDialog';
import { AssignFighterToGymModal } from './AssignFighterToGymModal';
import { supabase } from '@/integrations/supabase/client';
import type { Gym } from '@/types/gyms';

interface AdminGymCardProps {
  gym: Gym;
}

export function AdminGymCard({ gym }: AdminGymCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const navigate = useNavigate();

  const { data: staffCount } = useQuery({
    queryKey: ['gym-staff-count', gym.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('gym_staff')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id)
        .eq('active', true);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 60_000,
  });

  const { data: fighterCount } = useQuery({
    queryKey: ['gym-fighter-count', gym.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fighter_gym_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return count || 0;
    },
    staleTime: 60_000,
  });

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {gym.banner_url && (
          <div className="h-32 overflow-hidden">
            <img src={gym.banner_url} alt={gym.nombre} className="w-full h-full object-cover" />
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            {gym.logo_url ? (
              <img src={gym.logo_url} alt={gym.nombre} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{gym.nombre.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{gym.nombre}</h3>
              {(gym.ciudad || gym.pais) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[gym.ciudad, gym.pais].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {typeof fighterCount === 'number' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Swords className="h-3 w-3" />
                  {fighterCount}
                </Badge>
              )}
              {typeof staffCount === 'number' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {staffCount}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {gym.descripcion && (
            <p className="text-sm text-muted-foreground line-clamp-2">{gym.descripcion}</p>
          )}

          {gym.disciplinas && gym.disciplinas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {gym.disciplinas.slice(0, 4).map((disc, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{disc}</Badge>
              ))}
              {gym.disciplinas.length > 4 && (
                <Badge variant="outline" className="text-xs">+{gym.disciplinas.length - 4}</Badge>
              )}
            </div>
          )}

          {gym.telefono && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {gym.telefono}
            </p>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/gym/${gym.id}/dashboard`)}
            >
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAssignModal(true)}>
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <GymEditModal gym={gym} open={showEditModal} onOpenChange={setShowEditModal} />
      <DeleteGymDialog gym={gym} open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
      <AssignFighterToGymModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        gymId={gym.id}
        gymName={gym.nombre}
      />
    </>
  );
}
