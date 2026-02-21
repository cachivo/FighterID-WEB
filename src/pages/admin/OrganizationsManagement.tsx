import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Search, CheckCircle2, XCircle, Globe, Phone, Mail, Shield, Edit } from 'lucide-react';
import { useOrganizations, type OrganizationFormData } from '@/hooks/useOrganizations';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const emptyForm: OrganizationFormData = {
  code: '',
  name: '',
  short_name: '',
  discipline: 'MMA',
  allowed_levels: ['AMATEUR', 'PROFESSIONAL'],
  description: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  country: 'Honduras',
  can_create_events: false,
  can_sanction_fights: false,
};

export default function OrganizationsManagement() {
  const { organizations, loading, createOrganization, updateOrganization, toggleOrganizationActive, verifyOrganization } = useOrganizations();
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [form, setForm] = useState<OrganizationFormData>(emptyForm);

  const filtered = useMemo(() => {
    if (!search) return organizations;
    const q = search.toLowerCase();
    return organizations.filter(o => 
      o.name.toLowerCase().includes(q) || 
      o.code.toLowerCase().includes(q) ||
      o.discipline.toLowerCase().includes(q)
    );
  }, [organizations, search]);

  const stats = useMemo(() => ({
    total: organizations.length,
    active: organizations.filter(o => o.is_active).length,
    verified: organizations.filter(o => o.verified).length,
    canCreateEvents: organizations.filter(o => o.can_create_events).length,
  }), [organizations]);

  const handleOpenCreate = () => {
    setEditingOrg(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const handleOpenEdit = (org: any) => {
    setEditingOrg(org.id);
    setForm({
      code: org.code,
      name: org.name,
      short_name: org.short_name,
      discipline: org.discipline,
      allowed_levels: org.allowed_levels || [],
      description: org.description || '',
      contact_name: org.contact_name || '',
      contact_email: org.contact_email || '',
      contact_phone: org.contact_phone || '',
      website: org.website || '',
      country: org.country || 'Honduras',
      can_create_events: org.can_create_events,
      can_sanction_fights: org.can_sanction_fights,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name || !form.short_name) return;
    const success = editingOrg
      ? await updateOrganization(editingOrg, form)
      : await createOrganization(form);
    if (success) {
      setShowDialog(false);
      setForm(emptyForm);
      setEditingOrg(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizaciones"
        subtitle="Gestión de organizaciones, promotores y federaciones"
        showBackButton={false}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Activas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-accent">{stats.verified}</p>
          <p className="text-xs text-muted-foreground">Verificadas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-secondary-foreground">{stats.canCreateEvents}</p>
          <p className="text-xs text-muted-foreground">Crean Eventos</p>
        </CardContent></Card>
      </div>

      {/* Search + Create */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar organización..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" /> Nueva
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(org => (
                <TableRow key={org.id}>
                  <TableCell className="font-mono text-sm">{org.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {org.logo_url && <img src={org.logo_url} alt="" className="h-6 w-6 rounded" />}
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.short_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{org.discipline}</Badge></TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      {org.contact_name && <p>{org.contact_name}</p>}
                      {org.contact_email && <p className="text-muted-foreground">{org.contact_email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {org.can_create_events && <Badge variant="secondary" className="text-xs">Eventos</Badge>}
                      {org.can_sanction_fights && <Badge variant="secondary" className="text-xs">Sanciones</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant={org.is_active ? 'default' : 'secondary'}>
                        {org.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                      {org.verified && (
                        <Badge variant="outline" className="text-primary border-primary">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Verificada
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(org)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => verifyOrganization(org.id, !org.verified)}
                      >
                        {org.verified ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleOrganizationActive(org.id, !org.is_active)}
                      >
                        <Shield className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron organizaciones
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrg ? 'Editar' : 'Nueva'} Organización</DialogTitle>
            <DialogDescription>Complete los datos de la organización</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="UCC" />
              </div>
              <div>
                <Label>Nombre Corto *</Label>
                <Input value={form.short_name} onChange={e => setForm(f => ({ ...f, short_name: e.target.value }))} placeholder="UCC" />
              </div>
            </div>
            <div>
              <Label>Nombre Completo *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ultimate Combat Championship" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Disciplina</Label>
                <Select value={form.discipline} onValueChange={v => setForm(f => ({ ...f, discipline: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MMA">MMA</SelectItem>
                    <SelectItem value="Boxeo">Boxeo</SelectItem>
                    <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                    <SelectItem value="Muay Thai">Muay Thai</SelectItem>
                    <SelectItem value="BJJ">BJJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>País</Label>
                <Input value={form.country || ''} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Sitio Web</Label>
              <Input value={form.website || ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Contacto</Label>
                <Input value={form.contact_name || ''} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Nombre" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.contact_email || ''} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="email@..." />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.contact_phone || ''} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="+504..." />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.can_create_events || false} onCheckedChange={v => setForm(f => ({ ...f, can_create_events: v }))} />
                <Label>Puede crear eventos</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.can_sanction_fights || false} onCheckedChange={v => setForm(f => ({ ...f, can_sanction_fights: v }))} />
                <Label>Puede sancionar peleas</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.code || !form.name || !form.short_name}>
              {editingOrg ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
