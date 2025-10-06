import { useState } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, UserCog, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user';

interface UserRoleData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: AppRole[];
  created_at: string;
}

interface RoleEditDialogProps {
  user: UserRoleData;
  currentUserId: string;
  onRolesUpdated: () => void;
}

function RoleEditDialog({ user, currentUserId, onRolesUpdated }: RoleEditDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(user.roles);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const isCurrentUser = user.id === currentUserId;
  const isRemovingOwnAdmin = isCurrentUser && user.roles.includes('admin') && !selectedRoles.includes('admin');

  const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; description: string }> = {
    admin: {
      label: 'Administrador',
      icon: Shield,
      description: 'Acceso completo al sistema'
    },
    moderator: {
      label: 'Moderador',
      icon: UserCog,
      description: 'Gestión de contenido y usuarios'
    },
    user: {
      label: 'Usuario',
      icon: User,
      description: 'Acceso estándar'
    }
  };

  const handleRoleToggle = (role: AppRole, checked: boolean) => {
    if (checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    }
  };

  const handleSave = async () => {
    if (isRemovingOwnAdmin) {
      toast.error('No puedes remover tu propio rol de administrador');
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error('El usuario debe tener al menos un rol');
      return;
    }

    setIsLoading(true);
    try {
      // Get current user roles to compare
      const currentRoles = new Set(user.roles);
      const newRoles = new Set(selectedRoles);

      // Roles to add
      const rolesToAdd = selectedRoles.filter(r => !currentRoles.has(r));
      // Roles to remove
      const rolesToRemove = user.roles.filter(r => !newRoles.has(r));

      // Add new roles
      for (const role of rolesToAdd) {
        const { error } = await supabase.rpc('assign_user_role', {
          p_user_id: user.id,
          p_role: role
        });
        if (error) throw error;
      }

      // Remove roles
      for (const role of rolesToRemove) {
        const { error } = await supabase.rpc('remove_user_role', {
          p_user_id: user.id,
          p_role: role
        });
        if (error) throw error;
      }

      toast.success('Roles actualizados exitosamente');
      setOpen(false);
      onRolesUpdated();
    } catch (error) {
      console.error('Error updating roles:', error);
      toast.error('Error al actualizar roles');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog className="w-4 h-4 mr-2" />
          Editar Roles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestionar Roles de Usuario</DialogTitle>
          <DialogDescription>
            {user.first_name} {user.last_name} ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {(Object.keys(roleConfig) as AppRole[]).map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;
            const isChecked = selectedRoles.includes(role);
            const isAdminAndCurrentUser = role === 'admin' && isCurrentUser && user.roles.includes('admin');

            return (
              <div key={role} className="flex items-start space-x-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  id={`role-${role}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleRoleToggle(role, checked as boolean)}
                  disabled={isAdminAndCurrentUser}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`role-${role}`}
                    className="flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.description}
                  </p>
                  {isAdminAndCurrentUser && (
                    <p className="text-xs text-amber-500 mt-1">
                      No puedes remover tu propio rol de administrador
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isRemovingOwnAdmin}>
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function UserRoles() {
  const { users, loading, refetch } = useUserRoles();
  const { user: currentUser } = useAuth();

  const getRoleBadge = (role: AppRole) => {
    const config: Record<AppRole, { variant: "default" | "secondary" | "outline"; icon: typeof Shield }> = {
      admin: { variant: "default", icon: Shield },
      moderator: { variant: "secondary", icon: UserCog },
      user: { variant: "outline", icon: User }
    };

    const { variant, icon: Icon } = config[role];
    return (
      <Badge key={role} variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Roles</h1>
        <p className="text-muted-foreground">
          Administra los roles y permisos de usuarios del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Total de usuarios: {users.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {user.first_name} {user.last_name}
                    </h3>
                    {user.id === currentUser?.id && (
                      <Badge variant="outline" className="text-xs">Tú</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    {user.roles.length > 0 ? (
                      user.roles.map(role => getRoleBadge(role))
                    ) : (
                      <Badge variant="outline">Sin roles</Badge>
                    )}
                  </div>
                </div>

                <RoleEditDialog
                  user={user}
                  currentUserId={currentUser?.id || ''}
                  onRolesUpdated={refetch}
                />
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron usuarios
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
