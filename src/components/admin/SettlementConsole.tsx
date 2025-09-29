import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Upload, 
  FileText, 
  Users, 
  DollarSign,
  Camera,
  Shield,
  Lock,
  Unlock
} from 'lucide-react';

interface Market {
  id: string;
  title: string;
  description?: string;
  state: string;
  event_id: string;
  rake: number;
  created_at: string;
  outcomes?: Outcome[];
  event?: { name: string; discipline: string };
  totalPool?: number;
  activeTickets?: number;
}

interface Outcome {
  id: string;
  label: string;
  pool: number;
  active: boolean;
  market_id: string;
}

interface SettlementRequest {
  id?: string;
  market_id: string;
  winning_outcome_id: string;
  evidence_url?: string;
  evidence_description?: string;
  admin1_id?: string;
  admin2_id?: string;
  admin1_confirmed?: boolean;
  admin2_confirmed?: boolean;
  status: 'PENDING' | 'DUAL_CONFIRMED' | 'SETTLED' | 'DISPUTED';
  created_at?: string;
}

export function SettlementConsole() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [winningOutcome, setWinningOutcome] = useState<string>('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingSettlements, setPendingSettlements] = useState<SettlementRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchSettleableMarkets();
    fetchPendingSettlements();
    getCurrentUser();
    
    // Hotkey bindings
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            fetchSettleableMarkets();
            toast({ title: 'Datos actualizados', description: 'Mercados refrescados' });
            break;
          case 's':
            e.preventDefault();
            if (selectedMarket && winningOutcome) {
              setConfirmDialogOpen(true);
            }
            break;
          case 'Escape':
            setSelectedMarket(null);
            setWinningOutcome('');
            setEvidenceDescription('');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedMarket, winningOutcome]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user?.id || '');
  };

  const fetchSettleableMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('market')
        .select(`
          *,
          bdg_event!inner(name, discipline),
          outcome(*),
          bet_ticket!market_id(count)
        `)
        .in('state', ['closed', 'suspended'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedMarkets = data?.map(market => ({
        ...market,
        event: market.bdg_event,
        outcomes: market.outcome,
        totalPool: market.outcome?.reduce((sum: number, o: any) => sum + o.pool, 0) || 0,
        activeTickets: market.bet_ticket?.[0]?.count || 0
      })) || [];
      
      setMarkets(formattedMarkets);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los mercados',
        variant: 'destructive',
      });
    }
  };

  const fetchPendingSettlements = async () => {
    try {
      // Mock data for demonstration - in real app would fetch from settlement_request table
      const mockData: SettlementRequest[] = [
        {
          id: '1',
          market_id: '1',
          winning_outcome_id: '1',
          status: 'PENDING',
          admin1_id: 'admin1',
          admin1_confirmed: true,
          admin2_confirmed: false,
          created_at: new Date().toISOString()
        }
      ];
      setPendingSettlements(mockData);
    } catch (error) {
      console.error('Error fetching pending settlements:', error);
    }
  };

  const uploadEvidence = async (file: File): Promise<string | null> => {
    try {
      const fileName = `evidence/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('evidence')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const submitSettlement = async () => {
    if (!selectedMarket || !winningOutcome) return;
    
    try {
      setLoading(true);
      
      // Upload evidence if provided
      let evidenceUrl = null;
      if (evidenceFile) {
        evidenceUrl = await uploadEvidence(evidenceFile);
        if (!evidenceUrl) {
          toast({
            title: 'Error',
            description: 'Error al subir evidencia',
            variant: 'destructive',
          });
          return;
        }
      }
      
      // Mock settlement creation - in real app would insert into settlement_request table
      toast({
        title: 'Solicitud Enviada',
        description: 'Esperando confirmación del segundo administrador',
      });
      
      setConfirmDialogOpen(false);
      resetForm();
      fetchPendingSettlements();
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la solicitud',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmSettlement = async (requestId: string) => {
    try {
      setLoading(true);
      
      // Mock settlement confirmation - in real app would update settlement_request table
      const request = pendingSettlements.find(r => r.id === requestId);
      if (request) {
        const { error: settleError } = await supabase.rpc('settle_market_payouts', {
          p_market_id: request.market_id,
          p_winning_outcome_id: request.winning_outcome_id
        });
        
        if (settleError) throw settleError;
      }
      
      toast({
        title: '¡Mercado Liquidado!',
        description: 'Pagos distribuidos automáticamente',
      });
      
      fetchSettleableMarkets();
      fetchPendingSettlements();
      
    } catch (error) {
      toast({
        title: 'Error en Liquidación',
        description: 'No se pudo completar la liquidación',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMarket(null);
    setWinningOutcome('');
    setEvidenceFile(null);
    setEvidenceDescription('');
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'DUAL_CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'SETTLED': return 'bg-green-100 text-green-800';
      case 'DISPUTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canConfirm = (request: SettlementRequest) => {
    return request.status === 'PENDING' && 
           request.admin1_id !== currentUser && 
           !request.admin2_confirmed;
  };

  return (
    <div className="space-y-6">
      {/* Hotkeys Help */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Console de Liquidación
              </CardTitle>
              <CardDescription>
                Sistema de liquidación dual-admin con evidencia verificable
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Hotkeys: Ctrl+R (refresh) • Ctrl+S (settle) • Esc (cancel)
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Pending Settlements */}
      {pendingSettlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Liquidaciones Pendientes ({pendingSettlements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSettlements.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{(request as any).market?.title}</h4>
                        <Badge className={getStateColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ganador: {(request as any).outcome?.label}
                      </p>
                      {request.evidence_description && (
                        <p className="text-sm text-muted-foreground">
                          Evidencia: {request.evidence_description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Admin 1: {request.admin1_confirmed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Admin 2: {request.admin2_confirmed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {request.evidence_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={request.evidence_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {canConfirm(request) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Confirmar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Liquidación</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Confirmas la liquidación de este mercado? Esta acción ejecutará
                                automáticamente los pagos y no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => confirmSettlement(request.id!)}>
                                Confirmar Liquidación
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Markets Ready for Settlement */}
      <Card>
        <CardHeader>
          <CardTitle>Mercados Listos para Liquidar</CardTitle>
          <CardDescription>
            Mercados cerrados o suspendidos esperando liquidación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mercado</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pool Total</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {markets.map((market) => (
                <TableRow key={market.id} className={selectedMarket?.id === market.id ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{market.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Rake: {(market.rake * 100).toFixed(1)}%
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{market.event?.name}</p>
                      <p className="text-sm text-muted-foreground">{market.event?.discipline}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={market.state === 'closed' ? 'default' : 'secondary'}>
                      {market.state}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {market.totalPool?.toFixed(2)} BDG
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {market.activeTickets} tickets
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => setSelectedMarket(market)}
                      variant={selectedMarket?.id === market.id ? 'default' : 'outline'}
                    >
                      {selectedMarket?.id === market.id ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      {selectedMarket?.id === market.id ? 'Seleccionado' : 'Seleccionar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Settlement Form */}
      {selectedMarket && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Liquidar: {selectedMarket.title}</CardTitle>
            <CardDescription>
              Selecciona el outcome ganador y proporciona evidencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Outcome Ganador</Label>
              <Select value={winningOutcome} onValueChange={setWinningOutcome}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ganador" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMarket.outcomes?.map(outcome => (
                    <SelectItem key={outcome.id} value={outcome.id}>
                      {outcome.label} (Pool: {outcome.pool.toFixed(2)} BDG)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Evidencia (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="file"
                    accept="image/*,video/*,.pdf"
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Imágenes, videos o PDFs
                  </p>
                </div>
                <Textarea
                  placeholder="Descripción de la evidencia..."
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  className="min-h-0 h-10"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setConfirmDialogOpen(true)}
                disabled={!winningOutcome}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Iniciar Liquidación
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Liquidación</DialogTitle>
            <DialogDescription>
              Revisa los detalles antes de enviar la solicitud de liquidación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <strong>Mercado:</strong> {selectedMarket?.title}
            </div>
            <div>
              <strong>Ganador:</strong> {
                selectedMarket?.outcomes?.find(o => o.id === winningOutcome)?.label
              }
            </div>
            {evidenceDescription && (
              <div>
                <strong>Evidencia:</strong> {evidenceDescription}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Esta solicitud requerirá la confirmación de un segundo administrador antes de ejecutarse.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitSettlement} disabled={loading}>
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}