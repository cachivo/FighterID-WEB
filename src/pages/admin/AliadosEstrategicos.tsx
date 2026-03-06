import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Dumbbell } from "lucide-react";
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Eye, EyeOff, Trash2, Upload } from 'lucide-react';

interface Partner {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  logo: string | null;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

interface PartnerFormData {
  nombre: string;
  tipo: string;
  descripcion: string;
  logo: string;
  orden: number;
}

export default function AliadosEstrategicos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>({
    nombre: '',
    tipo: 'Gimnasio',
    descripcion: '',
    logo: '',
    orden: 0
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch partners
  const { data: partners, isLoading } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('orden', { ascending: true });
      
      if (error) throw error;
      return data as Partner[];
    }
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `partners/partner-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('fighter-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('fighter-photos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    },
    onSuccess: (url) => {
      setFormData(prev => ({ ...prev, logo: url }));
      setPreviewUrl(url);
      setIsUploading(false);
      toast({
        title: "Logo subido",
        description: "El logo se ha subido correctamente"
      });
    },
    onError: () => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: "Error al subir el logo",
        variant: "destructive"
      });
    }
  });

  // Create/Update partner mutation
  const savePartnerMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      if (editingPartner) {
        const { error } = await supabase
          .from('partners')
          .update(data)
          .eq('id', editingPartner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partners')
          .insert([{ ...data, activo: true }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-allies'] });
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: editingPartner ? "Aliado actualizado" : "Aliado creado",
        description: editingPartner ? "El aliado se ha actualizado correctamente" : "El nuevo aliado se ha creado correctamente"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al guardar el aliado estratégico",
        variant: "destructive"
      });
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase
        .from('partners')
        .update({ activo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-allies'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del aliado se ha actualizado correctamente"
      });
    }
  });

  // Delete partner mutation
  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-allies'] });
      toast({
        title: "Aliado eliminado",
        description: "El aliado estratégico se ha eliminado correctamente"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al eliminar el aliado estratégico",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'Gimnasio',
      descripcion: '',
      logo: '',
      orden: 0
    });
    setEditingPartner(null);
    setLogoFile(null);
    setPreviewUrl(null);
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      nombre: partner.nombre,
      tipo: partner.tipo,
      descripcion: partner.descripcion,
      logo: partner.logo || '',
      orden: partner.orden
    });
    setPreviewUrl(partner.logo);
    setIsDialogOpen(true);
  };

  const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    setIsUploading(true);
    uploadLogoMutation.mutate(file);
  };

  const handleSave = () => {
    if (!formData.nombre.trim() || !formData.descripcion.trim()) {
      toast({
        title: "Error",
        description: "El nombre y la descripción son requeridos",
        variant: "destructive"
      });
      return;
    }

    savePartnerMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Aliados Estratégicos</h2>
          <p className="text-muted-foreground">
            Gestiona los aliados estratégicos que aparecen en la página principal
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Aliado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? 'Editar Aliado Estratégico' : 'Nuevo Aliado Estratégico'}
              </DialogTitle>
              <DialogDescription>
                {editingPartner ? 'Modifica la información del aliado estratégico' : 'Crea un nuevo aliado estratégico'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del aliado estratégico"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gimnasio">Gimnasio</SelectItem>
                    <SelectItem value="Organización">Organización</SelectItem>
                    <SelectItem value="Sponsor">Sponsor</SelectItem>
                    <SelectItem value="Empresa">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción del aliado estratégico"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orden">Orden de aparición</Label>
                <Input
                  id="orden"
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData(prev => ({ ...prev, orden: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Logo</Label>
                <FileUpload
                  onFileSelect={handleLogoSelect}
                  onRemoveFile={() => {
                    setFormData(prev => ({ ...prev, logo: '' }));
                    setPreviewUrl(null);
                    setLogoFile(null);
                  }}
                  accept="image/*"
                  maxSize={5}
                  preview={previewUrl}
                  loading={isUploading}
                  className="h-32"
                  autoResize={true}
                  resizeOptions={{ 
                    maxWidth: 200, 
                    maxHeight: 200, 
                    quality: 0.9, 
                    format: 'jpeg',
                    maintainAspectRatio: true 
                  }}
                  showResizeInfo={true}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={savePartnerMutation.isPending || isUploading}
              >
                {savePartnerMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Aliados Estratégicos</CardTitle>
          <CardDescription>
            Administra los aliados que aparecen en la sección de aliados estratégicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : partners && partners.length > 0 ? (
            <div className="overflow-x-auto -mx-4 px-4"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Logo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-20">Orden</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      {partner.logo ? (
                        <img 
                          src={partner.logo} 
                          alt={partner.nombre}
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          {partner.tipo === "Gimnasio" ? 
                            <Dumbbell className="h-5 w-5" /> : 
                            <Trophy className="h-5 w-5" />
                          }
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{partner.nombre}</TableCell>
                    <TableCell>{partner.tipo}</TableCell>
                    <TableCell className="max-w-xs truncate">{partner.descripcion}</TableCell>
                    <TableCell>{partner.orden}</TableCell>
                    <TableCell>
                      <Badge variant={partner.activo ? "default" : "secondary"}>
                        {partner.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(partner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: partner.id, 
                            activo: !partner.activo 
                          })}
                        >
                          {partner.activo ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('¿Estás seguro de que quieres eliminar este aliado estratégico?')) {
                              deletePartnerMutation.mutate(partner.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay aliados estratégicos configurados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}