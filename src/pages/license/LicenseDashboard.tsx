import { Shield, Calendar, AlertTriangle, CheckCircle, Clock, QrCode, Edit, RefreshCw, MapPin, Dumbbell, Target, User, Zap, Heart, FileText, Activity } from 'lucide-react';
import { getWeightClassLabel } from '@/lib/constants/disciplines';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { useLicenseData } from '@/hooks/useLicenseSystem';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { useDopingTests } from '@/hooks/useDopingTests';
import { useRealtimeFighterUpdates } from '@/hooks/useRealtimeFighterUpdates';
import { EnhancedFighterID } from '@/components/EnhancedFighterID';
import { UserFighterProfileEditForm } from '@/components/UserFighterProfileEditForm';
import { ProfileProgressWidget } from '@/components/ProfileProgressWidget';
import FighterStatusUpdateForm from '@/components/FighterStatusUpdateForm';
import FighterUpdatesFeed from '@/components/FighterUpdatesFeed';
import { DopingTestCard } from '@/components/DopingTestCard';
import { DopingTestUploadForm } from '@/components/DopingTestUploadForm';
import { DopingEligibilityBadge } from '@/components/DopingEligibilityBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function LicenseDashboard() {
  const { user, licenseData, refreshLicense, forceLicenseUpdate } = useLicenseAuth();
  const { license, fightBookings, medicalCerts } = useLicenseData(licenseData?.id);
  const { fetchFighters } = useFighterProfiles();
  const { tests, eligibility, loading: dopingLoading, uploading, uploadReport } = useDopingTests(
    licenseData?.id || null
  );
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Enable realtime updates for the current user's fighter profile
  useRealtimeFighterUpdates(licenseData?.fighter_profile_id);

  console.log('Dashboard - licenseData:', licenseData);
  console.log('Dashboard - license:', license);

  // Redirigir a /license/pending si la licencia está PENDING_REVIEW
  useEffect(() => {
    if (licenseData && ['PENDING_REVIEW', 'APPLIED'].includes(licenseData.status)) {
      navigate('/license/pending', { replace: true });
    }
  }, [licenseData, navigate]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshLicense(),
        fetchFighters(),
        license?.refetch?.()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!licenseData) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sin Licencia</h2>
        <p className="text-muted-foreground">No tienes una licencia activa.</p>
      </div>
    );
  }

  // Function to detect missing critical information 
  const getMissingFields = (profile: any) => {
    const requiredFields = [
      { key: 'birthdate', label: 'Fecha de Nacimiento' },
      { key: 'gender', label: 'Género' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'blood_type', label: 'Tipo de Sangre' },
      { key: 'height_cm', label: 'Altura' },
      { key: 'weight_kg', label: 'Peso' },
      { key: 'emergency_contact_name', label: 'Contacto de Emergencia' },
      { key: 'emergency_contact_phone', label: 'Teléfono de Emergencia' },
      { key: 'insurance_company', label: 'Compañía de Seguro' }
    ];
    
    return requiredFields.filter(field => 
      !profile?.[field.key] || 
      profile[field.key] === 'No especificado' ||
      profile[field.key] === 'No especificada'
    );
  };

  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateInfo = () => {
    setIsEditing(true);
  };

  const handleEditSuccess = async () => {
    setIsEditing(false);
    setIsUpdating(true);
    
    try {
      console.log('[Dashboard] Edit success - forcing license update...');
      // Force update context first
      await forceLicenseUpdate();
      // Then refresh local data
      await refreshData();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-fighter-success text-white';
      case 'SUSPENDED': return 'bg-fighter-danger text-white';
      case 'PENDING_REVIEW': return 'bg-fighter-warning text-black';
      case 'EXPIRED': return 'bg-fighter-accent text-white';
      default: return 'bg-fighter-accent text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activa';
      case 'SUSPENDED': return 'Suspendida';
      case 'PENDING_REVIEW': return 'En Revisión';
      case 'EXPIRED': return 'Expirada';
      default: return status;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'AMATEUR': return 'bg-fighter-info text-white';
      case 'SEMI_PRO': return 'bg-fighter-secondary text-white';
      case 'PROFESSIONAL': return 'bg-amber-600 text-white';
      default: return 'bg-fighter-accent text-white';
    }
  };

  const upcomingFights = fightBookings?.data?.filter(fight => 
    new Date(fight.scheduled_date) > new Date()
  ).slice(0, 3) || [];

  const validMedicalCert = medicalCerts?.data?.find(cert => 
    cert.cleared && new Date(cert.expires_date) > new Date()
  );

  // Get fighter profile from license data
  const fighterProfile = licenseData?.fighter_profiles;
  const missingFields = getMissingFields(fighterProfile);

  // Show edit form if editing mode is active
  if (isEditing && fighterProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Editar Información del Perfil
              </CardTitle>
              <CardDescription>
                Actualiza tu información personal y profesional
              </CardDescription>
            </CardHeader>
          </Card>
          
          <UserFighterProfileEditForm
            profile={fighterProfile}
            onSuccess={handleEditSuccess}
            onCancel={handleEditCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 p-2 xs:p-3 sm:p-4 mobile-edge-padding">
      <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 md:space-y-5">
        {/* Admin Header - Optimized for mobile */}
        <div className="bg-card border rounded-lg p-3 xs:p-4 sm:p-5 shadow-sm">
          {/* Row 1: Title and License */}
          <div className="flex items-start gap-2 mb-3">
            <Shield className="h-5 w-5 xs:h-6 xs:w-6 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-tight">
                Fighter ID
              </h1>
              <p className="text-xs xs:text-sm text-muted-foreground mt-0.5 truncate">
                Licencia: {licenseData.license_number}
              </p>
            </div>
          </div>
          
          {/* Row 2: Status Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={`${getStatusColor(licenseData.status)} text-xs`}>
              {getStatusText(licenseData.status)}
            </Badge>
            <Badge className={`${getLevelColor(licenseData.license_level)} text-xs`} variant="outline">
              {licenseData.license_level}
            </Badge>
            {missingFields.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {missingFields.length} campo{missingFields.length > 1 ? 's' : ''} faltante{missingFields.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          {/* Row 3: Action Buttons - Full width on mobile */}
          <div className="flex flex-col xs:flex-row gap-2">
            <Button 
              onClick={refreshData}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex-1 xs:flex-none flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </Button>
            <Button 
              onClick={handleUpdateInfo}
              variant="professional"
              size="sm"
              className="flex-1 xs:flex-none flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
            >
              <Edit className="h-4 w-4" />
              <span>{missingFields.length > 0 ? 'Completar Perfil' : 'Editar Perfil'}</span>
            </Button>
          </div>
        </div>

        {/* Prominent Fighter Profile Section */}
        <Card className="overflow-hidden border-2 shadow-lg">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-4 sm:p-5 md:p-6">
              <div className="flex flex-col md:flex-row gap-4 sm:gap-5 md:gap-6 items-center md:items-start">
                {/* Large Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="relative">
                    <Avatar className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 ring-2 sm:ring-3 md:ring-4 ring-primary/20 ring-offset-2 sm:ring-offset-3 ring-offset-background shadow-xl">
                      <AvatarImage src={fighterProfile?.avatar_url} className="object-cover" />
                      <AvatarFallback className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                        {fighterProfile?.first_name?.[0]}{fighterProfile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {licenseData.status === 'ACTIVE' && (
                      <div className="absolute -bottom-2 -right-2 bg-fighter-success rounded-full p-1.5 sm:p-2 ring-4 ring-background shadow-lg">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Fighter Info */}
                <div className="flex-1 text-center md:text-left space-y-2 sm:space-y-3 md:space-y-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                      {fighterProfile?.first_name} {fighterProfile?.last_name}
                    </h2>
                    {fighterProfile?.nickname && (
                      <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium mt-1">
                        "{fighterProfile.nickname}"
                      </p>
                    )}
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <Badge className={getStatusColor(licenseData.status)} variant="default">
                      {getStatusText(licenseData.status)}
                    </Badge>
                    <Badge className={getLevelColor(licenseData.license_level)} variant="outline">
                      {licenseData.license_level}
                    </Badge>
                    {fighterProfile?.discipline && (
                      <Badge variant="secondary" className="font-semibold">
                        {fighterProfile.discipline}
                      </Badge>
                    )}
                    {fighterProfile?.weight_class && (
                      <Badge variant="outline">
                        {getWeightClassLabel(fighterProfile.weight_class)}
                      </Badge>
                    )}
                  </div>

                  {/* Fighter Record - Discipline Specific */}
                  {(() => {
                    // Get discipline-specific record
                    const discipline = fighterProfile?.discipline;
                    let wins = 0, losses = 0, draws = 0;
                    
                    if (discipline === 'MMA') {
                      wins = (fighterProfile as any)?.mma_record_wins || fighterProfile?.record_wins || 0;
                      losses = (fighterProfile as any)?.mma_record_losses || fighterProfile?.record_losses || 0;
                      draws = (fighterProfile as any)?.mma_record_draws || fighterProfile?.record_draws || 0;
                    } else if (discipline === 'Boxeo') {
                      wins = (fighterProfile as any)?.boxeo_record_wins || fighterProfile?.record_wins || 0;
                      losses = (fighterProfile as any)?.boxeo_record_losses || fighterProfile?.record_losses || 0;
                      draws = (fighterProfile as any)?.boxeo_record_draws || fighterProfile?.record_draws || 0;
                    } else {
                      // Fallback to legacy
                      wins = fighterProfile?.record_wins || 0;
                      losses = fighterProfile?.record_losses || 0;
                      draws = fighterProfile?.record_draws || 0;
                    }
                    
                    return (
                      <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 md:gap-6 pt-1 sm:pt-2">
                        <div className="text-center">
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-fighter-success">
                            {wins}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Victorias</p>
                        </div>
                        <Separator orientation="vertical" className="h-8 sm:h-10 md:h-12" />
                        <div className="text-center">
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-fighter-danger">
                            {losses}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Derrotas</p>
                        </div>
                        <Separator orientation="vertical" className="h-8 sm:h-10 md:h-12" />
                        <div className="text-center">
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-fighter-warning">
                            {draws}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Empates</p>
                        </div>
                        {discipline && (
                          <>
                            <Separator orientation="vertical" className="h-8 sm:h-10 md:h-12" />
                            <div className="text-center">
                              <Badge variant="outline" className="text-xs">
                                {discipline}
                              </Badge>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Additional Quick Info */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground pt-1 sm:pt-2">
                    {fighterProfile?.country && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{fighterProfile.country}</span>
                      </div>
                    )}
                    {fighterProfile?.gym_name && (
                      <div className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        <span>{fighterProfile.gym_name}</span>
                      </div>
                    )}
                    {fighterProfile?.stance && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>{fighterProfile.stance}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* License Number Badge */}
                <div className="flex-shrink-0 text-center md:text-right">
                  <div className="inline-block bg-card border-2 rounded-lg p-3 sm:p-3.5 md:p-4 shadow-md">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-1">Licencia</p>
                    <p className="text-sm sm:text-base md:text-lg font-mono font-bold text-primary">{licenseData.license_number}</p>
                    {licenseData.expires_at && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                        Vence: {format(new Date(licenseData.expires_at), 'PP', { locale: es })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Progress Widget */}
        {fighterProfile && (
          <ProfileProgressWidget
            profile={fighterProfile}
            onEditClick={handleUpdateInfo}
          />
        )}

        {/* Reorganized Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* Información Personal - Solo datos únicos de identificación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                  <p>{fighterProfile?.birthdate ? format(new Date(fighterProfile.birthdate), 'PP', { locale: es }) : 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lugar de Nacimiento</p>
                  <p>{fighterProfile?.birthplace || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Género</p>
                  <p>{fighterProfile?.gender || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Documento</p>
                  <p>{fighterProfile?.document_type || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número de Documento</p>
                  <p>{fighterProfile?.document_number || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Sangre</p>
                  <p>{fighterProfile?.blood_type || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Física - Solo medidas físicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Información Física
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Altura</p>
                  <p>{fighterProfile?.height_cm ? `${fighterProfile.height_cm} cm` : 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Peso</p>
                  <p>{fighterProfile?.weight_kg ? `${fighterProfile.weight_kg} kg` : 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alcance</p>
                  <p>{fighterProfile?.reach_cm ? `${fighterProfile.reach_cm} cm` : 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Postura</p>
                  <p>{fighterProfile?.stance || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estilo de Pelea</p>
                  <p>{fighterProfile?.fighting_style || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información Deportiva - Disciplina, biografía, artes marciales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Información Deportiva
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disciplina Principal</p>
                  <p className="font-semibold">{fighterProfile?.discipline || licenseData.discipline || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Récord</p>
                  <p>{fighterProfile?.record_type || 'No especificado'}</p>
                </div>
                {fighterProfile?.martial_arts && fighterProfile.martial_arts.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Artes Marciales</p>
                    <div className="flex flex-wrap gap-2">
                      {fighterProfile.martial_arts.map((art, index) => (
                        <Badge key={index} variant="secondary">{art}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {fighterProfile?.bio && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Biografía</p>
                    <div className="p-3 bg-muted/20 rounded-lg border">
                      <p className="text-sm leading-relaxed">{fighterProfile.bio}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Perfiles Externos</p>
                  {fighterProfile?.boxrec_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">BoxRec:</span>
                      <a href={fighterProfile.boxrec_url} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-primary hover:underline truncate">
                        {fighterProfile.boxrec_url}
                      </a>
                    </div>
                  )}
                  {fighterProfile?.tapology_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tapology:</span>
                      <a href={fighterProfile.tapology_url} target="_blank" rel="noopener noreferrer"
                         className="text-sm text-primary hover:underline truncate">
                        {fighterProfile.tapology_url}
                      </a>
                    </div>
                  )}
                  {!fighterProfile?.boxrec_url && !fighterProfile?.tapology_url && (
                    <p className="text-sm text-muted-foreground">Sin perfiles externos registrados</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Médica y de Emergencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Información Médica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Condiciones Médicas</p>
                  <div className="p-3 bg-muted/20 rounded-lg border min-h-[60px]">
                    <p className="text-sm">{fighterProfile?.medical_conditions || 'Sin condiciones médicas reportadas'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alergias</p>
                  <div className="p-3 bg-muted/20 rounded-lg border min-h-[60px]">
                    <p className="text-sm">{fighterProfile?.medical_allergies || 'Sin alergias reportadas'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contacto de Emergencia</p>
                  <div className="space-y-2 pt-2">
                    <p className="text-sm">{fighterProfile?.emergency_contact_name || 'No especificado'}</p>
                    <p className="text-xs text-muted-foreground">
                      {fighterProfile?.emergency_contact_relation && `${fighterProfile.emergency_contact_relation} - `}
                      {fighterProfile?.emergency_contact_phone || 'Sin teléfono'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información de Seguro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Compañía de Seguro</p>
                  <p>{fighterProfile?.insurance_company || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número de Póliza</p>
                  <p className="font-mono">{fighterProfile?.insurance_policy || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Información de Licencia</p>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Creada:</span>
                      <span>{licenseData.created_at ? format(new Date(licenseData.created_at), 'PP', { locale: es }) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Última actualización:</span>
                      <span>{fighterProfile?.updated_at ? format(new Date(fighterProfile.updated_at), 'PP', { locale: es }) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Versión:</span>
                      <span>v{licenseData.version || 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* License Status Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Estado de Validaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    {licenseData.medical_cleared ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="text-sm font-medium">Médico</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {licenseData.medical_cleared ? 'Autorizado' : 'Pendiente'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    {licenseData.physical_cleared ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="text-sm font-medium">Físico</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {licenseData.physical_cleared ? 'Autorizado' : 'Pendiente'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Emitida:</span>
                  <span>{licenseData.issued_at ? format(new Date(licenseData.issued_at), 'PP', { locale: es }) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expira:</span>
                  <span className={new Date(licenseData.expires_at) < new Date() ? 'text-red-600 font-medium' : ''}>
                    {format(new Date(licenseData.expires_at), 'PP', { locale: es })}
                  </span>
                </div>
                {licenseData.approved_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aprobada:</span>
                    <span>{format(new Date(licenseData.approved_at), 'PP', { locale: es })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medical Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Certificaciones Médicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medicalCerts?.data?.length > 0 ? (
                <div className="space-y-3">
                  {medicalCerts.data.slice(0, 2).map((cert: any) => (
                    <div key={cert.id} className="p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{cert.certification_type}</span>
                        <Badge variant={cert.cleared && new Date(cert.expires_date) > new Date() ? 'default' : 'secondary'}>
                          {cert.cleared && new Date(cert.expires_date) > new Date() ? 'Vigente' : 'Expirada'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Emitido por: {cert.issued_by}</p>
                        <p>Expira: {format(new Date(cert.expires_date), 'PP', { locale: es })}</p>
                        {cert.medical_number && <p>Número: {cert.medical_number}</p>}
                      </div>
                    </div>
                  ))}
                  {medicalCerts.data.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Sin certificaciones médicas registradas
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin certificaciones médicas registradas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Fight History/Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Actividad de Peleas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{(fighterProfile?.record_wins || 0) + (fighterProfile?.record_losses || 0) + (fighterProfile?.record_draws || 0)}</p>
                  <p className="text-sm text-muted-foreground">Peleas Totales</p>
                </div>
                
                {upcomingFights.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Próximas Peleas:</p>
                    <div className="space-y-2">
                      {upcomingFights.slice(0, 2).map((fight: any, index: number) => (
                        <div key={index} className="p-2 rounded border text-xs">
                          <p className="font-medium">{fight.event_name}</p>
                          <p className="text-muted-foreground">{format(new Date(fight.scheduled_date), 'PP', { locale: es })}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Administrative Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Observaciones Administrativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {licenseData.notes && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Notas de Licencia:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{licenseData.notes}</p>
                  </div>
                )}
                
                {licenseData.suspension_reason && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">Razón de Suspensión:</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{licenseData.suspension_reason}</p>
                    {licenseData.suspension_until && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Hasta: {format(new Date(licenseData.suspension_until), 'PP', { locale: es })}
                      </p>
                    )}
                  </div>
                )}

                {!licenseData.notes && !licenseData.suspension_reason && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin observaciones administrativas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fighter Updates Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Crear Actualización</CardTitle>
              <CardDescription>
                Comparte tu progreso, entrenamientos y noticias con tus fans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FighterStatusUpdateForm 
                fighterId={fighterProfile?.id} 
                onUpdateCreated={() => {
                  // Refresh the feed when a new update is created
                  window.location.reload();
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tus Actualizaciones</CardTitle>
              <CardDescription>
                Historial de publicaciones recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FighterUpdatesFeed 
                fighterId={fighterProfile?.id}
                isOwner={true}
                onUpdateDeleted={() => {
                  // Refresh when update is deleted
                  window.location.reload();
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Doping Tests Section */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Reportes de Dopaje</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gestiona tus pruebas antidopaje y mantén tu elegibilidad para competir
              </p>
            </div>
          </div>

          <DopingEligibilityBadge eligibility={eligibility} showDetails />

          <DopingTestUploadForm onUpload={uploadReport} uploading={uploading} />

          <div>
            <h3 className="text-lg font-semibold mb-4">Historial de Pruebas</h3>
            {dopingLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando reportes...
              </div>
            ) : tests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay reportes de dopaje registrados
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {tests.map((test) => (
                  <DopingTestCard key={test.id} test={test} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}