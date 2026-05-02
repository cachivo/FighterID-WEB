import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DigitalFighterToken } from '@/components/DigitalFighterToken';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, X } from 'lucide-react';

interface FighterIDModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FighterIDModal({ open, onOpenChange }: FighterIDModalProps) {
  const { user } = useLicenseAuth();
  const { getUserFighterProfile } = useFighterProfiles();
  const [fighterProfile, setFighterProfile] = useState<Awaited<ReturnType<typeof getUserFighterProfile>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      loadFighterProfile();
    }
  }, [open, user]);

  const loadFighterProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profile = await getUserFighterProfile();
      setFighterProfile(profile);
    } catch (err) {
      console.error('Error loading fighter profile:', err);
      setError('Error al cargar el perfil del peleador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 border-gold-500/30 will-change-transform [&>[data-dialog-close]]:text-white [&>[data-dialog-close]]:hover:text-white/80 [&>[data-dialog-close]]:hover:bg-white/10 [&>[data-dialog-close]]:opacity-100">
        <DialogHeader className="relative pb-2 sm:pb-3 lg:pb-4">
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
            Global Fighter ID
          </DialogTitle>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
        </DialogHeader>

        <div className="py-2 sm:py-3 lg:py-4">
          {loading && (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center space-y-3 sm:space-y-4">
                <LoadingSpinner />
                <p className="text-gold-300 text-sm sm:text-base">Cargando tu Fighter ID...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
                <div>
                  <p className="text-red-300 font-medium">Error al cargar el Fighter ID</p>
                  <p className="text-slate-400 text-sm mt-1">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadFighterProfile}
                    className="mt-3 border-gold-400/30 text-gold-300 hover:bg-gold-400/10"
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !fighterProfile && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
                <div>
                  <p className="text-amber-300 font-medium">No tienes un perfil de peleador</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Crea tu perfil primero para ver tu Fighter ID digital
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && fighterProfile && (
            <div className="flex justify-center py-2 sm:py-4 lg:py-6">
              <DigitalFighterToken 
                profile={fighterProfile}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}