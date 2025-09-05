import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Loader2 } from "lucide-react";
import { EnhancedFighterID } from "@/components/EnhancedFighterID";
import { useLicenseAuth } from "@/hooks/useLicenseAuth";
import { useFighterProfiles } from "@/hooks/useFighterProfiles";

interface FighterIDModalProps {
  children: React.ReactNode;
}

export function FighterIDModal({ children }: FighterIDModalProps) {
  const [open, setOpen] = useState(false);
  const { user, hasActiveLicense } = useLicenseAuth();
  const { getUserFighterProfile } = useFighterProfiles();
  const [fighterProfile, setFighterProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpenModal = async () => {
    if (!user || !hasActiveLicense) {
      return;
    }

    setLoading(true);
    setOpen(true);

    try {
      const profile = await getUserFighterProfile();
      setFighterProfile(profile);
    } catch (error) {
      console.error("Error fetching fighter profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <p className="text-muted-foreground">Cargando tu ID digital...</p>
          </div>
        </div>
      );
    }

    if (!hasActiveLicense) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-amber-400/10 rounded-full flex items-center justify-center">
              <Coins className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">ID No Disponible</h3>
              <p className="text-muted-foreground">
                Necesitas una licencia activa para acceder a tu ID digital.
              </p>
            </div>
            <Button
              onClick={() => setOpen(false)}
              className="bg-amber-400 hover:bg-amber-500 text-black"
            >
              Entendido
            </Button>
          </div>
        </div>
      );
    }

    if (!fighterProfile) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Coins className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Error al Cargar</h3>
              <p className="text-muted-foreground">
                No se pudo cargar tu perfil de peleador.
              </p>
            </div>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Cerrar
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <EnhancedFighterID profile={fighterProfile} />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div onClick={handleOpenModal}>
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50 border-amber-200/50">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg shadow-lg">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent font-bold">
              Mi ID Digital
            </span>
            <div className="flex-1" />
            <div className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
              Token Virtual
            </div>
          </DialogTitle>
        </DialogHeader>
        {modalContent()}
      </DialogContent>
    </Dialog>
  );
}