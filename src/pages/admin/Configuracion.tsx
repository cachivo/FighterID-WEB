import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  clave: z.string().min(1, "La clave es requerida"),
  valor: z.string().min(1, "El valor es requerido"),
  descripcion: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ConfiguracionSitio {
  id: string;
  clave: string;
  valor: string;
  descripcion: string | null;
  updated_at: string;
}

const Configuracion = () => {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionSitio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConfiguracion, setEditingConfiguracion] = useState<ConfiguracionSitio | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clave: "",
      valor: "",
      descripcion: "",
    },
  });

  const fetchConfiguraciones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("configuracion_sitio")
        .select("*")
        .order("clave", { ascending: true });

      if (error) throw error;
      setConfiguraciones(data || []);
    } catch (error) {
      console.error("Error fetching configuraciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfiguraciones();
  }, []);

  const handleCreate = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from("configuracion_sitio")
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Configuración creada correctamente.",
      });
      
      setIsCreateDialogOpen(false);
      form.reset();
      fetchConfiguraciones();
    } catch (error) {
      console.error("Error creating configuracion:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la configuración.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: FormData) => {
    if (!editingConfiguracion) return;

    try {
      const { error } = await supabase
        .from("configuracion_sitio")
        .update(data)
        .eq("id", editingConfiguracion.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Configuración actualizada correctamente.",
      });
      
      setIsEditDialogOpen(false);
      setEditingConfiguracion(null);
      form.reset();
      fetchConfiguraciones();
    } catch (error) {
      console.error("Error updating configuracion:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("configuracion_sitio")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Configuración eliminada correctamente.",
      });
      
      fetchConfiguraciones();
    } catch (error) {
      console.error("Error deleting configuracion:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la configuración.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (configuracion: ConfiguracionSitio) => {
    setEditingConfiguracion(configuracion);
    form.reset({
      clave: configuracion.clave,
      valor: configuracion.valor,
      descripcion: configuracion.descripcion || "",
    });
    setIsEditDialogOpen(true);
  };

  const filteredConfiguraciones = configuraciones.filter(config =>
    config.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.valor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (config.descripcion && config.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Configuraciones predefinidas comunes
  const configuracionesComunes = [
    { clave: "sitio_titulo", valor: "Mi Sitio Web", descripcion: "Título principal del sitio" },
    { clave: "sitio_descripcion", valor: "Descripción del sitio web", descripcion: "Meta descripción para SEO" },
    { clave: "contacto_email", valor: "contacto@misitio.com", descripcion: "Email de contacto principal" },
    { clave: "contacto_telefono", valor: "+1234567890", descripcion: "Teléfono de contacto" },
    { clave: "redes_facebook", valor: "https://facebook.com/misitio", descripcion: "URL de Facebook" },
    { clave: "redes_instagram", valor: "https://instagram.com/misitio", descripcion: "URL de Instagram" },
    { clave: "redes_twitter", valor: "https://twitter.com/misitio", descripcion: "URL de Twitter" },
    { clave: "empresa_direccion", valor: "Mi Dirección, Ciudad, País", descripcion: "Dirección física de la empresa" },
  ];

  const crearConfiguracionesComunes = async () => {
    try {
      const { error } = await supabase
        .from("configuracion_sitio")
        .insert(configuracionesComunes);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Configuraciones básicas creadas correctamente.",
      });
      
      fetchConfiguraciones();
    } catch (error) {
      console.error("Error creating common configs:", error);
      toast({
        title: "Error",
        description: "No se pudieron crear las configuraciones básicas.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando configuraciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sitio</CardTitle>
          <CardDescription>
            Administra las configuraciones generales y parámetros del sitio web
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 flex-1 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar configuraciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex space-x-2">
              {configuraciones.length === 0 && (
                <Button variant="outline" onClick={crearConfiguracionesComunes}>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Configs Básicas
                </Button>
              )}
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Configuración
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Configuración</DialogTitle>
                    <DialogDescription>
                      Agrega una nueva configuración del sitio
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="clave"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clave</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: sitio_titulo, contacto_email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="valor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Valor de la configuración..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="descripcion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción (Opcional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Descripción de para qué sirve esta configuración" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Crear Configuración</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 px-4"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfiguraciones.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium font-mono text-sm bg-muted/50 rounded px-2 py-1 max-w-xs">
                    {config.clave}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={config.valor}>
                      {config.valor.length > 50 ? `${config.valor.substring(0, 50)}...` : config.valor}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">
                    {config.descripcion || "Sin descripción"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(config.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(config)}
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
                              Esta acción no se puede deshacer. Se eliminará permanentemente la configuración "{config.clave}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(config.id)}
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

          {filteredConfiguraciones.length === 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                {searchTerm ? "No se encontraron configuraciones que coincidan con la búsqueda." : "No hay configuraciones registradas."}
              </div>
              {!searchTerm && configuraciones.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Puedes crear configuraciones básicas para empezar
                  </p>
                  <Button variant="outline" onClick={crearConfiguracionesComunes}>
                    <Save className="h-4 w-4 mr-2" />
                    Crear Configuraciones Básicas
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Configuración</DialogTitle>
            <DialogDescription>
              Modifica los datos de la configuración
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clave"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clave</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: sitio_titulo, contacto_email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Valor de la configuración..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Descripción de para qué sirve esta configuración" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Actualizar Configuración</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracion;