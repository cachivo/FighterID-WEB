import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  User, FileText, Shield, Activity, Clock, Phone, Mail, 
  MapPin, Calendar, Weight, Ruler, Target, AlertTriangle,
  CheckCircle, XCircle, Eye, Download, ExternalLink, Trophy, Medal
} from 'lucide-react';
import { useDetailedFighterData, DetailedFighterData } from '@/hooks/useDetailedFighterData';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FighterLeaguesTab } from './FighterLeaguesTab';

// Helper function to get correct record based on discipline
const getRecordDisplay = (profile: any) => {
  if (profile?.discipline === 'MMA') {
    return `${profile.mma_record_wins || 0}-${profile.mma_record_losses || 0}-${profile.mma_record_draws || 0}`;
  } else if (profile?.discipline === 'Boxeo') {
    return `${profile.boxeo_record_wins || 0}-${profile.boxeo_record_losses || 0}-${profile.boxeo_record_draws || 0}`;
  }
  // Fallback to legacy
  return `${profile?.record_wins || 0}-${profile?.record_losses || 0}-${profile?.record_draws || 0}`;
};

interface FighterDetailModalProps {
  fighterId: string | null;
  open: boolean;
  onClose: () => void;
}

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', text: string }> = {
    'ACTIVE': { variant: 'default', text: 'Activa' },
    'SUSPENDED': { variant: 'destructive', text: 'Suspendida' },
    'EXPIRED': { variant: 'secondary', text: 'Expirada' },
    'PENDING_REVIEW': { variant: 'outline', text: 'Pendiente' },
    'PENDING': { variant: 'outline', text: 'Pendiente' },
    'APPROVED': { variant: 'default', text: 'Aprobada' },
    'REJECTED': { variant: 'destructive', text: 'Rechazada' }
  };

  const config = statusMap[status] || { variant: 'outline' as const, text: status };
  return <Badge variant={config.variant}>{config.text}</Badge>;
};

const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number | null }) => (
  <div className="flex items-center gap-3 py-2">
    <Icon className="h-4 w-4 text-muted-foreground" />
    <span className="text-sm text-muted-foreground min-w-[120px]">{label}:</span>
    <span className="text-sm font-medium">{value || 'No especificado'}</span>
  </div>
);

