import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, CheckCircle, XCircle, Clock, FileText, Activity, 
  FlaskConical, MessageSquare, Trophy, Filter, RefreshCw 
} from 'lucide-react';
import { usePendingChanges, StatusFilter } from '@/hooks/usePendingChanges';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PendingChangesHub() {
  const {
    profileChanges,
    fighterUpdates,
    dopingTests,
    loading,
    statusFilter,
    stats,
    applyStatusFilter,
    fetchProfileChanges,
    fetchFighterUpdates,
    fetchDopingTests,
    updateProfileChangeStatus,
    moderateFighterUpdate,
    verifyDopingTest,
    totalPending
  } = usePendingChanges();

  const [selectedChange, setSelectedChange] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogType, setDialogType] = useState<'profile' | 'update' | 'doping' | null>(null);

  const handleApproveProfileChange = async () => {
    if (!selectedChange) return;
    setIsProcessing(true);
    try {
      await updateProfileChangeStatus(selectedChange.id, 'APPROVED', adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectProfileChange = async () => {
    if (!selectedChange) return;
    setIsProcessing(true);
    try {
      await updateProfileChangeStatus(selectedChange.id, 'REJECTED', adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedChange) return;
    if (!adminNotes.trim()) {
      return; // Require notes when requesting info
    }
    setIsProcessing(true);
    try {
      await updateProfileChangeStatus(selectedChange.id, 'REQUIRES_INFO', adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveFighterUpdate = async () => {
    if (!selectedChange) return;
    setIsProcessing(true);
    try {
      await moderateFighterUpdate(selectedChange.id, 'APPROVED', adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectFighterUpdate = async () => {
    if (!selectedChange) return;
    setIsProcessing(true);
    try {
      await moderateFighterUpdate(selectedChange.id, 'REJECTED', adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyDopingTest = async (resultStatus: 'CLEAN' | 'POSITIVE') => {
    if (!selectedChange) return;
    setIsProcessing(true);
    try {
      await verifyDopingTest(selectedChange.id, resultStatus, adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const refreshAll = () => {
    fetchProfileChanges();
    fetchFighterUpdates();
    fetchDopingTests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3" />Pendiente</Badge>;
      case 'APPROVED':
      case 'APPLIED':
      case 'CLEAN':
        return <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3" />Aprobado</Badge>;
      case 'REJECTED':
      case 'POSITIVE':
        return <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3" />Rechazado</Badge>;
      case 'REQUIRES_INFO':
        return <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/30"><MessageSquare className="h-3 w-3" />Requiere Info</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderChangeDiff = (current: any, requested: any) => {
    const changes = [];
    const hasRecordChanges = Object.keys(requested).some(field => 
      ['record_wins', 'record_losses', 'record_draws', 'record_type'].includes(field)
    );

    // Special section for record changes
    if (hasRecordChanges) {
      changes.push(
        <Alert key="record-alert" className="bg-amber-50 border-amber-200 mb-4">
          <Trophy className="h-4 w-4 text-amber-600" />
          <AlertTitle>Cambio de Récord de Peleas</AlertTitle>
          <AlertDescription>
            Verificar resultado oficial de pelea antes de aprobar
          </AlertDescription>
        </Alert>,
        <div key="record-comparison" className="border rounded-lg p-4 bg-amber-50/50 mb-4">
          <h4 className="font-medium mb-4 text-amber-700">Récord de Peleas</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Récord Actual</Label>
              <p className="text-lg mt-1">
                {current?.record_wins || 0}-{current?.record_losses || 0}-{current?.record_draws || 0} ({current?.record_type || 'N/A'})
              </p>
            </div>
            <div>
              <Label className="font-semibold">Récord Solicitado</Label>
              <p className="text-lg text-amber-600 font-semibold mt-1">
                {(requested.record_wins ?? current?.record_wins) || 0}-
                {(requested.record_losses ?? current?.record_losses) || 0}-
                {(requested.record_draws ?? current?.record_draws) || 0} ({(requested.record_type ?? current?.record_type) || 'N/A'})
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Other field changes
    for (const key in requested) {
      if (['record_wins', 'record_losses', 'record_draws', 'record_type'].includes(key)) continue;
      if (requested[key] !== current?.[key]) {
        changes.push(
          <div key={key} className="flex justify-between items-center py-2 border-b">
            <span className="font-medium text-sm capitalize">{key.replace(/_/g, ' ')}</span>
            <div className="flex gap-2 items-center text-sm">
              <span className="text-muted-foreground line-through">
                {Array.isArray(current?.[key]) ? current?.[key]?.join(', ') : current?.[key] || 'N/A'}
              </span>
              <span>→</span>
              <span className="text-primary font-medium">
                {Array.isArray(requested[key]) ? requested[key]?.join(', ') : requested[key]}
              </span>
            </div>
          </div>
        );
      }
    }
    return changes;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Centro de Moderación
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestiona todas las solicitudes y cambios pendientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Badge variant={totalPending > 0 ? "destructive" : "secondary"} className="text-base sm:text-lg px-3 py-1">
            {totalPending} Pendientes
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => applyStatusFilter('ALL')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Total</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:border-yellow-500 transition-colors ${statusFilter === 'PENDING' ? 'border-yellow-500 bg-yellow-500/5' : ''}`} onClick={() => applyStatusFilter('PENDING')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:border-green-500 transition-colors ${statusFilter === 'APPROVED' ? 'border-green-500 bg-green-500/5' : ''}`} onClick={() => applyStatusFilter('APPROVED')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Aprobados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:border-red-500 transition-colors ${statusFilter === 'REJECTED' ? 'border-red-500 bg-red-500/5' : ''}`} onClick={() => applyStatusFilter('REJECTED')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Rechazados</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:border-blue-500 transition-colors ${statusFilter === 'REQUIRES_INFO' ? 'border-blue-500 bg-blue-500/5' : ''}`} onClick={() => applyStatusFilter('REQUIRES_INFO')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Requiere Info</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">{stats.requiresInfo}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtrar por estado:</span>
        <Select value={statusFilter} onValueChange={(value) => applyStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="APPROVED">Aprobados</SelectItem>
            <SelectItem value="REJECTED">Rechazados</SelectItem>
            <SelectItem value="REQUIRES_INFO">Requiere Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Perfiles</span>
            <Badge variant="secondary">{profileChanges.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Updates</span>
            <Badge variant="secondary">{fighterUpdates.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="doping" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">Dopaje</span>
            <Badge variant="secondary">{dopingTests.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Profile Changes Tab */}
        <TabsContent value="profiles" className="space-y-4">
          {loading ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">Cargando...</CardContent></Card>
          ) : profileChanges.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No hay solicitudes de cambio de perfil {statusFilter !== 'ALL' ? `con estado "${statusFilter}"` : ''}
              </CardContent>
            </Card>
          ) : (
            profileChanges.map((change) => (
              <Card key={change.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={change.fighter_profiles?.avatar_url} />
                        <AvatarFallback>
                          {change.fighter_profiles?.first_name?.[0]}
                          {change.fighter_profiles?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {change.fighter_profiles?.first_name} {change.fighter_profiles?.last_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {format(new Date(change.created_at), "PPp", { locale: es })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(change.status)}
                      {change.requested_changes?.record_wins !== undefined && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs flex items-center gap-1">
                          Récord
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Cambios solicitados: {Object.keys(change.requested_changes).length}
                    </p>
                    {change.admin_notes && (
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <span className="font-medium">Notas:</span> {change.admin_notes}
                      </p>
                    )}
                    <Button
                      onClick={() => {
                        setSelectedChange(change);
                        setDialogType('profile');
                      }}
                      className="w-full sm:w-auto"
                    >
                      Revisar Cambios
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Fighter Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          {loading ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">Cargando...</CardContent></Card>
          ) : fighterUpdates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No hay actualizaciones de peleadores {statusFilter !== 'ALL' ? `con estado "${statusFilter}"` : ''}
              </CardContent>
            </Card>
          ) : (
            fighterUpdates.map((update) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={update.fighter_profiles?.avatar_url} />
                        <AvatarFallback>
                          {update.fighter_profiles?.first_name?.[0]}
                          {update.fighter_profiles?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {update.fighter_profiles?.first_name} {update.fighter_profiles?.last_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {format(new Date(update.created_at), "PPp", { locale: es })}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(update.review_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3 line-clamp-2">{update.content}</p>
                  {update.image_url && (
                    <img 
                      src={update.image_url} 
                      alt="Update" 
                      className="rounded-lg max-h-48 object-cover mb-3"
                    />
                  )}
                  <Button
                    onClick={() => {
                      setSelectedChange(update);
                      setDialogType('update');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Moderar
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Doping Tests Tab */}
        <TabsContent value="doping" className="space-y-4">
          {loading ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">Cargando...</CardContent></Card>
          ) : dopingTests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No hay tests de dopaje {statusFilter !== 'ALL' ? `con estado "${statusFilter}"` : ''}
              </CardContent>
            </Card>
          ) : (
            dopingTests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {test.fighter_licenses?.fighter_profiles?.first_name}{' '}
                        {test.fighter_licenses?.fighter_profiles?.last_name}
                      </CardTitle>
                      <CardDescription>
                        {test.test_type} - {test.testing_agency}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(test.test_date), "PPP", { locale: es })}
                      </p>
                    </div>
                    {getStatusBadge(test.result_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      setSelectedChange(test);
                      setDialogType('doping');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Verificar Test
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Profile Change Dialog */}
      <Dialog open={dialogType === 'profile'} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar Cambios de Perfil</DialogTitle>
            <DialogDescription>
              Revisa los cambios solicitados y aprueba, rechaza o solicita más información
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <div className="space-y-2">
                {renderChangeDiff(
                  selectedChange.fighter_profiles,
                  selectedChange.requested_changes
                )}
              </div>
              
              {/* Existing Admin Notes */}
              {selectedChange.admin_notes && (
                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2 text-sm">Notas Previas:</h4>
                  <p className="text-sm">{selectedChange.admin_notes}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium">Notas del Admin</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agrega notas opcionales..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedChange?.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleRequestInfo}
                  disabled={isProcessing || !adminNotes.trim()}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Solicitar Info
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectProfileChange}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  onClick={handleApproveProfileChange}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprobar
                </Button>
              </>
            )}
            {selectedChange?.status !== 'PENDING' && (
              <Button variant="outline" onClick={() => setDialogType(null)}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fighter Update Dialog */}
      <Dialog open={dialogType === 'update'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderar Actualización</DialogTitle>
            <DialogDescription>
              Revisa el contenido y decide si aprobarlo o rechazarlo
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <div>
                <p className="text-sm">{selectedChange.content}</p>
                {selectedChange.image_url && (
                  <img 
                    src={selectedChange.image_url} 
                    alt="Update" 
                    className="rounded-lg mt-3 max-h-64 object-cover"
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Notas del Admin</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agrega notas opcionales..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedChange?.review_status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleRejectFighterUpdate}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  onClick={handleApproveFighterUpdate}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprobar
                </Button>
              </>
            )}
            {selectedChange?.review_status !== 'PENDING' && (
              <Button variant="outline" onClick={() => setDialogType(null)}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doping Test Dialog */}
      <Dialog open={dialogType === 'doping'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Test de Dopaje</DialogTitle>
            <DialogDescription>
              Revisa el test y marca el resultado
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p><span className="font-medium">Tipo:</span> {selectedChange.test_type}</p>
                <p><span className="font-medium">Agencia:</span> {selectedChange.testing_agency}</p>
                <p><span className="font-medium">Fecha:</span> {format(new Date(selectedChange.test_date), "PPP", { locale: es })}</p>
                {selectedChange.report_file_url && (
                  <a 
                    href={selectedChange.report_file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Ver reporte →
                  </a>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agrega observaciones..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedChange?.result_status === 'PENDING' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleVerifyDopingTest('POSITIVE')}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Positivo
                </Button>
                <Button
                  onClick={() => handleVerifyDopingTest('CLEAN')}
                  disabled={isProcessing}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Limpio
                </Button>
              </>
            )}
            {selectedChange?.result_status !== 'PENDING' && (
              <Button variant="outline" onClick={() => setDialogType(null)}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
