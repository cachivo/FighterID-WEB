 import { useState } from "react";
 import { useQueryClient } from "@tanstack/react-query";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { toast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
 
 interface PointAdjustmentModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   rankingId: string;
   fighterName: string;
   currentPoints: number;
   organizationCode: string;
 }
 
 const ADJUSTMENT_REASONS = [
   { value: 'victoria', label: 'Victoria en pelea', delta: 3 },
   { value: 'derrota', label: 'Derrota en pelea', delta: -1 },
   { value: 'empate', label: 'Empate', delta: 1 },
   { value: 'ko_tko', label: 'Bono por KO/TKO', delta: 2 },
   { value: 'submission', label: 'Bono por Sumisión', delta: 2 },
   { value: 'titulo', label: 'Pelea por título', delta: 5 },
   { value: 'inactividad', label: 'Penalización por inactividad', delta: -3 },
   { value: 'correccion', label: 'Corrección administrativa', delta: 0 },
   { value: 'manual', label: 'Ajuste manual (especificar)', delta: 0 },
 ];
 
 export function PointAdjustmentModal({
   open,
   onOpenChange,
   rankingId,
   fighterName,
   currentPoints,
   organizationCode,
 }: PointAdjustmentModalProps) {
   const [reasonType, setReasonType] = useState<string>('');
   const [customReason, setCustomReason] = useState('');
   const [manualDelta, setManualDelta] = useState<number>(0);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const queryClient = useQueryClient();
 
   const selectedReason = ADJUSTMENT_REASONS.find(r => r.value === reasonType);
   const delta = reasonType === 'manual' || reasonType === 'correccion' 
     ? manualDelta 
     : (selectedReason?.delta || 0);
   const newPoints = currentPoints + delta;
 
   const handleSubmit = async () => {
     if (!reasonType) {
       toast({
         title: "Error",
         description: "Selecciona una razón para el ajuste",
         variant: "destructive",
       });
       return;
     }
 
     const finalReason = reasonType === 'manual' 
       ? `Ajuste manual: ${customReason || 'Sin especificar'}`
       : `${selectedReason?.label}${customReason ? ` - ${customReason}` : ''}`;
 
     setIsSubmitting(true);
     try {
       const { error } = await supabase.rpc('adjust_ranking_points', {
         p_ranking_id: rankingId,
         p_new_points: newPoints,
         p_reason: finalReason,
       });
 
       if (error) throw error;
 
       toast({
         title: "Puntos ajustados",
         description: `${fighterName}: ${currentPoints} → ${newPoints} pts`,
       });
 
       queryClient.invalidateQueries({ queryKey: ['organization-ranking', organizationCode] });
       onOpenChange(false);
       
       // Reset form
       setReasonType('');
       setCustomReason('');
       setManualDelta(0);
     } catch (error: any) {
       toast({
         title: "Error al ajustar puntos",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <AlertTriangle className="h-5 w-5 text-yellow-500" />
             Ajustar Puntos de Ranking
           </DialogTitle>
           <DialogDescription>
             Modificar puntos para <strong>{fighterName}</strong>. 
             Este cambio quedará registrado en la auditoría.
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           {/* Current Points Display */}
           <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
             <span className="text-sm text-muted-foreground">Puntos actuales:</span>
             <span className="text-2xl font-bold">{currentPoints}</span>
           </div>
 
           {/* Reason Selection */}
           <div className="space-y-2">
             <Label>Razón del ajuste *</Label>
             <Select value={reasonType} onValueChange={setReasonType}>
               <SelectTrigger>
                 <SelectValue placeholder="Seleccionar razón..." />
               </SelectTrigger>
               <SelectContent>
                 {ADJUSTMENT_REASONS.map((reason) => (
                   <SelectItem key={reason.value} value={reason.value}>
                     <div className="flex items-center gap-2">
                       {reason.delta > 0 && <TrendingUp className="h-4 w-4 text-green-500" />}
                       {reason.delta < 0 && <TrendingDown className="h-4 w-4 text-red-500" />}
                       {reason.delta === 0 && <Minus className="h-4 w-4 text-gray-500" />}
                       <span>{reason.label}</span>
                       {reason.delta !== 0 && (
                         <span className={`text-xs ${reason.delta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                           ({reason.delta > 0 ? '+' : ''}{reason.delta})
                         </span>
                       )}
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Manual Delta Input */}
           {(reasonType === 'manual' || reasonType === 'correccion') && (
             <div className="space-y-2">
               <Label>Cantidad de puntos (+/-)</Label>
               <Input
                 type="number"
                 value={manualDelta}
                 onChange={(e) => setManualDelta(parseInt(e.target.value) || 0)}
                 placeholder="Ej: 5 o -3"
               />
             </div>
           )}
 
           {/* Custom Reason */}
           <div className="space-y-2">
             <Label>Notas adicionales</Label>
             <Textarea
               value={customReason}
               onChange={(e) => setCustomReason(e.target.value)}
               placeholder="Detalles opcionales del ajuste..."
               rows={2}
             />
           </div>
 
           {/* Preview */}
           {reasonType && (
             <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                delta > 0 ? 'bg-fighter-success/10 border-fighter-success/30' :
                delta < 0 ? 'bg-fighter-danger/10 border-fighter-danger/30' :
                'bg-muted/50 border-border'
              }`}>
                <span className="text-sm">Nuevos puntos:</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">{currentPoints}</span>
                  <span className="text-2xl font-bold">{newPoints}</span>
                  <span className={`text-sm ${
                    delta > 0 ? 'text-fighter-success' : 
                    delta < 0 ? 'text-fighter-danger' : 
                    'text-muted-foreground'
                 }`}>
                   ({delta > 0 ? '+' : ''}{delta})
                 </span>
               </div>
             </div>
           )}
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Cancelar
           </Button>
           <Button 
             onClick={handleSubmit} 
             disabled={isSubmitting || !reasonType}
             className="bg-purple-neon-primary hover:bg-purple-neon-secondary text-black"
           >
             {isSubmitting ? 'Guardando...' : 'Confirmar Ajuste'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }
 
 export default PointAdjustmentModal;