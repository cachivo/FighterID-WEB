import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Phone, Pencil, Trash2, Building2 } from 'lucide-react';
import { CoachEditModal } from './CoachEditModal';
import { DeleteCoachDialog } from './DeleteCoachDialog';
import type { Coach } from '@/types/gyms';

interface AdminCoachCardProps {
  coach: Coach;
}

export function AdminCoachCard({ coach }: AdminCoachCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fullName = [coach.nombre, coach.apellidos].filter(Boolean).join(' ');
  const initials = `${coach.nombre?.charAt(0) || ''}${coach.apellidos?.charAt(0) || ''}`.toUpperCase();

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={coach.avatar_url || undefined} alt={fullName} />
              <AvatarFallback className="text-lg">{initials || 'E'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{fullName}</h3>
              
              {coach.gym && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {coach.gym.nombre}
                </p>
              )}
              
              {(coach.ciudad || coach.pais) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[coach.ciudad, coach.pais].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {coach.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {coach.bio}
            </p>
          )}

          {coach.especialidades && coach.especialidades.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {coach.especialidades.slice(0, 4).map((esp, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {esp}
                </Badge>
              ))}
              {coach.especialidades.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{coach.especialidades.length - 4}
                </Badge>
              )}
            </div>
          )}

          {coach.telefono && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {coach.telefono}
            </p>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setShowEditModal(true)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Editar
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

      <CoachEditModal 
        coach={coach} 
        open={showEditModal} 
        onOpenChange={setShowEditModal} 
      />
      
      <DeleteCoachDialog 
        coach={coach} 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
      />
    </>
  );
}
