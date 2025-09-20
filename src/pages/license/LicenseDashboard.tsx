import { Shield, Calendar, AlertTriangle, CheckCircle, Clock, QrCode, Edit, RefreshCw } from 'lucide-react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { useLicenseData } from '@/hooks/useLicenseSystem';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { EnhancedFighterID } from '@/components/EnhancedFighterID';
import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function LicenseDashboard() {
  const { user, licenseData } = useLicenseAuth();
  const { license, fightBookings, medicalCerts } = useLicenseData(licenseData?.id);

  console.log('Dashboard - licenseData:', licenseData);
  console.log('Dashboard - license:', license);

  if (!licenseData) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sin Licencia</h2>
        <p className="text-muted-foreground">No tienes una licencia activa.</p>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Admin Header */}
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                Fighter ID - Información Administrativa
              </h1>
              <p className="text-muted-foreground mt-1">
                Vista completa de licencia {licenseData.license_number}
              </p>
            </div>
            <div className="text-right space-y-1">
              <Badge className={getStatusColor(licenseData.status)}>
                {getStatusText(licenseData.status)}
              </Badge>
              <Badge className={getLevelColor(licenseData.license_level)} variant="outline">
                {licenseData.license_level}
              </Badge>
            </div>
          </div>
        </div>

        {/* Fighter Profile Card - Información Personal Completa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={fighterProfile?.avatar_url} />
                <AvatarFallback>
                  {fighterProfile?.first_name?.[0]}{fighterProfile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              Información Personal Completa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                  <p className="font-semibold">{fighterProfile?.first_name} {fighterProfile?.last_name}</p>
                  {fighterProfile?.nickname && (
                    <p className="text-sm text-muted-foreground">"{fighterProfile.nickname}"</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Género</p>
                  <p>{fighterProfile?.gender || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">País</p>
                  <p>{fighterProfile?.country || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                  <p>{fighterProfile?.birthdate ? format(new Date(fighterProfile.birthdate), 'PP', { locale: es }) : 'No especificada'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lugar de Nacimiento</p>
                  <p>{fighterProfile?.birthplace || 'No especificado'}</p>
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
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Licencia Creada</p>
                  <p>{licenseData.created_at ? format(new Date(licenseData.created_at), 'PP', { locale: es }) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                  <p>{fighterProfile?.updated_at ? format(new Date(fighterProfile.updated_at), 'PP', { locale: es }) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Versión</p>
                  <p>v{licenseData.version || 1}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nivel</p>
                  <p>{fighterProfile?.level || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Física */}
        <Card>
          <CardHeader>
            <CardTitle>Información Física</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categoría de Peso</p>
                  <p className="font-semibold">{fighterProfile?.weight_class}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Peso (kg)</p>
                  <p>{fighterProfile?.weight_kg ? `${fighterProfile.weight_kg} kg` : 'No especificado'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Altura (cm)</p>
                  <p>{fighterProfile?.height_cm ? `${fighterProfile.height_cm} cm` : 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alcance (cm)</p>
                  <p>{fighterProfile?.reach_cm ? `${fighterProfile.reach_cm} cm` : 'No especificado'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Postura</p>
                  <p>{fighterProfile?.stance || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estilo de Pelea</p>
                  <p>{fighterProfile?.fighting_style || 'No especificado'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gimnasio/Academia</p>
                  <p>{fighterProfile?.gym_name || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disciplina Principal</p>
                  <p>{fighterProfile?.discipline || licenseData.discipline || 'No especificada'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Combate y Artes Marciales */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Combate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Récord Profesional</p>
                  <div className="flex items-center gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                      <p className="font-bold text-2xl text-green-600">{fighterProfile?.record_wins || 0}</p>
                      <p className="text-xs text-green-600">Victorias</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border">
                      <p className="font-bold text-2xl text-red-600">{fighterProfile?.record_losses || 0}</p>
                      <p className="text-xs text-red-600">Derrotas</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border">
                      <p className="font-bold text-2xl text-yellow-600">{fighterProfile?.record_draws || 0}</p>
                      <p className="text-xs text-yellow-600">Empates</p>
                    </div>
                  </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Médica</CardTitle>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacto de Emergencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre del Contacto</p>
                  <p>{fighterProfile?.emergency_contact_name || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Relación</p>
                  <p>{fighterProfile?.emergency_contact_relation || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="font-mono">{fighterProfile?.emergency_contact_phone || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información de Seguro */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Seguro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compañía de Seguro</p>
                <p>{fighterProfile?.insurance_company || 'No especificada'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número de Póliza</p>
                <p className="font-mono">{fighterProfile?.insurance_policy || 'No especificado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      </div>
    </div>
  );
}