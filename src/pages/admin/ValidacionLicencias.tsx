import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminLicenseActions } from '@/hooks/useLicenseSystem';
import { DeleteLicenseDialog } from '@/components/admin/DeleteLicenseDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Shield, Search, Plus, FileText, Loader2, AlertCircle, User, Eye, Download, Calendar, Phone, MapPin, Award, Activity } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { LicenseCard } from '@/components/admin/LicenseCard';

const DISCIPLINES = ['MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro'];

export default function ValidacionLicencias() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, loading: loadingAdmin } = useAdmin();
  const { approveLicense, suspendLicense } = useAdminLicenseActions();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, string>>({});
  const [reviewingLicense, setReviewingLicense] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Fetch pending license requests
  const { data: pendingLicenses, refetch: refetchPending, isLoading: isLoadingPending } = useQuery({
    queryKey: ['pending_licenses', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('fighter_licenses')
        .select(`
          *,
          fighter:fighter_id(
            *,
            user:user_id(email, phone, birthdate, country)
          ),
          license_documents!license_documents_license_id_fkey(id, file_path, document_type, file_name, created_at, mime_type)
        `)
        .eq('status', 'PENDING_REVIEW')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`license_number.ilike.%${searchTerm}%,fighter.first_name.ilike.%${searchTerm}%,fighter.last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch licenses with Fighter IDs (ACTIVE and SUSPENDED only)
  const { data: licenses, refetch, isLoading } = useQuery({
    queryKey: ['admin_licenses', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('fighter_licenses')
        .select(`
          *,
          fighter:fighter_id(first_name, last_name, nickname, weight_class, avatar_url),
          license_documents!license_documents_license_id_fkey(id, file_path, document_type),
          fight_bookings!fight_bookings_license_id_fkey(
            id,
            event_name,
            scheduled_date,
            venue,
            status,
            weight_class,
            fight_type,
            promoter
          )
        `)
        .in('status', ['ACTIVE', 'SUSPENDED'])
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`license_number.ilike.%${searchTerm}%,fighter.first_name.ilike.%${searchTerm}%,fighter.last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (isAdmin === false) return;

    const channel = supabase
      .channel('license-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fighter_licenses' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin_licenses'] });
          queryClient.invalidateQueries({ queryKey: ['pending_licenses'] });
          refetch();
          refetchPending();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, refetch, refetchPending, queryClient]);

  const updateLicenseState = async (licenseId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    if (!isAdmin) {
      toast({ 
        title: "Acceso Denegado", 
        description: "Solo los administradores pueden modificar licencias", 
        variant: "destructive" 
      });
      return;
    }

    setOptimisticUpdates(prev => ({ ...prev, [licenseId]: newStatus }));
    setLoadingStates(prev => ({ ...prev, [licenseId]: true }));
    
    try {
      if (newStatus === 'ACTIVE') {
        // Use the new synchronized approval function
        const { error } = await supabase.rpc('approve_license_with_sync', {
          p_license_id: licenseId,
          p_level: 'AMATEUR'
        });
        
        if (error) throw error;
        
        // Send approval email
        try {
          // Get license data - pendingLicenses has full user info
          let licenseData = pendingLicenses?.find(l => l.id === licenseId);
          
          // If not in pending (already moved to active), fetch it
          if (!licenseData) {
            const { data } = await supabase
              .from('fighter_licenses')
              .select(`
                *,
                fighter:fighter_id(
                  *,
                  user:user_id(email, phone, birthdate, country)
                )
              `)
              .eq('id', licenseId)
              .single();
            licenseData = data as any;
          }
          
          if (licenseData?.fighter?.user?.email) {
            const { error: emailError } = await supabase.functions.invoke('send-license-approval', {
              body: {
                license_id: licenseId,
                fighter_email: licenseData.fighter.user.email,
                fighter_name: `${licenseData.fighter.first_name} ${licenseData.fighter.last_name}`,
                license_number: licenseData.license_number,
                license_level: licenseData.license_level || 'AMATEUR',
                expires_at: licenseData.expires_at
              }
            });
            
            if (emailError) {
              console.error('Error sending approval email:', emailError);
              // Don't throw - email failure shouldn't prevent approval
            }
          }
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
          // Continue - email is not critical
        }
        
      } else if (newStatus === 'SUSPENDED') {
        await suspendLicense.mutateAsync({ 
          licenseId, 
          reason: 'Suspendida por administrador' 
        });
      }

      const statusText = newStatus === 'ACTIVE' ? 'Activada' : 'Suspendida';
      toast({ 
        title: "Licencia actualizada", 
        description: `Licencia ${statusText} exitosamente`,
        duration: 3000 
      });
      
      // Force a complete refresh to ensure state consistency
      await Promise.all([
        refetch(),
        refetchPending(),
        queryClient.invalidateQueries({ queryKey: ['admin_licenses'] }),
        queryClient.invalidateQueries({ queryKey: ['pending_licenses'] }),
        queryClient.invalidateQueries({ queryKey: ['license'] })
      ]);
      
    } catch (error: any) {
      console.error('Error updating license:', error);
      
      setOptimisticUpdates(prev => {
        const newState = { ...prev };
        delete newState[licenseId];
        return newState;
      });
      
      let errorMessage = error.message || 'Error desconocido';
      if (error.message?.includes('Unauthorized')) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      }
      
      toast({ 
        title: "Error al actualizar licencia", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [licenseId]: false }));
      
      setTimeout(() => {
        setOptimisticUpdates(prev => {
          const newState = { ...prev };
          delete newState[licenseId];
          return newState;
        });
      }, 1000);
    }
  };

  const openReviewModal = (license: any) => {
    setReviewingLicense(license);
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewingLicense(null);
    setReviewModalOpen(false);
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-fighter-success/20 text-fighter-success border-fighter-success/30 font-medium';
      case 'SUSPENDED': return 'bg-fighter-danger/20 text-fighter-danger border-fighter-danger/30 font-medium';
      case 'EXPIRED': return 'bg-fighter-accent/20 text-fighter-accent border-fighter-accent/30 font-medium';
      case 'PENDING_REVIEW': return 'bg-fighter-warning/20 text-fighter-warning border-fighter-warning/30 font-medium';
      default: return 'bg-fighter-accent/20 text-fighter-accent border-fighter-accent/30 font-medium';
    }
  };

  // Loading state while checking admin status
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verificando permisos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Peleadores con Fighter ID</h1>
        {!isAdmin && (
          <Badge variant="destructive" className="ml-2">
            <AlertCircle className="h-3 w-3 mr-1" />
            Sin permisos de administrador
          </Badge>
        )}
      </div>

      {!isAdmin && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Acceso Restringido</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              No tienes permisos de administrador para acceder a esta funcionalidad.
              Contacta a un administrador si necesitas acceso.
            </p>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <>
          {/* Pending License Requests */}
          <Card className="border-fighter-warning/30 bg-fighter-warning/5 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-fighter-warning">
                  <AlertCircle className="h-5 w-5" />
                  Solicitudes de Licencia Pendientes ({pendingLicenses?.length || 0})
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar solicitudes..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPending ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Cargando solicitudes...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingLicenses?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hay solicitudes de licencia pendientes</p>
                    </div>
                  ) : (
                    pendingLicenses?.map(license => {
                      const displayStatus = optimisticUpdates[license.id] || license.status;
                      
                      return (
                        <LicenseCard
                          key={license.id}
                          license={license}
                          isPending={true}
                          onReview={openReviewModal}
                          onApprove={(id) => updateLicenseState(id, 'ACTIVE')}
                          onReject={(id) => updateLicenseState(id, 'SUSPENDED')}
                          isLoading={loadingStates[license.id]}
                          isAdmin={isAdmin}
                          displayStatus={displayStatus}
                          getLicenseStatusColor={getLicenseStatusColor}
                        />
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active and Suspended Licenses */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Licencias con Fighter ID ({licenses?.length || 0})
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por licencia o nombre..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
              {licenses?.map(license => {
                const displayStatus = optimisticUpdates[license.id] || license.status;
                
                return (
                  <LicenseCard
                    key={license.id}
                    license={license}
                    isPending={false}
                    onActivate={(id) => updateLicenseState(id, 'ACTIVE')}
                    onSuspend={(id) => updateLicenseState(id, 'SUSPENDED')}
                    isLoading={loadingStates[license.id]}
                    isAdmin={isAdmin}
                    displayStatus={displayStatus}
                    getLicenseStatusColor={getLicenseStatusColor}
                  />
                );
              })}
                
                {!licenses?.length && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron licencias con esos criterios' : 'No hay licencias registradas'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {reviewingLicense && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Revisión de Solicitud de Licencia
                </DialogTitle>
                <DialogDescription>
                  Revisa todos los detalles antes de aprobar o rechazar la solicitud
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Perfil del Peleador</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                  <TabsTrigger value="license">Detalles de Licencia</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Información Personal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Fighter Photo */}
                      <div className="flex items-center gap-4">
                        <OptimizedImage
                          src={reviewingLicense.fighter?.avatar_url || ''}
                          alt={`${reviewingLicense.fighter?.first_name} ${reviewingLicense.fighter?.last_name}`}
                          className="w-20 h-20 rounded-full border-2 border-border object-cover"
                          fallbackIcon={
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                              <User className="h-10 w-10 text-muted-foreground" />
                            </div>
                          }
                        />
                        <div>
                          <h3 className="text-xl font-semibold">
                            {reviewingLicense.fighter?.first_name} {reviewingLicense.fighter?.last_name}
                          </h3>
                          {reviewingLicense.fighter?.nickname && (
                            <p className="text-muted-foreground">"{reviewingLicense.fighter.nickname}"</p>
                          )}
                        </div>
                      </div>

                      <Separator />

                       {/* Personal Details Grid */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <Label className="flex items-center gap-2">
                             <Calendar className="h-4 w-4" />
                             Fecha de Nacimiento
                           </Label>
                           <p className="text-sm bg-muted/50 p-2 rounded">
                             {reviewingLicense.fighter?.birthdate ? 
                               new Date(reviewingLicense.fighter.birthdate).toLocaleDateString() : 
                               reviewingLicense.fighter?.user?.birthdate ? 
                                 new Date(reviewingLicense.fighter.user.birthdate).toLocaleDateString() : 
                                 'No proporcionado'
                             }
                           </p>
                         </div>

                         <div className="space-y-2">
                           <Label className="flex items-center gap-2">
                             <Phone className="h-4 w-4" />
                             Teléfono
                           </Label>
                           <p className="text-sm bg-muted/50 p-2 rounded">
                             {reviewingLicense.fighter?.user?.phone || 'No proporcionado'}
                           </p>
                         </div>

                         <div className="space-y-2">
                           <Label className="flex items-center gap-2">
                             <MapPin className="h-4 w-4" />
                             País
                           </Label>
                           <p className="text-sm bg-muted/50 p-2 rounded">
                             {reviewingLicense.fighter?.country || reviewingLicense.fighter?.user?.country || 'No proporcionado'}
                           </p>
                         </div>

                         <div className="space-y-2">
                           <Label>Género</Label>
                           <p className="text-sm bg-muted/50 p-2 rounded">
                             {reviewingLicense.fighter?.gender || 'No proporcionado'}
                           </p>
                         </div>
                       </div>

                       <Separator />

                       {/* Physical & Combat Information */}
                       <div className="space-y-4">
                         <h4 className="font-medium text-sm flex items-center gap-2">
                           <Activity className="h-4 w-4" />
                           Información Física y de Combate
                         </h4>
                       
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label>Categoría de Peso</Label>
                             <p className="text-sm bg-muted/50 p-2 rounded">
                               {reviewingLicense.fighter?.weight_class}
                             </p>
                           </div>

                           <div className="space-y-2">
                             <Label>Nivel</Label>
                             <p className="text-sm bg-muted/50 p-2 rounded">
                               {reviewingLicense.fighter?.level || 'No proporcionado'}
                             </p>
                           </div>

                           <div className="space-y-2">
                             <Label>Altura (cm)</Label>
                             <p className="text-sm bg-muted/50 p-2 rounded">
                               {reviewingLicense.fighter?.height_cm || 'No proporcionado'}
                             </p>
                           </div>

                           <div className="space-y-2">
                             <Label>Peso (kg)</Label>
                             <p className="text-sm bg-muted/50 p-2 rounded">
                               {reviewingLicense.fighter?.weight_kg || 'No proporcionado'}
                             </p>
                           </div>

                           <div className="space-y-2">
                             <Label>Alcance (cm)</Label>
                             <p className="text-sm bg-muted/50 p-2 rounded">
                               {reviewingLicense.fighter?.reach_cm || 'No proporcionado'}
                             </p>
                           </div>

                           <div className="space-y-2">
                             <Label>Estilo de Pelea</Label>
                             <p className="text-sm bg-muted/50 p-2 rounded">
                               {reviewingLicense.fighter?.fighting_style || 'No proporcionado'}
                             </p>
                           </div>

                           <div className="space-y-2">
                             <Label>Gimnasio</Label>
                             <p className="text-sm bg-muted/50 p-2 rounded">
                               {reviewingLicense.fighter?.gym_name || 'No proporcionado'}
                             </p>
                           </div>

                           <div className="space-y-2">
                             <Label>Guardia</Label>
                             <p className="text-sm bg-muted/50 p-2 rounded">
                               {reviewingLicense.fighter?.stance || 'No proporcionado'}
                             </p>
                           </div>
                         </div>
                       </div>

                      {/* Fighting Record */}
                      <Separator />
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Récord de Peleas
                        </Label>
                        {reviewingLicense.fighter?.record_type && (
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                              Récord {reviewingLicense.fighter.record_type === 'PROFESIONAL' ? 'Profesional' : 'Amateur/Semi-profesional'}
                            </Badge>
                          </div>
                        )}
                         <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-fighter-success/10 rounded">
                            <div className="text-2xl font-bold text-fighter-success">
                              {reviewingLicense.fighter?.record_wins || 0}
                            </div>
                            <div className="text-sm text-fighter-success">Victorias</div>
                          </div>
                          <div className="text-center p-3 bg-fighter-danger/10 rounded">
                            <div className="text-2xl font-bold text-fighter-danger">
                              {reviewingLicense.fighter?.record_losses || 0}
                            </div>
                            <div className="text-sm text-fighter-danger">Derrotas</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded">
                            <div className="text-2xl font-bold text-muted-foreground">
                              {reviewingLicense.fighter?.record_draws || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Empates</div>
                          </div>
                         </div>
                      </div>

                      {/* Martial Arts */}
                      {reviewingLicense.fighter?.martial_arts && reviewingLicense.fighter.martial_arts.length > 0 && (
                        <div className="space-y-2">
                          <Label>Artes Marciales</Label>
                          <div className="flex flex-wrap gap-2">
                            {reviewingLicense.fighter.martial_arts.map((art: string) => (
                              <Badge key={art} variant="secondary">{art}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bio */}
                      {reviewingLicense.fighter?.bio && (
                        <div className="space-y-2">
                          <Label>Biografía</Label>
                          <p className="text-sm bg-muted/50 p-3 rounded whitespace-pre-wrap">
                            {reviewingLicense.fighter.bio}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos Subidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reviewingLicense.license_documents && reviewingLicense.license_documents.length > 0 ? (
                        <div className="grid gap-4">
                          {reviewingLicense.license_documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">
                                    {doc.document_type === 'identity' ? 'Documento de Identidad' : 
                                     doc.document_type === 'photo' ? 'Foto del Peleador' : 
                                     doc.document_type}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {doc.file_name} • Subido: {new Date(doc.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                               <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const bucketName = doc.document_type === 'photo' ? 'fighter-photos' : 'license-documents';
                                  const { data } = supabase.storage.from(bucketName).getPublicUrl(doc.file_path);
                                  window.open(data.publicUrl, '_blank');
                                }}
                               >
                                 <Download className="h-3 w-3 mr-1" />
                                 Ver
                               </Button>
                               
                               {/* Show image preview for image documents */}
                               {doc.mime_type && doc.mime_type.startsWith('image/') && (
                                 <div className="mt-2">
                                   <OptimizedImage
                                     src={supabase.storage.from(doc.document_type === 'photo' ? 'fighter-photos' : 'license-documents').getPublicUrl(doc.file_path).data.publicUrl}
                                     alt={`${doc.document_type} document`}
                                     className="w-32 h-32 object-cover rounded border"
                                   />
                                 </div>
                               )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-8 text-muted-foreground">
                          No se han subido documentos
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="license" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Información de la Licencia
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Número de Licencia</Label>
                          <p className="text-sm bg-muted/50 p-2 rounded font-mono">
                            {reviewingLicense.license_number}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Disciplina</Label>
                          <p className="text-sm bg-muted/50 p-2 rounded">
                            {reviewingLicense.discipline}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Nivel de Licencia</Label>
                          <p className="text-sm bg-muted/50 p-2 rounded">
                            {reviewingLicense.license_level}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Fecha de Solicitud</Label>
                          <p className="text-sm bg-muted/50 p-2 rounded">
                            {new Date(reviewingLicense.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Fecha de Vencimiento</Label>
                          <p className="text-sm bg-muted/50 p-2 rounded">
                            {reviewingLicense.expires_at ? 
                              new Date(reviewingLicense.expires_at).toLocaleDateString() : 
                              'No especificada'
                            }
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Estado Actual</Label>
                          <Badge className={getLicenseStatusColor(reviewingLicense.status)}>
                            {reviewingLicense.status}
                          </Badge>
                        </div>
                      </div>

                      {reviewingLicense.notes && (
                        <div className="space-y-2">
                          <Label>Notas</Label>
                          <p className="text-sm bg-muted/50 p-3 rounded whitespace-pre-wrap">
                            {reviewingLicense.notes}
                          </p>
                        </div>
                      )}

                      <Separator />

                      {/* Action Buttons in Modal */}
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="outline"
                          onClick={closeReviewModal}
                        >
                          Cerrar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            updateLicenseState(reviewingLicense.id, 'SUSPENDED');
                            closeReviewModal();
                          }}
                          disabled={loadingStates[reviewingLicense.id] || !isAdmin}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Rechazar Solicitud
                        </Button>
                        <Button
                          onClick={() => {
                            updateLicenseState(reviewingLicense.id, 'ACTIVE');
                            closeReviewModal();
                          }}
                          disabled={loadingStates[reviewingLicense.id] || !isAdmin}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Aprobar Licencia
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
