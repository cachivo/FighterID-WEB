import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

const DISCIPLINES = ['MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro'];

export default function ValidacionLicencias() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { approveLicense, suspendLicense } = useAdminLicenseActions();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reviewingLicense, setReviewingLicense] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  
  // Form state for creating/updating licenses
  const [fighterId, setFighterId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [discipline, setDiscipline] = useState<'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro'>('MMA');
  const [status, setStatus] = useState<'ACTIVE'|'SUSPENDED'|'EXPIRED'|'PENDING_REVIEW'>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

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
          license_documents(id, file_path, document_type, file_name, created_at)
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
          license_documents(id, file_path, document_type)
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

  // Fetch only fighters with active licenses for dropdown
  const { data: fighters } = useQuery({
    queryKey: ['fighters_with_licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select(`
          id, first_name, last_name, nickname,
          fighter_licenses!inner(status)
        `)
        .eq('active', true)
        .in('fighter_licenses.status', ['ACTIVE', 'SUSPENDED'])
        .order('first_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Check admin permissions
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data: appUser, error } = await supabase
          .from('app_user')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(appUser?.is_admin ?? false);
      } catch (error) {
        console.error('Error in checkAdminStatus:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  // Set up real-time subscription for license updates
  useEffect(() => {
    const channel = supabase
      .channel('license-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fighter_licenses'
        },
        (payload) => {
          console.log('License change detected:', payload);
          // Invalidate and refetch the licenses query
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
  }, [queryClient, refetch]);

  const createOrUpdateLicense = async () => {
    if (!fighterId || !licenseNumber) {
      toast({ title: "Error", description: "Fighter ID y número de licencia son requeridos", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        fighter_id: fighterId,
        license_number: licenseNumber,
        discipline: discipline as any,
        status,
        notes: notes || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      const { error } = await supabase.from('fighter_licenses').insert(payload);
      
      if (error) throw error;

      toast({ title: "Licencia creada", description: "La licencia ha sido emitida exitosamente" });
      
      // Reset form
      setFighterId('');
      setLicenseNumber('');
      setDiscipline('MMA');
      setStatus('ACTIVE');
      setNotes('');
      setExpiresAt('');
      
      refetch();
      refetchPending();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateLicenseState = async (licenseId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    // Check admin permissions first
    if (!isAdmin) {
      toast({ 
        title: "Acceso Denegado", 
        description: "Solo los administradores pueden modificar licencias", 
        variant: "destructive" 
      });
      return;
    }

    // Optimistic update
    setOptimisticUpdates(prev => ({ ...prev, [licenseId]: newStatus }));
    setLoadingStates(prev => ({ ...prev, [licenseId]: true }));
    
    try {
      if (newStatus === 'ACTIVE') {
        console.log('Approving license:', licenseId);
        await approveLicense.mutateAsync({ 
          licenseId, 
          level: 'AMATEUR' // Default level, could be made configurable
        });
      } else if (newStatus === 'SUSPENDED') {
        console.log('Suspending license:', licenseId);
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
      
      // Force a refetch and invalidate related queries
      await refetch();
      await refetchPending();
      queryClient.invalidateQueries({ queryKey: ['admin_licenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending_licenses'] });
      
    } catch (error: any) {
      console.error('Error updating license:', error);
      
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const newState = { ...prev };
        delete newState[licenseId];
        return newState;
      });
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message?.includes('Unauthorized')) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      } else if (error.message?.includes('admin')) {
        errorMessage = 'Solo los administradores pueden aprobar licencias';
      }
      
      toast({ 
        title: "Error al actualizar licencia", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [licenseId]: false }));
      
      // Clear optimistic update after a short delay
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
      case 'PENDING_REVIEW': return 'bg-fighter-warning/20 text-amber-700 border-fighter-warning/30 font-medium';
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
          {/* Create License Form */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Emitir Nueva Licencia
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fighter_select">Peleador</Label>
                <Select value={fighterId} onValueChange={setFighterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un peleador" />
                  </SelectTrigger>
                  <SelectContent>
                    {fighters?.map(fighter => (
                      <SelectItem key={fighter.id} value={fighter.id}>
                        {fighter.first_name} {fighter.last_name}
                        {fighter.nickname ? ` "${fighter.nickname}"` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">Número de Licencia</Label>
                <Input 
                  placeholder="FGT-2025-123" 
                  value={licenseNumber} 
                  onChange={e => setLicenseNumber(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discipline_select">Disciplina</Label>
                <Select value={discipline} onValueChange={(v) => setDiscipline(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state_select">Estado</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING_REVIEW">Pendiente</SelectItem>
                    <SelectItem value="ACTIVE">Activa</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                    <SelectItem value="EXPIRED">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Fecha de Expiración</Label>
                <Input 
                  type="date" 
                  value={expiresAt} 
                  onChange={e => setExpiresAt(e.target.value)} 
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea 
                  placeholder="Información adicional sobre la licencia..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Button onClick={createOrUpdateLicense} className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  Emitir Licencia
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending License Requests */}
          <Card className="border-amber-200 bg-amber-50/50 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-amber-700">
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
                      const fighterPhoto = license.license_documents?.find(doc => doc.document_type === 'photo');
                      const photoUrl = fighterPhoto ? 
                        supabase.storage.from('fighter-photos').getPublicUrl(fighterPhoto.file_path).data.publicUrl :
                        license.fighter?.avatar_url;
                      
                      return (
                        <div key={license.id} className="flex items-center gap-4 p-4 rounded-lg border border-amber-200 bg-white">
                          {/* Fighter Avatar */}
                          <div className="flex-shrink-0">
                            <OptimizedImage
                              src={photoUrl || ''}
                              alt={`${license.fighter?.first_name} ${license.fighter?.last_name}`}
                              className="w-12 h-12 rounded-full border-2 border-border object-cover"
                              fallbackIcon={
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                                  <User className="h-6 w-6 text-muted-foreground" />
                                </div>
                              }
                              priority={false}
                            />
                          </div>
                          
                          {/* License Information */}
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="font-medium">{license.license_number}</div>
                              <Badge className={getLicenseStatusColor(displayStatus)}>
                                PENDIENTE REVISIÓN
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <strong>Peleador:</strong> {license.fighter?.first_name} {license.fighter?.last_name}
                              {license.fighter?.nickname ? ` "${license.fighter.nickname}"` : ''}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <strong>Categoría:</strong> {license.fighter?.weight_class} • 
                              <strong> Disciplina:</strong> {license.discipline} • 
                              <strong> Solicitada:</strong> {new Date(license.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex-shrink-0 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReviewModal(license)}
                              className="border-blue-200 hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Revisar
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateLicenseState(license.id, 'ACTIVE')}
                              disabled={loadingStates[license.id] || !isAdmin}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {loadingStates[license.id] && optimisticUpdates[license.id] === 'ACTIVE' ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : null}
                              Aprobar
                            </Button>
                            <Button
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateLicenseState(license.id, 'SUSPENDED')}
                              disabled={loadingStates[license.id] || !isAdmin}
                            >
                              {loadingStates[license.id] && optimisticUpdates[license.id] === 'SUSPENDED' ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : null}
                              Rechazar
                            </Button>
                          </div>
                        </div>
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
                // Use optimistic update if available, otherwise use actual status
                const displayStatus = optimisticUpdates[license.id] || license.status;
                
                // Get the fighter photo from license documents (priority) or fighter profile avatar
                const fighterPhoto = license.license_documents?.find(doc => doc.document_type === 'photo');
                const photoUrl = fighterPhoto ? 
                  supabase.storage.from('fighter-photos').getPublicUrl(fighterPhoto.file_path).data.publicUrl :
                  license.fighter?.avatar_url;
                
                return (
                  <div key={license.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card/50">
                    {/* Fighter Avatar */}
                    <div className="flex-shrink-0">
                      <OptimizedImage
                        src={photoUrl || ''}
                        alt={`${license.fighter?.first_name} ${license.fighter?.last_name}`}
                        className="w-12 h-12 rounded-full border-2 border-border object-cover"
                        fallbackIcon={
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                            <User className="h-6 w-6 text-muted-foreground" />
                          </div>
                        }
                        priority={false}
                      />
                      </div>
                      
                      {/* License Information */}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{license.license_number}</div>
                          <Badge className={getLicenseStatusColor(displayStatus)}>
                            {displayStatus}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>Peleador:</strong> {license.fighter?.first_name} {license.fighter?.last_name}
                          {license.fighter?.nickname ? ` "${license.fighter.nickname}"` : ''}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>Disciplina:</strong> {license.discipline} | 
                          <strong> División:</strong> {license.fighter?.weight_class} | 
                          <strong> Expira:</strong> {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'N/A'}
                        </div>
                        {license.notes && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Notas:</strong> {license.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {displayStatus !== 'ACTIVE' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateLicenseState(license.id, 'ACTIVE')}
                            disabled={loadingStates[license.id] || !isAdmin}
                            className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white disabled:opacity-50"
                            title={!isAdmin ? "Solo administradores pueden activar licencias" : ""}
                          >
                            {loadingStates[license.id] ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Activando...
                              </>
                            ) : (
                              'Activar'
                            )}
                          </Button>
                        )}
                        {displayStatus === 'ACTIVE' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateLicenseState(license.id, 'SUSPENDED')}
                            disabled={loadingStates[license.id] || !isAdmin}
                            className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
                            title={!isAdmin ? "Solo administradores pueden suspender licencias" : ""}
                          >
                            {loadingStates[license.id] ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Suspendiendo...
                              </>
                            ) : (
                              'Suspender'
                            )}
                          </Button>
                        )}
                        
                        {/* Delete License Button */}
                        <div className="ml-auto">
                          <DeleteLicenseDialog
                            licenseId={license.id}
                            fighterName={`${license.fighter?.first_name} ${license.fighter?.last_name}`}
                            onSuccess={() => refetch()}
                          />
                        </div>
                      </div>
                    </div>
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
                            <Phone className="h-4 w-4" />
                            Teléfono
                          </Label>
                          <p className="text-sm bg-muted/50 p-2 rounded">
                            {reviewingLicense.fighter?.user?.phone || 'No proporcionado'}
                          </p>
                        </div>

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
                          <Label>Stance</Label>
                          <p className="text-sm bg-muted/50 p-2 rounded">
                            {reviewingLicense.fighter?.stance || 'No proporcionado'}
                          </p>
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
                          <div className="text-center p-3 bg-green-50 rounded">
                            <div className="text-2xl font-bold text-green-600">
                              {reviewingLicense.fighter?.record_wins || 0}
                            </div>
                            <div className="text-sm text-green-700">Victorias</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded">
                            <div className="text-2xl font-bold text-red-600">
                              {reviewingLicense.fighter?.record_losses || 0}
                            </div>
                            <div className="text-sm text-red-700">Derrotas</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-2xl font-bold text-gray-600">
                              {reviewingLicense.fighter?.record_draws || 0}
                            </div>
                            <div className="text-sm text-gray-700">Empates</div>
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