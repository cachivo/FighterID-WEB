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
import { useDeleteGym } from '@/hooks/useGyms';
import type { Gym } from '@/types/gyms';

interface DeleteGymDialogProps {
  gym: Gym;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteGymDialog({ gym, open, onOpenChange }: DeleteGymDialogProps) {
  const deleteGym = useDeleteGym();

  const handleDelete = async () => {
    await deleteGym.mutateAsync(gym.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar gimnasio?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción desactivará el gimnasio <strong>"{gym.nombre}"</strong> y 
            ya no será visible en la plataforma. Los datos se conservarán y podrán 
            recuperarse posteriormente si es necesario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteGym.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteGym.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
