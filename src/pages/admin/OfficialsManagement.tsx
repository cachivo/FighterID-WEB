import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, Award, ToggleRight, ToggleLeft, Edit,
  Gavel, Shield, Stethoscope, Timer, Eye, Trash2, Users
} from 'lucide-react';
import { useOfficials, type OfficialFormData, type OfficialType, type Official } from '@/hooks/useOfficials';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const OFFICIAL_TYPES: { value: OfficialType; label: string; icon: typeof Gavel }[] = [
  { value: 'judge', label: 'Juez', icon: Gavel },
  { value: 'referee', label: 'Árbitro', icon: Shield },
  { value: 'doctor', label: 'Médico', icon: Stethoscope },
  { value: 'timekeeper', label: 'Cronometrador', icon: Timer },
  { value: 'inspector', label: 'Inspector', icon: Eye },
];

const SPECIALIZATIONS = [
  'MMA', 'Boxeo', 'Kickboxing', 'Muay Thai', 'Jiu-Jitsu',
  'Judo', 'Wrestling', 'Karate', 'Taekwondo', 'Grappling'
];

const officialSchema = z.object({
  official_type: z.enum(['judge', 'referee', 'doctor', 'timekeeper', 'inspector']),
  certification_level: z.enum(['REGIONAL', 'NATIONAL', 'INTERNATIONAL']),
  first_name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  license_number: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().optional(),
  specialization: z.array(z.string()).min(1, 'Selecciona al menos una disciplina'),
  document_id: z.string().optional(),
  certified_by: z.string().optional(),
  certification_date: z.string().optional(),
  certification_expires: z.string().optional(),
});

const getTypeIcon = (type: OfficialType) => {
  const found = OFFICIAL_TYPES.find(t => t.value === type);
  return found ? found.icon : Users;
};

const getTypeLabel = (type: OfficialType) => {
  return OFFICIAL_TYPES.find(t => t.value === type)?.label || type;
};

const getCertBadgeClass = (level: string) => {
  switch (level) {
    case 'INTERNATIONAL': return 'bg-fighter-warning/20 text-fighter-warning border-fighter-warning/30';
    case 'NATIONAL': return 'bg-fighter-info/20 text-fighter-info border-fighter-info/30';
    default: return 'bg-fighter-success/20 text-fighter-success border-fighter-success/30';
  }
};

