import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { useFightRequests, FightRequestWithDetails } from '@/hooks/useFightRequests';
import { useAppUserId } from '@/hooks/useAppUserId';
import { CheckCircle, XCircle, Clock, AlertTriangle, Search, Shield, Swords, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Borrador', color: 'bg-muted text-muted-foreground', icon: Clock },
  submitted: { label: 'Pendiente', color: 'bg-fighter-warning/20 text-fighter-warning', icon: Clock },
  under_review: { label: 'En Revisión', color: 'bg-fighter-info/20 text-fighter-info', icon: Search },
  approved: { label: 'Aprobada', color: 'bg-fighter-success/20 text-fighter-success', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'bg-destructive/20 text-destructive', icon: XCircle },
  cancelled: { label: 'Cancelada', color: 'bg-muted text-muted-foreground', icon: XCircle },
};

export default function FightApproval() {
  const [activeTab, setActiveTab] = useState('submitted');
  const { requests, loading, reviewRequest, validateEligibility } = useFightRequests(activeTab === 'all' ? undefined : activeTab);
  const { appUserId } = useAppUserId();
  const [selectedRequest, setSelectedRequest] = useState<FightRequestWithDetails | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const handleCheckEligibility = async (req: FightRequestWithDetails) => {
    if (!req.fighter_a_id || !req.fighter_b_id) {
      toast.error('Ambos peleadores deben ser seleccionados');
      return;
    }
    setCheckingEligibility(true);
    try {
      const result = await validateEligibility(req.fighter_a_id, req.fighter_b_id, req.weight_class);
      setEligibilityResult(result);
    } catch (err: any) {
      toast.error('Error al validar elegibilidad: ' + err.message);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleApprove = async (req: FightRequestWithDetails) => {
    if (!appUserId) return;
    await reviewRequest({ id: req.id, action: 'approved', reviewerId: appUserId });
    setSelectedRequest(null);
    setEligibilityResult(null);
  };

  const handleReject = async () => {
    if (!selectedRequest || !appUserId) return;
    await reviewRequest({ id: selectedRequest.id, action: 'rejected', reason: rejectionReason, reviewerId: appUserId });
    setShowRejectDialog(false);
    setSelectedRequest(null);
    setRejectionReason('');
    setEligibilityResult(null);
  };

  const getFighterName = (req: FightRequestWithDetails, corner: 'a' | 'b') => {
    const fighter = corner === 'a' ? req.fighter_a : req.fighter_b;
    const name = corner === 'a' ? req.fighter_a_name : req.fighter_b_name;
    if (fighter) return `${fighter.first_name} ${fighter.last_name}`;
    return name || 'TBD';
  };

  const pendingCount = requests.filter(r => r.status === 'submitted').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aprobación de Peleas"
        subtitle="Gestión de solicitudes de pelea con validación de elegibilidad"
        showBackButton={false}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Swords className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{requests.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-1 text-fighter-warning" />
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-1 text-fighter-success" />
            <p className="text-2xl font-bold">{requests.filter(r => r.status === 'approved').length}</p>
            <p className="text-xs text-muted-foreground">Aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <XCircle className="h-6 w-6 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold">{requests.filter(r => r.status === 'rejected').length}</p>
            <p className="text-xs text-muted-foreground">Rechazadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="submitted">Pendientes</TabsTrigger>
          <TabsTrigger value="under_review">En Revisión</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Cargando solicitudes...</p>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay solicitudes en esta categoría</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
                const sc = statusConfig[req.status] || statusConfig.draft;
                const StatusIcon = sc.icon;
                return (
                  <Card key={req.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedRequest(req)}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={sc.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {sc.label}
                            </Badge>
                            <Badge variant="outline">{req.discipline}</Badge>
                            <Badge variant="outline">{req.weight_class}</Badge>
                            {req.is_championship && <Badge className="bg-fighter-warning/20 text-fighter-warning">🏆 Campeonato</Badge>}
                          </div>
                          <p className="font-semibold">
                            {getFighterName(req, 'a')} <span className="text-muted-foreground">vs</span> {getFighterName(req, 'b')}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            {req.gym && <span>🏋️ {req.gym.nombre}</span>}
                            {req.event && <span>📅 {req.event.name}</span>}
                            <span>{format(new Date(req.created_at), 'dd MMM yyyy', { locale: es })}</span>
                          </div>
                        </div>
                        {req.status === 'submitted' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-green-400 border-green-400/30" onClick={(e) => { e.stopPropagation(); handleApprove(req); }}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); setShowRejectDialog(true); }}>
                              <XCircle className="h-4 w-4 mr-1" /> Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      {selectedRequest && !showRejectDialog && (
        <Dialog open={!!selectedRequest} onOpenChange={() => { setSelectedRequest(null); setEligibilityResult(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Solicitud</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Peleador A</p>
                  <p className="font-semibold">{getFighterName(selectedRequest, 'a')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Peleador B</p>
                  <p className="font-semibold">{getFighterName(selectedRequest, 'b')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Peso</p>
                  <p>{selectedRequest.weight_class}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rounds</p>
                  <p>{selectedRequest.number_of_rounds || 3}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p>{selectedRequest.fight_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Disciplina</p>
                  <p>{selectedRequest.discipline}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Notas</p>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.rejection_reason && (
                <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">Motivo de rechazo:</p>
                  <p className="text-sm">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {/* Eligibility Check */}
              {selectedRequest.fighter_a_id && selectedRequest.fighter_b_id && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCheckEligibility(selectedRequest)}
                    disabled={checkingEligibility}
                    className="w-full"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {checkingEligibility ? 'Verificando...' : 'Verificar Elegibilidad'}
                  </Button>

                  {eligibilityResult && (
                    <div className="mt-3 space-y-2">
                      <div className={`p-2 rounded text-sm font-medium ${eligibilityResult.eligible ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                        {eligibilityResult.eligible ? '✅ Ambos peleadores son elegibles' : '❌ No cumplen todos los requisitos'}
                      </div>
                      <div className="space-y-1">
                        {(eligibilityResult.checks || []).map((check: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {check.passed ? <CheckCircle className="h-3.5 w-3.5 text-green-400" /> : <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                            <span className={check.passed ? 'text-muted-foreground' : 'text-destructive'}>{check.label}: {check.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              {selectedRequest.status === 'submitted' && (
                <>
                  <Button variant="outline" onClick={() => { setShowRejectDialog(true); }}>
                    <XCircle className="h-4 w-4 mr-1" /> Rechazar
                  </Button>
                  <Button onClick={() => handleApprove(selectedRequest)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Motivo del rechazo..."
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
