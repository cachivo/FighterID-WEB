import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Building2, Scale, Shield, ArrowRight, CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';
import { PageSkeleton } from '@/components/ui/page-skeleton';

type ModuleStatus = 'none' | 'pending' | 'active' | 'suspended';

interface ModuleInfo {
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
  const { roles, isAdmin, loading: rolesLoading } = useUserRole();
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || rolesLoading || !user) return;

    const checkModules = async () => {
      setLoading(true);

      // Check fighter status
      let fighterStatus: ModuleStatus = 'none';
      const { data: appUser, error: appUserErr } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (appUserErr) console.error('[ProfileHub] Error fetching app_user:', appUserErr);

      if (appUser) {
        const { data: profile } = await supabase
          .from('fighter_profiles')
          .select('id')
          .eq('user_id', appUser.id)
          .maybeSingle();

        if (profile) {
          // Prefer the primary license; fall back to the most recent one so users with
          // an existing application never get pushed back to /license/onboarding.
          const { data: licenses } = await supabase
            .from('fighter_licenses')
            .select('status, is_primary, created_at')
            .eq('fighter_id', profile.id)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1);

          const license = licenses?.[0];
          if (license) {
            fighterStatus = license.status === 'ACTIVE' ? 'active'
              : license.status === 'SUSPENDED' || license.status === 'REVOKED' ? 'suspended'
              : 'pending';
          } else {
            fighterStatus = 'none';
          }
        }
      }

      // Check gym status — gym_staff.user_id references app_user.id, NOT auth.users.id
      let gymStatus: ModuleStatus = 'none';
      let gymStaff: { gym_id: string } | null = null;
      if (appUser?.id) {
        const { data } = await supabase
          .from('gym_staff')
          .select('gym_id')
          .eq('user_id', appUser.id)
          .eq('active', true)
          .maybeSingle();
        gymStaff = data;
        if (gymStaff) gymStatus = 'active';
      }

      // Check judge status — judges.user_id references app_user.id
      let judgeStatus: ModuleStatus = 'none';
      if (appUser?.id) {
        const { data: judge } = await supabase
          .from('judges')
          .select('active')
          .eq('user_id', appUser.id)
          .maybeSingle();
        if (judge) judgeStatus = judge.active ? 'active' : 'pending';
      }

      setModules([
        {
          key: 'fighter',
          label: 'Peleador',
          description: 'Obtén tu Fighter ID profesional',
          icon: Dumbbell,
          status: fighterStatus,
          path: fighterStatus === 'active' ? '/license/dashboard'
            : fighterStatus === 'pending' ? '/license/pending'
            : fighterStatus === 'suspended' ? '/license/suspended'
            : '/license/onboarding',
        },
        {
          key: 'trainer',
          label: 'Entrenador / Coach',
          description: 'Únete a un gimnasio y gestiona tus peleadores',
          icon: Users,
          status: gymStatus === 'active' ? 'active' : 'none',
          path: gymStatus === 'active' ? `/gym/${gymStaff?.gym_id}/dashboard` : '/trainer/onboarding',
        },
        {
          key: 'gym',
          label: 'Gimnasio',
          description: 'Registra y gestiona tu gimnasio',
          icon: Building2,
          status: gymStatus,
          path: gymStatus === 'active' ? `/gym/${gymStaff?.gym_id}/dashboard` : '/gym/onboarding',
        },
        {
          key: 'judge',
          label: 'Juez / Oficial',
          description: 'Accede como oficial certificado',
          icon: Scale,
          status: judgeStatus,
          path: judgeStatus !== 'none' ? '/' : '/judge/onboarding',
        },
      ]);

      setLoading(false);
    };

    checkModules();
  }, [user, authLoading, rolesLoading]);

  if (authLoading || loading) {
    return <PageSkeleton variant="hub" />;
  }

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  // If admin with no other modules, go straight to admin
  if (isAdmin && modules.every(m => m.status === 'none')) {
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
          {modules.map((mod) => (
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