function OfficialCard({ official, onEdit, onToggle, onDelete }: {
  official: Official;
  onEdit: (o: Official) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = getTypeIcon(official.official_type);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{official.first_name} {official.last_name}</CardTitle>
              <CardDescription className="text-xs font-mono">
                {official.license_number || 'Sin licencia'}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge className={getCertBadgeClass(official.certification_level)}>
              {official.certification_level}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getTypeLabel(official.official_type)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {(official.specialization || []).slice(0, 3).map(s => (
            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
          ))}
          {(official.specialization || []).length > 3 && (
            <Badge variant="secondary" className="text-xs">+{official.specialization.length - 3}</Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{official.total_fights_worked} peleas</span>
          <span>{official.total_events_worked} eventos</span>
        </div>

        {official.suspended && (
          <Badge variant="destructive" className="w-full justify-center">Suspendido</Badge>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(official)}>
            <Edit className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
          <button onClick={() => onToggle(official.id, !official.active)}>
            {official.active
              ? <ToggleRight className="h-5 w-5 text-fighter-success" />
              : <ToggleLeft className="h-5 w-5 text-muted-foreground" />
            }
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar oficial?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará permanentemente a {official.first_name} {official.last_name}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(official.id)}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OfficialsManagement() {
  const { officials, loading, createOfficial, updateOfficial, toggleOfficialStatus, deleteOfficial } = useOfficials();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [certFilter, setCertFilter] = useState<string>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);

  const form = useForm<OfficialFormData>({
    resolver: zodResolver(officialSchema),
    defaultValues: {
      official_type: 'judge',
      certification_level: 'REGIONAL',
      first_name: '',
      last_name: '',
      specialization: [],
      country: 'HN',
    },
  });

  const filteredOfficials = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return officials.filter(o => {
      const matchesSearch = !q ||
        o.first_name.toLowerCase().includes(q) ||
        o.last_name.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.license_number?.toLowerCase().includes(q);
      const matchesType = typeFilter === 'ALL' || o.official_type === typeFilter;
      const matchesCert = certFilter === 'ALL' || o.certification_level === certFilter;
      return matchesSearch && matchesType && matchesCert;
    });
  }, [officials, searchTerm, typeFilter, certFilter]);

  const stats = useMemo(() => ({
    total: officials.length,
    active: officials.filter(o => o.active).length,
    judges: officials.filter(o => o.official_type === 'judge').length,
    referees: officials.filter(o => o.official_type === 'referee').length,
    doctors: officials.filter(o => o.official_type === 'doctor').length,
  }), [officials]);

  const onSubmit = async (data: OfficialFormData) => {
    const success = editingOfficial
      ? await updateOfficial(editingOfficial.id, data)
      : await createOfficial(data);
    if (success) {
      setIsDialogOpen(false);
      setEditingOfficial(null);
      form.reset();
    }
  };

  const handleEdit = (official: Official) => {
    setEditingOfficial(official);
    form.reset({
      official_type: official.official_type,
      certification_level: official.certification_level,
      first_name: official.first_name,
      last_name: official.last_name,
      license_number: official.license_number || '',
      email: official.email || '',
      phone: official.phone || '',
      country: official.country || 'HN',
      specialization: official.specialization || [],
      document_id: official.document_id || '',
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando oficiales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Oficiales</h1>
          <p className="text-muted-foreground">Jueces, árbitros, médicos, cronometradores e inspectores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingOfficial(null); form.reset(); }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Oficial</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOfficial ? 'Editar Oficial' : 'Registrar Nuevo Oficial'}</DialogTitle>
              <DialogDescription>Complete la información del oficial</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="official_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Oficial</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {OFFICIAL_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="certification_level" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel de Certificación</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="REGIONAL">Regional</SelectItem>
                          <SelectItem value="NATIONAL">Nacional</SelectItem>
                          <SelectItem value="INTERNATIONAL">Internacional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl><Input placeholder="Juan" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl><Input placeholder="Pérez" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="license_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Licencia</FormLabel>
                      <FormControl><Input placeholder="OFF-2026-001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="oficial@ejemplo.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl><Input placeholder="+504 9999-9999" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="document_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documento ID</FormLabel>
                      <FormControl><Input placeholder="0801-1990-12345" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="specialization" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplinas</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {SPECIALIZATIONS.map(spec => (
                        <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={field.value.includes(spec)}
                            onCheckedChange={(checked) => {
                              field.onChange(checked
                                ? [...field.value, spec]
                                : field.value.filter(s => s !== spec));
                            }}
                          />
                          <span className="text-sm">{spec}</span>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">{editingOfficial ? 'Actualizar' : 'Crear'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Users },
          { label: 'Activos', value: stats.active, icon: ToggleRight },
          { label: 'Jueces', value: stats.judges, icon: Gavel },
          { label: 'Árbitros', value: stats.referees, icon: Shield },
          { label: 'Médicos', value: stats.doctors, icon: Stethoscope },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, licencia o email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                {OFFICIAL_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={certFilter} onValueChange={setCertFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Certificación" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="REGIONAL">Regional</SelectItem>
                <SelectItem value="NATIONAL">Nacional</SelectItem>
                <SelectItem value="INTERNATIONAL">Internacional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Officials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOfficials.map(official => (
          <OfficialCard
            key={official.id}
            official={official}
            onEdit={handleEdit}
            onToggle={toggleOfficialStatus}
            onDelete={deleteOfficial}
          />
        ))}
      </div>

      {filteredOfficials.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm || typeFilter !== 'ALL' || certFilter !== 'ALL'
            ? 'No se encontraron oficiales con esos filtros'
            : 'No hay oficiales registrados. Crea el primero.'}
        </div>
      )}
    </div>
  );
}
