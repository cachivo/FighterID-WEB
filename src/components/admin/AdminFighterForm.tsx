 import { useState, useEffect } from 'react';
 import { Loader2, CalendarIcon } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
 import { Calendar } from '@/components/ui/calendar';
 import { toast } from '@/hooks/use-toast';
 import { useFighterProfiles, FighterProfile, AdminFighterFormData } from '@/hooks/useFighterProfiles';
 import { format } from 'date-fns';
 import { cn } from '@/lib/utils';
 import { ENABLED_DISCIPLINES, WEIGHT_CLASSES, FIGHTER_LEVELS, STANCES, COUNTRIES } from '@/lib/constants/disciplines';
 
 const GENDERS = [
   { value: 'M', label: 'Masculino' },
   { value: 'F', label: 'Femenino' },
 ];
 
 interface AdminFighterFormProps {
   mode: 'create' | 'edit';
   existingFighter?: FighterProfile;
   onSuccess?: () => void;
   onCancel?: () => void;
 }
 
 export function AdminFighterForm({ mode, existingFighter, onSuccess, onCancel }: AdminFighterFormProps) {
   const { adminCreateFighterProfile, adminUpdateFighterProfile } = useFighterProfiles();
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
   const [formData, setFormData] = useState<Partial<AdminFighterFormData>>({
     first_name: '',
     last_name: '',
     nickname: '',
     country: 'Honduras',
     weight_class: 'Peso Ligero',
     martial_arts: [],
     record_wins: 0,
     record_losses: 0,
     record_draws: 0,
     mma_record_wins: 0,
     mma_record_losses: 0,
     mma_record_draws: 0,
     boxeo_record_wins: 0,
     boxeo_record_losses: 0,
     boxeo_record_draws: 0,
     record_type: 'Amateur',
     level: 'Amateur',
   });
 
   useEffect(() => {
     if (existingFighter && mode === 'edit') {
       const fighterBirthdate = existingFighter.birthdate ? new Date(existingFighter.birthdate) : undefined;
       setBirthDate(fighterBirthdate);
       
       setFormData({
         first_name: existingFighter.first_name,
         last_name: existingFighter.last_name,
         nickname: existingFighter.nickname || '',
         country: existingFighter.country || 'Honduras',
         weight_class: existingFighter.weight_class,
         avatar_url: existingFighter.avatar_url || '',
         discipline: existingFighter.discipline || undefined,
         martial_arts: existingFighter.martial_arts || [],
         record_wins: existingFighter.record_wins,
         record_losses: existingFighter.record_losses,
         record_draws: existingFighter.record_draws,
         mma_record_wins: (existingFighter as any).mma_record_wins || 0,
         mma_record_losses: (existingFighter as any).mma_record_losses || 0,
         mma_record_draws: (existingFighter as any).mma_record_draws || 0,
         boxeo_record_wins: (existingFighter as any).boxeo_record_wins || 0,
         boxeo_record_losses: (existingFighter as any).boxeo_record_losses || 0,
         boxeo_record_draws: (existingFighter as any).boxeo_record_draws || 0,
         record_type: existingFighter.record_type || 'Amateur',
         level: existingFighter.level || 'Amateur',
         gender: existingFighter.gender || '',
         height_cm: existingFighter.height_cm || 0,
         weight_kg: Number(existingFighter.weight_kg) || 0,
         reach_cm: existingFighter.reach_cm || 0,
         bio: existingFighter.bio || '',
         fighting_style: existingFighter.fighting_style || '',
         gym_name: existingFighter.gym_name || '',
         birthdate: existingFighter.birthdate || '',
         birthplace: existingFighter.birthplace || '',
         stance: existingFighter.stance || '',
       });
     }
   }, [existingFighter, mode]);
 
   const handleChange = (field: keyof AdminFighterFormData, value: any) => {
     setFormData(prev => ({
       ...prev,
       [field]: value
     }));
   };
 
   const handleMartialArtsChange = (art: string, checked: boolean) => {
     const currentArts = formData.martial_arts || [];
     if (checked) {
       setFormData(prev => ({
         ...prev,
         martial_arts: [...currentArts, art],
         discipline: currentArts.length === 0 ? art as any : prev.discipline
       }));
     } else {
       const newArts = currentArts.filter(a => a !== art);
       setFormData(prev => ({
         ...prev,
         martial_arts: newArts,
         discipline: newArts.length > 0 ? newArts[0] as any : undefined
       }));
     }
   };
 
   const handleDateSelect = (date: Date | undefined) => {
     setBirthDate(date);
     if (date) {
       handleChange('birthdate', date.toISOString().split('T')[0]);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.weight_class) {
       toast({
         title: "Error de validación",
         description: "Nombre, apellido y categoría de peso son obligatorios",
         variant: "destructive",
       });
       return;
     }
 
     if (!formData.martial_arts || formData.martial_arts.length === 0) {
       toast({
         title: "Error de validación",
         description: "Selecciona al menos un arte marcial",
         variant: "destructive",
       });
       return;
     }
 
     setIsSubmitting(true);
     
     try {
       if (mode === 'create') {
         await adminCreateFighterProfile(formData);
         toast({
           title: "¡Perfil creado!",
           description: "El perfil del peleador ha sido creado exitosamente.",
         });
       } else if (mode === 'edit' && existingFighter) {
         const success = await adminUpdateFighterProfile(existingFighter.id, formData as AdminFighterFormData);
         if (success) {
           toast({
             title: "¡Perfil actualizado!",
             description: "El perfil del peleador ha sido actualizado correctamente.",
           });
         }
       }
       
       onSuccess?.();
     } catch (error) {
       console.error('Error en handleSubmit:', error);
       const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
       toast({
         title: "Error",
         description: errorMessage,
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <form onSubmit={handleSubmit} className="space-y-6">
       <Tabs defaultValue="personal" className="w-full">
         <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="personal">Personal</TabsTrigger>
           <TabsTrigger value="physical">Físico</TabsTrigger>
           <TabsTrigger value="combat">Combate</TabsTrigger>
         </TabsList>
 
         {/* Personal Information Tab */}
         <TabsContent value="personal" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Información Personal</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="first_name">Nombre *</Label>
                   <Input
                     id="first_name"
                     value={formData.first_name}
                     onChange={(e) => handleChange('first_name', e.target.value)}
                     required
                   />
                 </div>
                 <div>
                   <Label htmlFor="last_name">Apellido *</Label>
                   <Input
                     id="last_name"
                     value={formData.last_name}
                     onChange={(e) => handleChange('last_name', e.target.value)}
                     required
                   />
                 </div>
               </div>
 
               <div>
                 <Label htmlFor="nickname">Apodo</Label>
                 <Input
                   id="nickname"
                   value={formData.nickname}
                   onChange={(e) => handleChange('nickname', e.target.value)}
                   placeholder="Ej: El Destructor"
                 />
               </div>
 
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="gender">Género</Label>
                   <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                     <SelectTrigger>
                       <SelectValue placeholder="Seleccionar género" />
                     </SelectTrigger>
                     <SelectContent>
                       {GENDERS.map(gender => (
                         <SelectItem key={gender.value} value={gender.value}>
                           {gender.label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label htmlFor="country">País</Label>
                   <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
                     <SelectTrigger>
                       <SelectValue placeholder="Seleccionar país" />
                     </SelectTrigger>
                     <SelectContent>
                       {COUNTRIES.map(c => (
                         <SelectItem key={c.value} value={c.value}>
                           {c.label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
 
               <div>
                 <Label>Fecha de Nacimiento</Label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant="outline"
                       className={cn(
                         "w-full justify-start text-left font-normal",
                         !birthDate && "text-muted-foreground"
                       )}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {birthDate ? format(birthDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={birthDate}
                       onSelect={handleDateSelect}
                       disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
               </div>
 
               <div>
                 <Label htmlFor="birthplace">Lugar de Nacimiento</Label>
                 <Input
                   id="birthplace"
                   value={formData.birthplace}
                   onChange={(e) => handleChange('birthplace', e.target.value)}
                   placeholder="Ciudad, País"
                 />
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Physical Tab */}
         <TabsContent value="physical" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Información Física</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-3 gap-4">
                 <div>
                   <Label htmlFor="height_cm">Altura (cm)</Label>
                   <Input
                     id="height_cm"
                     type="number"
                     value={formData.height_cm || ''}
                     onChange={(e) => {
                       const height = parseInt(e.target.value) || 0;
                       handleChange('height_cm', height);
                       if (height > 0 && (!formData.reach_cm || formData.reach_cm === formData.height_cm)) {
                         handleChange('reach_cm', height);
                       }
                     }}
                     placeholder="180"
                   />
                 </div>
                 <div>
                   <Label htmlFor="weight_kg">Peso (kg)</Label>
                   <Input
                     id="weight_kg"
                     type="number"
                     step="0.1"
                     value={formData.weight_kg || ''}
                     onChange={(e) => handleChange('weight_kg', parseFloat(e.target.value) || 0)}
                     placeholder="70.5"
                   />
                 </div>
                 <div>
                   <Label htmlFor="reach_cm">Alcance (cm)</Label>
                   <Input
                     id="reach_cm"
                     type="number"
                     value={formData.reach_cm || ''}
                     onChange={(e) => handleChange('reach_cm', parseInt(e.target.value) || 0)}
                     placeholder="185"
                   />
                   <p className="text-xs text-muted-foreground mt-1">
                     Estimado según altura. Ajústalo si conoces tu medida.
                   </p>
                 </div>
               </div>
 
               <div>
                 <Label htmlFor="stance">Guardia</Label>
                 <Select value={formData.stance} onValueChange={(value) => handleChange('stance', value)}>
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccionar guardia" />
                   </SelectTrigger>
                   <SelectContent>
                     {STANCES.map(stance => (
                       <SelectItem key={stance.value} value={stance.value}>
                         {stance.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Combat Tab */}
         <TabsContent value="combat" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Información de Combate</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                 <Label htmlFor="weight_class">Categoría de Peso *</Label>
                 <Select value={formData.weight_class} onValueChange={(value) => handleChange('weight_class', value)}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {WEIGHT_CLASSES.map(wc => (
                       <SelectItem key={wc.value} value={wc.value}>{wc.label}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 <p className="text-xs text-muted-foreground mt-1">
                   Selecciona según tu peso de competencia
                 </p>
               </div>
 
               <div>
                 <Label>Disciplina(s) de Competencia *</Label>
                 <div className="space-y-3 mt-2">
                   {ENABLED_DISCIPLINES.map((discipline) => (
                     <div 
                       key={discipline.value}
                       className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                         formData.martial_arts?.includes(discipline.value) 
                           ? 'border-primary bg-primary/5' 
                           : 'hover:border-muted-foreground/30'
                       }`}
                       onClick={() => handleMartialArtsChange(discipline.value, !formData.martial_arts?.includes(discipline.value))}
                     >
                       <Checkbox
                         id={`admin-${discipline.value}`}
                         checked={formData.martial_arts?.includes(discipline.value) || false}
                         onCheckedChange={(checked) => handleMartialArtsChange(discipline.value, checked as boolean)}
                       />
                       <div className="flex-1">
                         <Label htmlFor={`admin-${discipline.value}`} className="text-sm font-medium cursor-pointer">
                           {discipline.label}
                         </Label>
                         <p className="text-xs text-muted-foreground mt-1">
                           {discipline.description}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
                 {formData.martial_arts && formData.martial_arts.length > 0 && (
                   <div className="flex flex-wrap gap-2 mt-3">
                     {formData.martial_arts.map((art) => (
                       <Badge key={art} variant="secondary">
                         {ENABLED_DISCIPLINES.find(d => d.value === art)?.label || art}
                       </Badge>
                     ))}
                   </div>
                 )}
               </div>
 
               <div>
                 <Label htmlFor="level">Nivel</Label>
                 <Select value={formData.level} onValueChange={(value) => handleChange('level', value)}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {FIGHTER_LEVELS.map(level => (
                       <SelectItem key={level.value} value={level.value}>
                         {level.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
 
               <div>
                 <Label htmlFor="fighting_style">Estilo de Pelea</Label>
                 <Input
                   id="fighting_style"
                   value={formData.fighting_style}
                   onChange={(e) => handleChange('fighting_style', e.target.value)}
                   placeholder="Ej: Striker, Grappler"
                 />
               </div>
 
               <div>
                 <Label htmlFor="gym_name">Gimnasio/Academia</Label>
                 <Input
                   id="gym_name"
                   value={formData.gym_name}
                   onChange={(e) => handleChange('gym_name', e.target.value)}
                   placeholder="Ej: Gracie Barra"
                 />
               </div>
 
               <div className="grid grid-cols-4 gap-4">
                 <div className="col-span-1">
                   <Label htmlFor="record_wins">Victorias</Label>
                   <Input
                     id="record_wins"
                     type="number"
                     min="0"
                     value={formData.record_wins}
                     onChange={(e) => handleChange('record_wins', parseInt(e.target.value) || 0)}
                     disabled
                     className="bg-muted/50"
                   />
                   <p className="text-xs text-muted-foreground mt-1">Legacy (no editar)</p>
                 </div>
                 <div className="col-span-1">
                   <Label htmlFor="record_losses">Derrotas</Label>
                   <Input
                     id="record_losses"
                     type="number"
                     min="0"
                     value={formData.record_losses}
                     onChange={(e) => handleChange('record_losses', parseInt(e.target.value) || 0)}
                     disabled
                     className="bg-muted/50"
                   />
                 </div>
                 <div className="col-span-1">
                   <Label htmlFor="record_draws">Empates</Label>
                   <Input
                     id="record_draws"
                     type="number"
                     min="0"
                     value={formData.record_draws}
                     onChange={(e) => handleChange('record_draws', parseInt(e.target.value) || 0)}
                     disabled
                     className="bg-muted/50"
                   />
                 </div>
                 <div className="col-span-1">
                   <Label htmlFor="record_type">Tipo</Label>
                   <Select value={formData.record_type} onValueChange={(value) => handleChange('record_type', value)}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Amateur">Amateur</SelectItem>
                       <SelectItem value="Profesional">Profesional</SelectItem>
                       <SelectItem value="Mixto">Mixto</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
 
               {/* Récords por Disciplina */}
               <div className="space-y-4 pt-4 border-t">
                 <h4 className="font-semibold text-sm text-muted-foreground">Récords por Disciplina</h4>
                 
                 {formData.martial_arts?.includes('MMA') && (
                   <div className="p-4 border rounded-lg bg-muted/30">
                     <h4 className="font-semibold mb-3">Récord MMA</h4>
                     <div className="grid grid-cols-3 gap-4">
                       <div>
                         <Label htmlFor="mma_record_wins">Victorias</Label>
                         <Input
                           id="mma_record_wins"
                           type="number"
                           min="0"
                           value={formData.mma_record_wins || 0}
                           onChange={(e) => handleChange('mma_record_wins', parseInt(e.target.value) || 0)}
                         />
                       </div>
                       <div>
                         <Label htmlFor="mma_record_losses">Derrotas</Label>
                         <Input
                           id="mma_record_losses"
                           type="number"
                           min="0"
                           value={formData.mma_record_losses || 0}
                           onChange={(e) => handleChange('mma_record_losses', parseInt(e.target.value) || 0)}
                         />
                       </div>
                       <div>
                         <Label htmlFor="mma_record_draws">Empates</Label>
                         <Input
                           id="mma_record_draws"
                           type="number"
                           min="0"
                           value={formData.mma_record_draws || 0}
                           onChange={(e) => handleChange('mma_record_draws', parseInt(e.target.value) || 0)}
                         />
                       </div>
                     </div>
                     <p className="text-sm text-muted-foreground mt-2">
                       Record: {formData.mma_record_wins || 0}-{formData.mma_record_losses || 0}-{formData.mma_record_draws || 0}
                     </p>
                   </div>
                 )}
 
                 {formData.martial_arts?.includes('Boxeo') && (
                   <div className="p-4 border rounded-lg bg-muted/30">
                     <h4 className="font-semibold mb-3">Récord Boxeo</h4>
                     <div className="grid grid-cols-3 gap-4">
                       <div>
                         <Label htmlFor="boxeo_record_wins">Victorias</Label>
                         <Input
                           id="boxeo_record_wins"
                           type="number"
                           min="0"
                           value={formData.boxeo_record_wins || 0}
                           onChange={(e) => handleChange('boxeo_record_wins', parseInt(e.target.value) || 0)}
                         />
                       </div>
                       <div>
                         <Label htmlFor="boxeo_record_losses">Derrotas</Label>
                         <Input
                           id="boxeo_record_losses"
                           type="number"
                           min="0"
                           value={formData.boxeo_record_losses || 0}
                           onChange={(e) => handleChange('boxeo_record_losses', parseInt(e.target.value) || 0)}
                         />
                       </div>
                       <div>
                         <Label htmlFor="boxeo_record_draws">Empates</Label>
                         <Input
                           id="boxeo_record_draws"
                           type="number"
                           min="0"
                           value={formData.boxeo_record_draws || 0}
                           onChange={(e) => handleChange('boxeo_record_draws', parseInt(e.target.value) || 0)}
                         />
                       </div>
                     </div>
                     <p className="text-sm text-muted-foreground mt-2">
                       Record: {formData.boxeo_record_wins || 0}-{formData.boxeo_record_losses || 0}-{formData.boxeo_record_draws || 0}
                     </p>
                   </div>
                 )}
 
                 {(!formData.martial_arts || formData.martial_arts.length === 0) && (
                   <div className="text-center p-6 text-muted-foreground border rounded-lg border-dashed">
                     Selecciona una disciplina para editar récords
                   </div>
                 )}
               </div>
 
               <div>
                 <Label htmlFor="bio">Biografía</Label>
                 <Textarea
                   id="bio"
                   value={formData.bio}
                   onChange={(e) => handleChange('bio', e.target.value)}
                   placeholder="Describe la trayectoria del peleador..."
                   rows={4}
                 />
               </div>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
 
       <div className="flex justify-end gap-4">
         {onCancel && (
           <Button
             type="button"
             variant="outline"
             onClick={onCancel}
             disabled={isSubmitting}
           >
             Cancelar
           </Button>
         )}
         <Button type="submit" disabled={isSubmitting}>
           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           {mode === 'create' ? 'Crear Perfil' : 'Actualizar Perfil'}
         </Button>
       </div>
     </form>
   );
 }