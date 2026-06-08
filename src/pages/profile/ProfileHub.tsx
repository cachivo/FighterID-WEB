import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserModules, type ModuleStatus } from '@/hooks/useUserModules';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Building2, Scale, Shield, ArrowRight, CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';
import { PageSkeleton } from '@/components/ui/page-skeleton';

interface ModuleCard {
  key: string;
  label: string;
  description: string;
  icon: typeof Dumbbell;
  status: ModuleStatus;
  path: string;
}

export default function ProfileHub() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRole();
  const { modules, loading: modulesLoading } = useUserModules();

  const cards = useMemo<ModuleCard[]>(() => {
    const fighter = modules.fighter;
    const trainer = modules.trainer;
    const gymOwner = modules.gymOwner;
    const judge = modules.judge;

    return [
      {
        key: 'fighter',
        label: 'Peleador',
        description: 'Obtén tu Fighter ID profesional',
        icon: Dumbbell,
        status: fighter.status,
        path:
          fighter.status === 'active' ? '/license/dashboard'
          : fighter.status === 'pending' ? '/license/pending'
          : fighter.status === 'suspended' ? '/license/suspended'
          : '/license/onboarding',
      },
      {
        key: 'trainer',
        label: 'Entrenador / Coach',
        description: 'Únete a un gimnasio y gestiona tus peleadores',
        icon: Users,
        status: trainer.status,
        path: trainer.status === 'active' && trainer.gymId
          ? `/gym/${trainer.gymId}/dashboard`
          : '/trainer/onboarding',
      },
      {
        key: 'gym',
        label: 'Gimnasio',
        description: 'Registra y gestiona tu gimnasio',
        icon: Building2,
        status: gymOwner.status,
        path: gymOwner.status === 'active' && gymOwner.gymId
          ? `/gym/${gymOwner.gymId}/dashboard`
          : '/gym/onboarding',
      },
      {
        key: 'judge',
        label: 'Juez / Oficial',
        description: 'Accede como oficial certificado',
        icon: Scale,
        status: judge.status,
        path: judge.status !== 'none' ? '/' : '/judge/onboarding',
      },
    ];
  }, [modules]);

  if (authLoading || rolesLoading || modulesLoading) {
    return <PageSkeleton variant="hub" />;
  }

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  if (isAdmin && cards.every((m) => m.status === 'none')) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  const statusBadge = (status: ModuleStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-fighter-success/20 text-fighter-success border-fighter-success/30"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>;
      case 'pending':
        return <Badge className="bg-fighter-warning/20 text-fighter-warning border-fighter-warning/30"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'suspended':
        return <Badge className="bg-fighter-danger/20 text-fighter-danger border-fighter-danger/30"><AlertCircle className="h-3 w-3 mr-1" />Suspendido</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Sin solicitar</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <img src={fighterIdLogo} alt="Fighter ID" className="w-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Hub de Módulos</h1>
          <p className="text-muted-foreground mt-1">Selecciona o gestiona tus módulos activos</p>
        </div>

        <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
          ← Volver al Inicio
        </Button>

        <div className="space-y-3">
          {cards.map((mod) => (
            <Card
              key={mod.key}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(mod.path)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full p-2.5 bg-primary/10">
                  <mod.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{mod.label}</span>
                    {statusBadge(mod.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{mod.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>

        {isAdmin && (
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors border-primary/20"
            onClick={() => navigate('/admin/dashboard')}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full p-2.5 bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-foreground">Panel de Administración</span>
                <p className="text-sm text-muted-foreground">Acceso al panel admin</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
