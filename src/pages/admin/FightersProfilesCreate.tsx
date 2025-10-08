import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminFighterForm } from '@/components/admin/AdminFighterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FightersProfilesCreate() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/admin/fighters-profiles');
  };

  const handleCancel = () => {
    navigate('/admin/fighters-profiles');
  };

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/fighters-profiles')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserPlus className="h-8 w-8 text-primary" />
            Crear Nuevo Perfil de Peleador
          </h1>
          <p className="text-muted-foreground mt-1">
            Ingresa manualmente la información del nuevo peleador
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Peleador</CardTitle>
          <CardDescription>
            Completa todos los campos obligatorios (*) para crear el perfil.
            Este perfil podrá ser usado posteriormente para emitir una licencia Fighter ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminFighterForm
            mode="create"
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
