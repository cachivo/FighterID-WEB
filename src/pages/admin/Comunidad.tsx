import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const testimonioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cargo: z.string().min(1, "El cargo es requerido"),
  testimonio: z.string().min(1, "El testimonio es requerido"),
  avatar: z.string().optional(),
  orden: z.number().min(0, "El orden debe ser mayor o igual a 0").optional(),
  activo: z.boolean().optional(),
});

const partnerSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.string().min(1, "El tipo es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  logo: z.string().optional(),
  orden: z.number().min(0, "El orden debe ser mayor o igual a 0").optional(),
  activo: z.boolean().optional(),
});

type TestimonioFormData = z.infer<typeof testimonioSchema>;
type PartnerFormData = z.infer<typeof partnerSchema>;

interface Testimonio {
  id: string;
  nombre: string;
  cargo: string;
  testimonio: string;
  avatar: string | null;
  orden: number | null;
  activo: boolean | null;
  created_at: string;
  updated_at: string;
}

interface Partner {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  logo: string | null;
  orden: number | null;
  activo: boolean | null;
  created_at: string;
  updated_at: string;
}

const Comunidad = () => {
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("testimonios");
  
  // Diálogos Testimonios
  const [isCreateTestimonioDialogOpen, setIsCreateTestimonioDialogOpen] = useState(false);
  const [isEditTestimonioDialogOpen, setIsEditTestimonioDialogOpen] = useState(false);
  const [editingTestimonio, setEditingTestimonio] = useState<Testimonio | null>(null);
  
  // Diálogos Partners
  const [isCreatePartnerDialogOpen, setIsCreatePartnerDialogOpen] = useState(false);
  const [isEditPartnerDialogOpen, setIsEditPartnerDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  
  const { toast } = useToast();

  const testimonioForm = useForm<TestimonioFormData>({
    resolver: zodResolver(testimonioSchema),
    defaultValues: {
      nombre: "",
      cargo: "",
      testimonio: "",
      avatar: "",
      orden: 0,
      activo: true,
    },
  });

  const partnerForm = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      nombre: "",
      tipo: "",
      descripcion: "",
      logo: "",
      orden: 0,
      activo: true,
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testimoniosResponse, partnersResponse] = await Promise.all([
        supabase.from("testimonios").select("*").order("orden", { ascending: true }),
        supabase.from("partners").select("*").order("orden", { ascending: true })
      ]);

      if (testimoniosResponse.error) throw testimoniosResponse.error;
      if (partnersResponse.error) throw partnersResponse.error;

      setTestimonios(testimoniosResponse.data || []);
      setPartners(partnersResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la comunidad.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CRUD Testimonios
  const handleCreateTestimonio = async (data: TestimonioFormData) => {
    try {
      const { error } = await supabase
        .from("testimonios")
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Testimonio creado correctamente.",
      });
      
      setIsCreateTestimonioDialogOpen(false);
      testimonioForm.reset();
      fetchData();
    } catch (error) {
      console.error("Error creating testimonio:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el testimonio.",
        variant: "destructive",
      });
    }
  };

  const handleEditTestimonio = async (data: TestimonioFormData) => {
    if (!editingTestimonio) return;

    try {
      const { error } = await supabase
        .from("testimonios")
        .update(data)
        .eq("id", editingTestimonio.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Testimonio actualizado correctamente.",
      });
      
      setIsEditTestimonioDialogOpen(false);
      setEditingTestimonio(null);
      testimonioForm.reset();
      fetchData();
    } catch (error) {
      console.error("Error updating testimonio:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el testimonio.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTestimonio = async (id: string) => {
    try {
      const { error } = await supabase
        .from("testimonios")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Testimonio eliminado correctamente.",
      });
      
      fetchData();
    } catch (error) {
      console.error("Error deleting testimonio:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el testimonio.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActiveTestimonio = async (testimonio: Testimonio) => {
    try {
      const { error } = await supabase
        .from("testimonios")
        .update({ activo: !testimonio.activo })
        .eq("id", testimonio.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Testimonio ${!testimonio.activo ? 'activado' : 'desactivado'} correctamente.`,
      });
      
      fetchData();
    } catch (error) {
      console.error("Error toggling active:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del testimonio.",
        variant: "destructive",
      });
    }
  };

  // CRUD Partners
  const handleCreatePartner = async (data: PartnerFormData) => {
    try {
      const { error } = await supabase
        .from("partners")
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Partner creado correctamente.",
      });
      
      setIsCreatePartnerDialogOpen(false);
      partnerForm.reset();
      fetchData();
    } catch (error) {
      console.error("Error creating partner:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el partner.",
        variant: "destructive",
      });
    }
  };

  const handleEditPartner = async (data: PartnerFormData) => {
    if (!editingPartner) return;

    try {
      const { error } = await supabase
        .from("partners")
        .update(data)
        .eq("id", editingPartner.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Partner actualizado correctamente.",
      });
      
      setIsEditPartnerDialogOpen(false);
      setEditingPartner(null);
      partnerForm.reset();
      fetchData();
    } catch (error) {
      console.error("Error updating partner:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el partner.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePartner = async (id: string) => {
    try {
      const { error } = await supabase
        .from("partners")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Partner eliminado correctamente.",
      });
      
      fetchData();
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el partner.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActivePartner = async (partner: Partner) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ activo: !partner.activo })
        .eq("id", partner.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Partner ${!partner.activo ? 'activado' : 'desactivado'} correctamente.`,
      });
      
      fetchData();
    } catch (error) {
      console.error("Error toggling active:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del partner.",
        variant: "destructive",
      });
    }
  };

  const openEditTestimonioDialog = (testimonio: Testimonio) => {
    setEditingTestimonio(testimonio);
    testimonioForm.reset({
      nombre: testimonio.nombre,
      cargo: testimonio.cargo,
      testimonio: testimonio.testimonio,
      avatar: testimonio.avatar || "",
      orden: testimonio.orden || 0,
      activo: testimonio.activo || true,
    });
    setIsEditTestimonioDialogOpen(true);
  };

  const openEditPartnerDialog = (partner: Partner) => {
    setEditingPartner(partner);
    partnerForm.reset({
      nombre: partner.nombre,
      tipo: partner.tipo,
      descripcion: partner.descripcion,
      logo: partner.logo || "",
      orden: partner.orden || 0,
      activo: partner.activo || true,
    });
    setIsEditPartnerDialogOpen(true);
  };

  const filteredTestimonios = testimonios.filter(testimonio =>
    testimonio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonio.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonio.testimonio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPartners = partners.filter(partner =>
    partner.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando datos de la comunidad...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de la Comunidad</CardTitle>
          <CardDescription>
            Administra testimonios y partners de tu plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="testimonios" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Testimonios
              </TabsTrigger>
              <TabsTrigger value="partners" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Partners
              </TabsTrigger>
            </TabsList>

            {/* TESTIMONIOS TAB */}
            <TabsContent value="testimonios" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 max-w-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar testimonios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <Dialog open={isCreateTestimonioDialogOpen} onOpenChange={setIsCreateTestimonioDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Testimonio
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Testimonio</DialogTitle>
                      <DialogDescription>
                        Agrega un nuevo testimonio de cliente
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...testimonioForm}>
                      <form onSubmit={testimonioForm.handleSubmit(handleCreateTestimonio)} className="space-y-4">
                        <FormField
                          control={testimonioForm.control}
                          name="nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nombre completo" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={testimonioForm.control}
                          name="cargo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cargo</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Cargo y empresa" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={testimonioForm.control}
                          name="testimonio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Testimonio</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Testimonio del cliente..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={testimonioForm.control}
                          name="avatar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Avatar (URL)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://ejemplo.com/avatar.jpg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={testimonioForm.control}
                          name="orden"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Orden</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  placeholder="0" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsCreateTestimonioDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit">Crear Testimonio</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-x-auto -mx-4 px-4"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Testimonio</TableHead>
                    <TableHead>Orden</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTestimonios.map((testimonio) => (
                    <TableRow key={testimonio.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={testimonio.avatar || undefined} />
                          <AvatarFallback>{testimonio.nombre.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{testimonio.nombre}</TableCell>
                      <TableCell>{testimonio.cargo}</TableCell>
                      <TableCell className="max-w-md truncate">{testimonio.testimonio}</TableCell>
                      <TableCell>{testimonio.orden}</TableCell>
                      <TableCell>
                        <Badge variant={testimonio.activo ? "default" : "secondary"}>
                          {testimonio.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActiveTestimonio(testimonio)}
                          >
                            {testimonio.activo ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditTestimonioDialog(testimonio)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el testimonio de "{testimonio.nombre}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTestimonio(testimonio.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>

              {filteredTestimonios.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No se encontraron testimonios que coincidan con la búsqueda." : "No hay testimonios registrados."}
                </div>
              )}
            </TabsContent>

            {/* PARTNERS TAB */}
            <TabsContent value="partners" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 max-w-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar partners..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <Dialog open={isCreatePartnerDialogOpen} onOpenChange={setIsCreatePartnerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Partner
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Partner</DialogTitle>
                      <DialogDescription>
                        Agrega un nuevo partner o colaborador
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...partnerForm}>
                      <form onSubmit={partnerForm.handleSubmit(handleCreatePartner)} className="space-y-4">
                        <FormField
                          control={partnerForm.control}
                          name="nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nombre del partner" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={partnerForm.control}
                          name="tipo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ej: Patrocinador, Colaborador, Cliente" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={partnerForm.control}
                          name="descripcion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Describe el partner y su relación..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={partnerForm.control}
                          name="logo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logo (URL)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://ejemplo.com/logo.jpg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={partnerForm.control}
                          name="orden"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Orden</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  placeholder="0" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsCreatePartnerDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit">Crear Partner</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-x-auto -mx-4 px-4"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Orden</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        {partner.logo ? (
                          <img src={partner.logo} alt={partner.nombre} className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{partner.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{partner.tipo}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{partner.descripcion}</TableCell>
                      <TableCell>{partner.orden}</TableCell>
                      <TableCell>
                        <Badge variant={partner.activo ? "default" : "secondary"}>
                          {partner.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActivePartner(partner)}
                          >
                            {partner.activo ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditPartnerDialog(partner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el partner "{partner.nombre}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePartner(partner.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>

              {filteredPartners.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No se encontraron partners que coincidan con la búsqueda." : "No hay partners registrados."}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Testimonio Dialog */}
      <Dialog open={isEditTestimonioDialogOpen} onOpenChange={setIsEditTestimonioDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Testimonio</DialogTitle>
            <DialogDescription>
              Modifica los datos del testimonio
            </DialogDescription>
          </DialogHeader>
          <Form {...testimonioForm}>
            <form onSubmit={testimonioForm.handleSubmit(handleEditTestimonio)} className="space-y-4">
              <FormField
                control={testimonioForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={testimonioForm.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cargo y empresa" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={testimonioForm.control}
                name="testimonio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimonio</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Testimonio del cliente..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={testimonioForm.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar (URL)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://ejemplo.com/avatar.jpg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={testimonioForm.control}
                name="orden"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="0" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditTestimonioDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Actualizar Testimonio</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Partner Dialog */}
      <Dialog open={isEditPartnerDialogOpen} onOpenChange={setIsEditPartnerDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Partner</DialogTitle>
            <DialogDescription>
              Modifica los datos del partner
            </DialogDescription>
          </DialogHeader>
          <Form {...partnerForm}>
            <form onSubmit={partnerForm.handleSubmit(handleEditPartner)} className="space-y-4">
              <FormField
                control={partnerForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre del partner" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={partnerForm.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Patrocinador, Colaborador, Cliente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={partnerForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe el partner y su relación..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={partnerForm.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo (URL)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://ejemplo.com/logo.jpg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={partnerForm.control}
                name="orden"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="0" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditPartnerDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Actualizar Partner</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Comunidad;