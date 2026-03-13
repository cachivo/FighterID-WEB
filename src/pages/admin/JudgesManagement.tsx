import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit, ToggleLeft, ToggleRight, Mail, Phone, Award } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useJudges, type JudgeFormData } from '@/hooks/useJudges';
import { useToast } from '@/hooks/use-toast';

const judgeSchema = z.object({
  first_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
  license_number: z.string().min(3, 'Número de licencia requerido'),
  certification_level: z.enum(['REGIONAL', 'NATIONAL', 'INTERNATIONAL']),
  specialization: z.array(z.string()).min(1, 'Selecciona al menos una especialización'),
  email: z.string().email('Email válido requerido').optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().optional(),
});

export default function JudgesManagement() {
  const { judges, loading, createJudge, updateJudge, toggleJudgeStatus } = useJudges();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [certificationFilter, setCertificationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<any>(null);

  const form = useForm<JudgeFormData>({
    resolver: zodResolver(judgeSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      license_number: '',
      certification_level: 'REGIONAL',
      specialization: [],
      email: '',
      phone: '',
      country: 'HN',
    },
  });

  const specializationOptions = [
    'MMA', 'Boxeo', 'Kickboxing', 'Muay Thai', 'Jiu-Jitsu', 
    'Judo', 'Wrestling', 'Karate', 'Taekwondo', 'Grappling'
  ];

  const filteredJudges = judges.filter(judge => {
    const matchesSearch = 
      judge.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      judge.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      judge.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      judge.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCertification = certificationFilter === 'ALL' || judge.certification_level === certificationFilter;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && judge.active) || 
      (statusFilter === 'INACTIVE' && !judge.active);

    return matchesSearch && matchesCertification && matchesStatus;
  });

  const onSubmit = async (data: JudgeFormData) => {
    try {
      if (editingJudge) {
        await updateJudge(editingJudge.id, data);
      } else {
        await createJudge(data);
      }
      
      setIsDialogOpen(false);
      setEditingJudge(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar juez",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (judge: any) => {
    setEditingJudge(judge);
    form.reset({
      first_name: judge.first_name,
      last_name: judge.last_name,
      license_number: judge.license_number,
      certification_level: judge.certification_level,
      specialization: judge.specialization || [],
      email: judge.email || '',
      phone: judge.phone || '',
      country: judge.country || 'HN',
    });
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (judgeId: string, currentStatus: boolean) => {
    await toggleJudgeStatus(judgeId, !currentStatus);
  };

  const getCertificationBadgeColor = (level: string) => {
    switch (level) {
      case 'INTERNATIONAL': return 'bg-gradient-to-r from-fighter-warning to-fighter-warning/80 text-white';
      case 'NATIONAL': return 'bg-gradient-to-r from-fighter-info to-fighter-info/80 text-white';
      case 'REGIONAL': return 'bg-gradient-to-r from-fighter-success to-fighter-success/80 text-white';
      default: return 'bg-muted-foreground text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando jueces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Jueces</h1>
          <p className="text-muted-foreground">
            Administra jueces oficiales, certificaciones y asignaciones
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingJudge(null);
              form.reset();
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Juez
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingJudge ? 'Editar Juez' : 'Registrar Nuevo Juez'}
              </DialogTitle>
              <DialogDescription>
                Complete la información del juez oficial
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="license_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Licencia</FormLabel>
                        <FormControl>
                          <Input placeholder="JDG-2025-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="certification_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel de Certificación</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar nivel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="REGIONAL">Regional</SelectItem>
                            <SelectItem value="NATIONAL">Nacional</SelectItem>
                            <SelectItem value="INTERNATIONAL">Internacional</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especializaciones</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {specializationOptions.map((spec) => (
                          <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={field.value.includes(spec)}
                              onCheckedChange={(checked) => {
                                const updatedSpecs = checked
                                  ? [...field.value, spec]
                                  : field.value.filter(s => s !== spec);
                                field.onChange(updatedSpecs);
                              }}
                            />
                            <span className="text-sm">{spec}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="juez@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+504 9999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingJudge ? 'Actualizar' : 'Crear'} Juez
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, licencia o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={certificationFilter} onValueChange={setCertificationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Certificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las certificaciones</SelectItem>
                <SelectItem value="INTERNATIONAL">Internacional</SelectItem>
                <SelectItem value="NATIONAL">Nacional</SelectItem>
                <SelectItem value="REGIONAL">Regional</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="INACTIVE">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jueces</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judges.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <ToggleRight className="h-4 w-4 text-fighter-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fighter-success">
              {judges.filter(j => j.active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internacionales</CardTitle>
            <Award className="h-4 w-4 text-fighter-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fighter-warning">
              {judges.filter(j => j.certification_level === 'INTERNATIONAL').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peleas Totales</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {judges.reduce((sum, j) => sum + j.total_fights_judged, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Judges List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJudges.map((judge) => (
          <Card key={judge.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {judge.first_name} {judge.last_name}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {judge.license_number}
                  </CardDescription>
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                  <Badge className={getCertificationBadgeColor(judge.certification_level)}>
                    {judge.certification_level}
                  </Badge>
                  
                  <button
                    onClick={() => handleToggleStatus(judge.id, judge.active)}
                    className="flex items-center"
                  >
                    {judge.active ? (
                      <ToggleRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {judge.specialization.slice(0, 3).map((spec) => (
                  <Badge key={spec} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
                {judge.specialization.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{judge.specialization.length - 3}
                  </Badge>
                )}
              </div>
              
              {judge.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {judge.email}
                </div>
              )}
              
              {judge.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {judge.phone}
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                Peleas juzgadas: <span className="font-medium">{judge.total_fights_judged}</span>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(judge)}
                >
                  <Edit className="mr-2 h-3 w-3" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJudges.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron jueces</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || certificationFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza registrando el primer juez oficial'}
              </p>
              {!searchTerm && certificationFilter === 'ALL' && statusFilter === 'ALL' && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Primer Juez
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}