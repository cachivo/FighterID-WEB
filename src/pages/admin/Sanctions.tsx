import { useState } from 'react';
import { useDiscipline } from '@/contexts/DisciplineContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useSanctions, type CreateSanctionInput, type Sanction } from '@/hooks/useSanctions';
import { Shield, Plus, Search, AlertTriangle, Ban, DollarSign, FileWarning } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/page-header';

const SANCTION_TYPE_LABELS: Record<string, string> = {
  suspension: 'Suspensión',
  fine: 'Multa',
  warning: 'Advertencia',
  license_revocation: 'Revocación de Licencia',
  ban: 'Prohibición',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierta',
  under_review: 'En Revisión',
  decided: 'Decidida',
  appealed: 'Apelada',
  closed: 'Cerrada',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  fighter: 'Peleador',
  coach: 'Entrenador',
  official: 'Oficial',
  gym: 'Gimnasio',
  organization: 'Organización',
};

const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'open': return 'destructive';
    case 'under_review': return 'secondary';
    case 'decided': return 'default';
    case 'appealed': return 'outline';
    case 'closed': return 'secondary';
    default: return 'default';
  }
};

const sanctionIcon = (type: string) => {
  switch (type) {
    case 'suspension': return <Ban className="h-4 w-4" />;
    case 'fine': return <DollarSign className="h-4 w-4" />;
    case 'warning': return <FileWarning className="h-4 w-4" />;
    case 'ban': return <AlertTriangle className="h-4 w-4" />;
    default: return <Shield className="h-4 w-4" />;
  }
};

function CreateSanctionDialog({ onCreated }: { onCreated: () => void }) {
  const { createSanction } = useSanctions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateSanctionInput>({
    target_type: 'fighter',
    target_id: '',
    sanction_type: 'warning',
    severity: 1,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.target_id || !form.reason) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    try {
      setSubmitting(true);
      await createSanction(form);
      toast.success('Sanción creada exitosamente');
      setOpen(false);
      setForm({ target_type: 'fighter', target_id: '', sanction_type: 'warning', severity: 1, reason: '' });
      onCreated();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Nueva Sanción</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Sanción</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Objetivo</Label>
              <Select value={form.target_type} onValueChange={v => setForm(f => ({ ...f, target_type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID del Objetivo *</Label>
              <Input value={form.target_id} onChange={e => setForm(f => ({ ...f, target_id: e.target.value }))} placeholder="UUID del objetivo" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Sanción</Label>
              <Select value={form.sanction_type} onValueChange={v => setForm(f => ({ ...f, sanction_type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SANCTION_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severidad (1-5)</Label>
              <Input type="number" min={1} max={5} value={form.severity} onChange={e => setForm(f => ({ ...f, severity: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <Label>Razón *</Label>
            <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Describe la razón de la sanción" />
          </div>
          <div>
            <Label>Descripción adicional</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fecha inicio</Label>
              <Input type="date" value={form.start_date || ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input type="date" value={form.end_date || ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          {form.sanction_type === 'fine' && (
            <div>
              <Label>Monto de multa</Label>
              <Input type="number" step="0.01" value={form.fine_amount || ''} onChange={e => setForm(f => ({ ...f, fine_amount: Number(e.target.value) }))} />
            </div>
          )}
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'Creando...' : 'Crear Sanción'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Sanctions() {
  const discipline = useDiscipline();
  const { sanctions, loading, refetch, updateSanctionStatus } = useSanctions();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = sanctions.filter(s => {
    if (s.discipline && s.discipline !== discipline) return false;
    if (filterType !== 'all' && s.sanction_type !== filterType) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (search && !s.reason.toLowerCase().includes(search.toLowerCase()) && !s.target_id.includes(search)) return false;
    return true;
  });

  const handleStatusChange = async (id: string, status: Sanction['status']) => {
    try {
      await updateSanctionStatus(id, status);
      toast.success('Estado actualizado');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Sistema de Sanciones" subtitle="Gestión de sanciones, multas y suspensiones" showBackButton={false} />
        <CreateSanctionDialog onCreated={refetch} />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por razón o ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(SANCTION_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando sanciones...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron sanciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-muted">
                      {sanctionIcon(s.sanction_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold">{SANCTION_TYPE_LABELS[s.sanction_type]}</span>
                        <Badge variant={statusVariant(s.status)}>{STATUS_LABELS[s.status]}</Badge>
                        <Badge variant="outline">{TARGET_TYPE_LABELS[s.target_type]}</Badge>
                        <Badge variant="outline">Severidad: {s.severity}/5</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{s.reason}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Inicio: {format(new Date(s.start_date), 'dd MMM yyyy', { locale: es })}</span>
                        {s.end_date && <span>Fin: {format(new Date(s.end_date), 'dd MMM yyyy', { locale: es })}</span>}
                        {s.fine_amount && <span>Multa: ${s.fine_amount} {s.fine_paid ? '✅' : '❌'}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {s.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(s.id, 'under_review')}>Revisar</Button>
                    )}
                    {s.status === 'under_review' && (
                      <Button size="sm" onClick={() => handleStatusChange(s.id, 'decided')}>Decidir</Button>
                    )}
                    {(s.status === 'decided' || s.status === 'appealed') && (
                      <Button size="sm" variant="secondary" onClick={() => handleStatusChange(s.id, 'closed')}>Cerrar</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
