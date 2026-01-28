import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteCoach } from '@/hooks/useCoaches';
import type { Coach } from '@/types/gyms';

interface DeleteCoachDialogProps {
  coach: Coach;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCoachDialog({ coach, open, onOpenChange }: DeleteCoachDialogProps) {
  const deleteCoach = useDeleteCoach();

  const handleDelete = async () => {
    await deleteCoach.mutateAsync(coach.id);
    onOpenChange(false);
  };

  const fullName = [coach.nombre, coach.apellidos].filter(Boolean).join(' ');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar entrenador?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción desactivará al entrenador <strong>"{fullName}"</strong> y 
            ya no será visible en la plataforma. Los datos se conservarán y podrán 
            recuperarse posteriormente si es necesario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteCoach.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteCoach.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
