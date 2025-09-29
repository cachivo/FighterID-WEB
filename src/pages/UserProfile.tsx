import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFighterProfiles, FighterProfile } from '@/hooks/useFighterProfiles';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BackButton } from '@/components/ui/back-button';
import { useToast } from '@/hooks/use-toast';
import { Shield, User, Plus, ExternalLink, Eye, FileText, AlertCircle, Calendar, Users, Settings, Edit } from 'lucide-react';
import { FighterProfileForm } from '@/components/FighterProfileForm';
import { UserProfileForm } from '@/components/UserProfileForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FighterUpdateForm from '@/components/FighterUpdateForm';
import FighterUpdatesFeed from '@/components/FighterUpdatesFeed';

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getUserFighterProfile } = useFighterProfiles();
  const { hasActiveLicense, licenseData } = useLicenseAuth();
  const { profile: userProfile } = useUserProfile();
  const [profile, setProfile] = useState<FighterProfile | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    const loadProfile = async () => {
      if (user) {
        try {
          const fighterProfile = await getUserFighterProfile();
          setProfile(fighterProfile);
        } catch (error) {
          console.error('Error loading fighter profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadProfile();
  }, [getUserFighterProfile, user]);

  // Intelligent redirection: Licensed fighters go to Fighter ID
  useEffect(() => {
    if (!loading && profile && hasActiveLicense) {
      navigate('/license/dashboard');
    }
  }, [loading, profile, hasActiveLicense, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-6">Debes iniciar sesión para ver tu perfil.</p>
            <Button asChild>
              <Link to="/auth">Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-professional-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const handleCreateProfile = () => {
    setShowCreateDialog(false);
    getUserFighterProfile().then(setProfile);
    toast({ title: "Perfil creado", description: "Tu perfil de peleador ha sido creado exitosamente" });
  };

  const renderUserSection = () => (
    <Card className="relative overflow-hidden border-2 border-professional-border/30 bg-gradient-professional-light shadow-professional">
      {/* Professional accent line */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-professional"></div>
      
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-professional-accent/50 shadow-professional">
              <AvatarImage src={userProfile?.avatar_url || ''} alt="Avatar" />
              <AvatarFallback className="bg-gradient-professional text-professional-primary-foreground text-2xl font-bold">
                {userProfile?.first_name?.charAt(0) || userProfile?.last_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {userProfile?.first_name && userProfile?.last_name 
                  ? `${userProfile.first_name} ${userProfile.last_name}`
                  : 'Usuario de la Plataforma'
                }
              </h2>
              <p className="text-lg text-professional-accent">
                {user.email}
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-professional-accent/40 text-professional-primary">
                  Cuenta Activa
                </Badge>
                {userProfile?.birthdate && (
                  <Badge variant="outline" className="border-professional-border/40">
                    {new Date().getFullYear() - new Date(userProfile.birthdate).getFullYear()} años
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setShowEditDialog(true)}
            className="border-professional-accent/40 hover:bg-professional-accent/10"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </div>

        {userProfile?.bio && (
          <div className="mb-6 p-4 bg-professional-muted/5 rounded-lg">
            <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
          </div>
        )}

        <div className="bg-professional-muted/10 border border-professional-border/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="bg-professional-accent/20 text-professional-primary rounded-full p-2">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">
                ¿Quieres ser peleador?
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Puedes crear un perfil de peleador para acceder a funcionalidades adicionales como 
                sparring, estadísticas, participar en eventos y solicitar licencias oficiales.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-professional-primary hover:bg-professional-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Crear Perfil de Peleador
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFighterSection = () => (
    <Card className="relative overflow-hidden border-2 border-professional-border/30 bg-gradient-professional-light shadow-professional">
      {/* Professional accent line */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-professional"></div>
      
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-professional-accent/50 shadow-professional">
              <AvatarImage 
                src={profile?.avatar_url} 
                alt={`${profile?.first_name} ${profile?.last_name}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-professional text-professional-primary-foreground text-2xl font-bold">
                {profile?.first_name?.charAt(0) || 'F'}
                {profile?.last_name?.charAt(0) || 'F'}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {profile?.first_name} {profile?.last_name}
              </h2>
              {profile?.nickname && (
                <p className="text-lg font-medium text-professional-accent">
                  "{profile.nickname}"
                </p>
              )}
              <div className="flex gap-3">
                <Badge variant="outline" className="border-professional-accent/40 text-professional-primary">
                  {profile?.weight_class}
                </Badge>
                <Badge variant="outline" className="border-professional-border/40">
                  {profile?.country}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right bg-gradient-to-br from-professional-muted/20 to-professional-accent/10 p-6 rounded-xl border border-professional-border/30">
            <p className="text-sm font-medium text-professional-accent uppercase tracking-wider">Record</p>
            <p className="text-2xl font-bold text-professional-primary tracking-wider mt-2 font-mono">
              {profile?.record_wins || 0}-{profile?.record_losses || 0}-{profile?.record_draws || 0}
            </p>
          </div>
        </div>

        {/* License Status Section */}
        <div className="bg-professional-muted/10 border border-professional-border/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="bg-professional-accent/20 text-professional-primary rounded-full p-2">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">
                Estado de Licencia Oficial
              </h4>
              {hasActiveLicense ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-fighter-success text-white">
                      Licencia Activa
                    </Badge>
                    <Badge variant="outline" className="border-professional-accent/40">
                      {licenseData?.license_number}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tienes una licencia oficial activa. Puedes acceder a tu Fighter ID digital con toda tu información oficial.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild className="bg-professional-primary hover:bg-professional-primary/90">
                      <Link to="/license/dashboard">
                        <Shield className="h-4 w-4 mr-2" />
                        Ver Mi Fighter ID Oficial
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="border-professional-accent/40 hover:bg-professional-accent/10">
                      <Link to={`/fighter/${profile?.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Perfil Público
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Badge variant="outline" className="border-fighter-warning/40 text-fighter-warning">
                    Sin Licencia Oficial
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Eres un peleador registrado pero no cuentas con una licencia oficial. Puedes solicitar tu licencia 
                    para acceder a funcionalidades adicionales y participar en eventos oficiales.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild className="bg-professional-primary hover:bg-professional-primary/90">
                      <Link to="/license/onboarding">
                        <FileText className="h-4 w-4 mr-2" />
                        Solicitar Licencia Oficial
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="border-professional-accent/40 hover:bg-professional-accent/10">
                      <Link to={`/fighter/${profile?.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Perfil Público
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 p-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Optimized Header */}
        <div className="space-y-6 mb-8">
          <BackButton to="/" label="Volver al inicio" />
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <User className="h-12 w-12 text-professional-primary" />
              <h1 className="text-4xl font-bold text-professional-primary">Mi Perfil</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {profile 
                ? hasActiveLicense 
                  ? "Gestiona tu perfil y accede a tu Fighter ID oficial"
                  : "Gestiona tu perfil de peleador y solicita tu licencia oficial"
                : "Crea tu perfil de peleador para acceder a todas las funcionalidades"
              }
            </p>
          </div>
        </div>

        {/* Main Profile Section */}
        {profile ? renderFighterSection() : renderUserSection()}

        {/* Fighter Updates Form - Only for fighters */}
        {profile && (
          <Card className="border border-professional-border/30 bg-gradient-professional-light">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Compartir Actualización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FighterUpdateForm fighterId={profile.id} />
            </CardContent>
          </Card>
        )}

        {/* Fighter Updates Feed - Only for fighters */}
        {profile && (
          <Card className="border border-professional-border/30 bg-gradient-professional-light">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mis Actualizaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FighterUpdatesFeed fighterId={profile.id} isOwner={true} />
            </CardContent>
          </Card>
        )}

        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Stats */}
            {[
              { label: 'Altura', value: profile.height_cm ? `${profile.height_cm} cm` : 'N/A', icon: '📏' },
              { label: 'Peso', value: profile.weight_kg ? `${profile.weight_kg} kg` : 'N/A', icon: '⚖️' },
              { label: 'Gimnasio', value: profile.gym_name || 'N/A', icon: '🥊' }
            ].map((stat, index) => (
              <Card key={index} className="text-center p-6 border border-professional-border/30 bg-gradient-to-br from-background to-professional-muted/10">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="text-lg font-bold text-foreground mt-2">{stat.value}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Additional Actions */}
        <Card className="border border-professional-border/30 bg-gradient-professional-light">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Enlaces Útiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" asChild className="justify-start">
                <Link to="/eventos">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Eventos Disponibles
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to="/fighters">
                  <Users className="h-4 w-4 mr-2" />
                  Explorar Peleadores
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Fighter Profile Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Crear Perfil de Peleador</DialogTitle>
          </DialogHeader>
          <FighterProfileForm onSuccess={handleCreateProfile} />
        </DialogContent>
      </Dialog>

      {/* Edit User Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Editar Mi Perfil
            </DialogTitle>
          </DialogHeader>
          <UserProfileForm onSuccess={() => setShowEditDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}