export const FighterDetailModal = ({ fighterId, open, onClose }: FighterDetailModalProps) => {
  const { data, loading, error, fetchDetailedData, clearData } = useDetailedFighterData();
  const [activeTab, setActiveTab] = useState('personal');

  // Fetch data when modal opens with a fighterId
  useEffect(() => {
    if (open && fighterId && !data) {
      console.log('Modal opened, fetching data for fighter:', fighterId);
      fetchDetailedData(fighterId);
    } else if (!open) {
      console.log('Modal closed, clearing data');
      clearData();
    }
  }, [open, fighterId, fetchDetailedData, clearData, data]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  if (!open || !fighterId) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="space-y-2">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Información Completa del Peleador
            </DialogTitle>
            {data && (data.profile as any)?.completion_score !== undefined && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span>Completitud:</span>
                <Progress value={(data.profile as any).completion_score || 0} className="h-2 w-32" />
                <span className="font-medium">{(data.profile as any).completion_score || 0}%</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 pt-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">Error: {error}</p>
                <Button variant="outline" onClick={() => fetchDetailedData(fighterId)} className="mt-4">
                  Reintentar
                </Button>
              </div>
            )}

            {data && (
              <div className="space-y-6">
                {/* Header con información básica */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <OptimizedImage
                        src={data.profile?.avatar_url || ''}
                        alt={`${data.profile?.first_name} ${data.profile?.last_name}`}
                        className="w-24 h-24 rounded-full border-4 border-border object-cover aspect-square flex-shrink-0"
                        fallbackIcon={
                          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                            <User className="h-12 w-12 text-muted-foreground" />
                          </div>
                        }
                      />
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">
                          {data.profile?.first_name} {data.profile?.last_name}
                        </h2>
                        {data.profile?.nickname && (
                          <p className="text-lg text-muted-foreground mb-2">"{data.profile.nickname}"</p>
                        )}
                        <div className="flex gap-4 flex-wrap">
                          <Badge variant="outline" className="text-sm">
                            Récord: {getRecordDisplay(data.profile)}
                          </Badge>
                          <Badge variant="secondary">
                            {data.profile?.weight_class}
                          </Badge>
                          {data.profile?.discipline && (
                            <Badge variant="outline">
                              {data.profile.discipline}
                            </Badge>
                          )}
                          <Badge variant={data.profile?.active ? "default" : "secondary"}>
                            {data.profile?.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs con información detallada */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-7 w-full">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="deportivo">Deportivo</TabsTrigger>
                    <TabsTrigger value="ligas">Ligas</TabsTrigger>
                    <TabsTrigger value="licencias">Licencias</TabsTrigger>
                    <TabsTrigger value="documentos">Documentos</TabsTrigger>
                    <TabsTrigger value="estado">Estado</TabsTrigger>
                    <TabsTrigger value="cambios">Cambios</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Información Personal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <InfoItem icon={User} label="Nombre completo" value={`${data.profile?.first_name} ${data.profile?.last_name}`} />
                        <InfoItem icon={FileText} label="Documento" value={`${data.profile?.document_type || ''} ${data.profile?.document_number || ''}`} />
                        <InfoItem icon={Calendar} label="Fecha de nacimiento" value={data.profile?.birthdate ? format(new Date(data.profile.birthdate), 'dd/MM/yyyy') : null} />
                        <InfoItem icon={MapPin} label="Lugar de nacimiento" value={data.profile?.birthplace} />
                        <InfoItem icon={MapPin} label="País" value={data.profile?.country} />
                        <InfoItem icon={Activity} label="Tipo de sangre" value={data.profile?.blood_type} />
                        <InfoItem icon={Mail} label="Email" value={data.profile?.app_user?.email} />
                        <InfoItem icon={Phone} label="Teléfono" value={data.profile?.app_user?.phone} />
                      </CardContent>
                    </Card>

                    {/* Contacto de emergencia */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Contacto de Emergencia
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <InfoItem icon={User} label="Nombre" value={data.profile?.emergency_contact_name} />
                        <InfoItem icon={Phone} label="Teléfono" value={data.profile?.emergency_contact_phone} />
                        <InfoItem icon={User} label="Relación" value={data.profile?.emergency_contact_relation} />
                      </CardContent>
                    </Card>

                    {/* Seguro médico */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Seguro Médico
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <InfoItem icon={Shield} label="Compañía" value={data.profile?.insurance_company} />
                        <InfoItem icon={FileText} label="Póliza" value={data.profile?.insurance_policy} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="deportivo" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Información Deportiva
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <InfoItem icon={Target} label="Disciplina" value={data.profile?.discipline} />
                        <InfoItem icon={Activity} label="Estilo de pelea" value={data.profile?.fighting_style} />
                        <InfoItem icon={MapPin} label="Gimnasio" value={data.profile?.gym_name} />
                        <InfoItem icon={Activity} label="Stance" value={data.profile?.stance} />
                        <InfoItem icon={FileText} label="Tipo de récord" value={data.profile?.record_type} />
                        <InfoItem icon={Weight} label="Peso" value={data.profile?.weight_kg ? `${data.profile.weight_kg} kg` : null} />
                        <InfoItem icon={Ruler} label="Altura" value={data.profile?.height_cm ? `${data.profile.height_cm} cm` : null} />
                        <InfoItem icon={Ruler} label="Alcance" value={data.profile?.reach_cm ? `${data.profile.reach_cm} cm` : null} />
                        <InfoItem icon={ExternalLink} label="BoxRec" value={data.profile?.boxrec_url} />
                        <InfoItem icon={ExternalLink} label="Tapology" value={data.profile?.tapology_url} />
                      </CardContent>
                    </Card>

                    {/* Artes marciales */}
                    {data.profile?.martial_arts && data.profile.martial_arts.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Artes Marciales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {data.profile.martial_arts.map((art: string, index: number) => (
                              <Badge key={index} variant="outline">{art}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Condiciones médicas */}
                    {(data.profile?.medical_conditions || data.profile?.medical_allergies) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Información Médica
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <InfoItem icon={AlertTriangle} label="Condiciones" value={data.profile?.medical_conditions} />
                          <InfoItem icon={AlertTriangle} label="Alergias" value={data.profile?.medical_allergies} />
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="ligas" className="space-y-4">
                    <FighterLeaguesTab 
                      fighterId={fighterId} 
                      fighterWeightClass={data.profile?.weight_class}
                    />
                  </TabsContent>

                  <TabsContent value="licencias" className="space-y-4">
                    {data.licenses.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No tiene licencias registradas</p>
                        </CardContent>
                      </Card>
                    ) : (
                      data.licenses.map((license: any) => (
                        <Card key={license.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  <Shield className="h-5 w-5" />
                                  Licencia #{license.license_number}
                                  {license.is_primary && <Badge variant="default">Principal</Badge>}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {license.organizations?.name || 'Sin organización'}
                                </p>
                              </div>
                              {getStatusBadge(license.status)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <InfoItem icon={Target} label="Disciplina" value={license.discipline} />
                            <InfoItem icon={Shield} label="Nivel" value={license.license_level} />
                            <InfoItem icon={Calendar} label="Emitida" value={license.issued_at ? format(new Date(license.issued_at), 'dd/MM/yyyy') : null} />
                            <InfoItem icon={Calendar} label="Expira" value={license.expires_at ? format(new Date(license.expires_at), 'dd/MM/yyyy') : null} />
                            <InfoItem icon={CheckCircle} label="Médicamente apto" value={license.medical_cleared ? 'Sí' : 'No'} />
                            <InfoItem icon={Activity} label="Físicamente apto" value={license.physical_cleared ? 'Sí' : 'No'} />
                            {license.notes && (
                              <div className="pt-2">
                                <p className="text-sm text-muted-foreground mb-1">Notas:</p>
                                <p className="text-sm bg-muted p-2 rounded">{license.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="documentos" className="space-y-4">
                    {data.documents.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No hay documentos subidos</p>
                        </CardContent>
                      </Card>
                    ) : (
                      data.documents.map((doc: any) => (
                        <Card key={doc.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="font-medium">{doc.document_type}</span>
                                  {doc.verified_at && <CheckCircle className="h-4 w-4 text-green-500" />}
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">{doc.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Subido: {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </p>
                                {doc.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">Notas: {doc.notes}</p>
                                )}
                              </div>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Descargar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="estado" className="space-y-4">
                    {data.statusUpdates.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No hay actualizaciones de estado</p>
                        </CardContent>
                      </Card>
                    ) : (
                      data.statusUpdates.map((update: any) => (
                        <Card key={update.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                <span className="font-medium">
                                  {format(new Date(update.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </span>
                              </div>
                              <Badge variant={update.ready_to_fight ? "default" : "secondary"}>
                                {update.ready_to_fight ? 'Listo para pelear' : 'No disponible'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {update.weight_kg && (
                                <div>
                                  <span className="text-muted-foreground">Peso:</span>
                                  <span className="ml-2 font-medium">{update.weight_kg} kg</span>
                                </div>
                              )}
                              {update.bodyfat_pct && (
                                <div>
                                  <span className="text-muted-foreground">Grasa corporal:</span>
                                  <span className="ml-2 font-medium">{update.bodyfat_pct}%</span>
                                </div>
                              )}
                            </div>
                            {update.injuries && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">Lesiones:</p>
                                <p className="text-sm bg-muted p-2 rounded mt-1">{update.injuries}</p>
                              </div>
                            )}
                            {update.note && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">Notas:</p>
                                <p className="text-sm bg-muted p-2 rounded mt-1">{update.note}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="cambios" className="space-y-4">
                    {data.changeRequests.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No hay solicitudes de cambio</p>
                        </CardContent>
                      </Card>
                    ) : (
                      data.changeRequests.map((request: any) => (
                        <Card key={request.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">
                                  {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </span>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>
                            {request.requested_changes && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground mb-2">Cambios solicitados:</p>
                                <div className="bg-muted p-3 rounded text-sm">
                                  <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(request.requested_changes, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                            {request.admin_notes && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">Notas del administrador:</p>
                                <p className="text-sm bg-muted p-2 rounded mt-1">{request.admin_notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};