import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { IconPicker } from "@/components/ui/icon-picker";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Trophy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface EventoDeportivo {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  activo: boolean;
  orden: number;
}

const eventoSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  icono: z.string().min(1, 'El icono es obligatorio'),
  orden: z.number().min(0, 'El orden debe ser mayor o igual a 0'),
  activo: z.boolean(),
});

type EventoFormData = z.infer<typeof eventoSchema>;

export default function EventosDeportivos() {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [eventos, setEventos] = useState<EventoDeportivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EventoDeportivo>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({});

  const form = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      icono: 'Trophy',
      orden: 0,
      activo: true,
    },
  });

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos_deportivos')
        .select('*')
        .order('orden', { ascending: true });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los eventos deportivos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (evento: EventoDeportivo) => {
    setEditingId(evento.id);
    setEditForm(evento);
  };

  const handleSave = async () => {
    if (!editingId || !editForm.titulo || !editForm.descripcion) return;

    try {
      const { error } = await supabase
        .from('eventos_deportivos')
        .update({
          titulo: editForm.titulo,
          descripcion: editForm.descripcion,
          icono: editForm.icono || 'Trophy',
          activo: editForm.activo,
          orden: editForm.orden,
        })
        .eq('id', editingId);

      if (error) throw error;

      await fetchEventos();
      setEditingId(null);
      setEditForm({});
      
      toast({
        title: 'Éxito',
        description: 'Evento deportivo actualizado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el evento deportivo',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    console.log('[TOGGLE] Iniciando toggleActivo:', { id, activo, currentState: eventos.find(e => e.id === id)?.activo });
    
    // VERIFICACIÓN DE AUTENTICACIÓN
    console.log('[AUTH] Estado de autenticación:', { 
      user: user?.id, 
      userEmail: user?.email, 
      session: !!session,
      sessionAccessToken: session?.access_token ? 'YES' : 'NO'
    });
    
    if (!user || !session) {
      console.error('[ERROR] Usuario no autenticado');
      toast({
        title: 'Error de Autenticación',
        description: 'Debes estar autenticado para realizar esta acción',
        variant: 'destructive',
      });
      return;
    }
    
    // Actualizar estado local inmediatamente para mejor UX
    setEventos(prev => prev.map(evento => 
      evento.id === id ? { ...evento, activo } : evento
    ));

    // Activar loading para este evento específico
    setToggleLoading(prev => ({ ...prev, [id]: true }));

    try {
      console.log('[REQUEST] Enviando request a Supabase:', { 
        table: 'eventos_deportivos', 
        update: { activo }, 
        where: { id },
        userId: user.id,
        hasSession: !!session
      });
      
      // Verificar que el cliente tenga la sesión actualizada
      const currentSession = await supabase.auth.getSession();
      console.log('[SESSION] Sesión actual de Supabase:', {
        hasSession: !!currentSession.data.session,
        userId: currentSession.data.session?.user?.id,
        accessToken: currentSession.data.session?.access_token ? 'YES' : 'NO'
      });
      
      const { data, error } = await supabase
        .from('eventos_deportivos')
        .update({ activo })
        .eq('id', id)
        .select('*');
        
      console.log('[RESPONSE] Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('[ERROR] Error de Supabase:', error);
        console.error('[ERROR] Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Revertir el estado local si hay error
        setEventos(prev => prev.map(evento => 
          evento.id === id ? { ...evento, activo: !activo } : evento
        ));
        throw error;
      }

      console.log('[SUCCESS] Update exitoso, refrescando datos...');
      await fetchEventos();
      
      toast({
        title: 'Éxito',
        description: `Evento ${activo ? 'activado' : 'desactivado'} correctamente`,
      });
    } catch (error) {
      console.error('[ERROR] Error completo en toggleActivo:', error);
      
      let errorMessage = 'Error desconocido';
      if (error?.message) {
        errorMessage = error.message;
      }
      if (error?.code === 'PGRST301') {
        errorMessage = 'No tienes permisos para realizar esta acción. Verifica tu autenticación.';
      }
      
      toast({
        title: 'Error',
        description: `No se pudo ${activo ? 'activar' : 'desactivar'} el evento: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      // Desactivar loading
      setToggleLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCreate = async (data: EventoFormData) => {
    try {
      const { error } = await supabase
        .from('eventos_deportivos')
        .insert([data]);

      if (error) throw error;

      await fetchEventos();
      setShowCreateDialog(false);
      form.reset();
      
      toast({
        title: 'Éxito',
        description: 'Evento deportivo creado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el evento deportivo',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('eventos_deportivos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEventos();
      setDeleteId(null);
      
      toast({
        title: 'Éxito',
        description: 'Evento deportivo eliminado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el evento deportivo',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Eventos Deportivos</h2>
          <p className="text-muted-foreground">
            Gestiona los tipos de eventos deportivos que se muestran en el sitio web
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Evento Deportivo</DialogTitle>
              <DialogDescription>
                Añade un nuevo tipo de evento deportivo al sitio web.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Competencias Freestyle" {...field} />
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
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe el tipo de evento deportivo..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icono</FormLabel>
                      <FormControl>
                        <IconPicker
                          value={field.value}
                          onSelect={field.onChange}
                          placeholder="Seleccionar icono de evento deportivo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orden"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orden</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="activo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Estado</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          El evento estará visible en el sitio web
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear Evento</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Eventos Deportivos</CardTitle>
          <CardDescription>
            {eventos.length} eventos configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icono</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.map((evento) => (
                <TableRow key={evento.id}>
                  <TableCell>
                    {editingId === evento.id ? (
                      <IconPicker
                        value={editForm.icono || ''}
                        onSelect={(iconName) => setEditForm({...editForm, icono: iconName})}
                        placeholder="Trophy"
                      />
                    ) : (
                      <div className="flex items-center">
                        <DynamicIcon name={evento.icono} className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === evento.id ? (
                      <Input
                        value={editForm.titulo || ''}
                        onChange={(e) => setEditForm({...editForm, titulo: e.target.value})}
                        placeholder="Título del evento"
                      />
                    ) : (
                      <div className="font-medium">{evento.titulo}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === evento.id ? (
                      <Textarea
                        value={editForm.descripcion || ''}
                        onChange={(e) => setEditForm({...editForm, descripcion: e.target.value})}
                        placeholder="Descripción del evento"
                        className="min-h-[60px]"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground max-w-xs">
                        {evento.descripcion}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === evento.id ? (
                      <Switch
                        checked={editForm.activo || false}
                        onCheckedChange={(checked) => setEditForm({...editForm, activo: checked})}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={evento.activo}
                          disabled={toggleLoading[evento.id]}
                          onCheckedChange={(checked) => toggleActivo(evento.id, checked)}
                        />
                        <Badge variant={evento.activo ? 'default' : 'secondary'}>
                          {toggleLoading[evento.id] ? 'Procesando...' : (evento.activo ? 'Activo' : 'Inactivo')}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === evento.id ? (
                      <Input
                        type="number"
                        value={editForm.orden || 0}
                        onChange={(e) => setEditForm({...editForm, orden: parseInt(e.target.value)})}
                        className="w-20"
                      />
                    ) : (
                      <span>{evento.orden}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === evento.id ? (
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(evento)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el evento deportivo
                                <strong className="block mt-2">"{evento.titulo}"</strong>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(evento.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}