 import { useState, useMemo } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Badge } from '@/components/ui/badge';
 import { OptimizedImage } from '@/components/ui/optimized-image';
 import { Search, User, Loader2, Check } from 'lucide-react';
 import { useAdminFighters } from '@/hooks/useAdminFighters';
 import { useFighterRankingMembership } from '@/hooks/useFighterRankingMembership';
 import { RankingOrganization } from '@/hooks/useRankingOrganizations';
 import { WEIGHT_CLASSES } from '@/lib/constants/disciplines';
 
 interface EnrollFighterModalProps {
   open: boolean;
   onClose: () => void;
   organization: RankingOrganization;
   onSuccess?: () => void;
 }
 
 export function EnrollFighterModal({ open, onClose, organization, onSuccess }: EnrollFighterModalProps) {
   const { fighters, loading: loadingFighters } = useAdminFighters();
   const { enrollFighter, isLoading } = useFighterRankingMembership();
 
   const [search, setSearch] = useState('');
   const [selectedFighter, setSelectedFighter] = useState<string | null>(null);
   const [level, setLevel] = useState(organization.allowed_levels[0] || '');
   const [weightClass, setWeightClass] = useState('');
 
   const filteredFighters = useMemo(() => {
     if (!search.trim()) return fighters.slice(0, 10);
     const searchLower = search.toLowerCase();
     return fighters.filter(f => 
       `${f.first_name} ${f.last_name} ${f.nickname || ''}`
         .toLowerCase()
         .includes(searchLower)
     ).slice(0, 20);
   }, [fighters, search]);
 
   const selectedFighterData = fighters.find(f => f.id === selectedFighter);
 
   const handleEnroll = async () => {
     if (!selectedFighter || !level || !weightClass) return;
 
     const result = await enrollFighter({
       fighterId: selectedFighter,
       organizationCode: organization.code,
       level,
       weightClass,
     });
 
     if (result) {
       setSelectedFighter(null);
       setSearch('');
       onSuccess?.();
       onClose();
     }
   };
 
   const handleClose = () => {
     setSelectedFighter(null);
     setSearch('');
     onClose();
   };
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle>Agregar Peleador a {organization.short_name}</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           {/* Fighter Search */}
           <div>
             <Label>Buscar Peleador</Label>
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="Nombre del peleador..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="pl-9"
               />
             </div>
           </div>
 
           {/* Fighter List */}
           <ScrollArea className="h-48 border rounded-lg">
             {loadingFighters ? (
               <div className="flex items-center justify-center py-8">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
               </div>
             ) : filteredFighters.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                 No se encontraron peleadores
               </div>
             ) : (
               <div className="p-2 space-y-1">
                 {filteredFighters.map((fighter) => (
                   <div
                     key={fighter.id}
                     className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                       selectedFighter === fighter.id 
                         ? 'bg-primary/10 border border-primary' 
                         : 'hover:bg-muted'
                     }`}
                     onClick={() => {
                       setSelectedFighter(fighter.id);
                       if (fighter.weight_class) setWeightClass(fighter.weight_class);
                     }}
                   >
                     <OptimizedImage
                       src={fighter.avatar_url || ''}
                       alt={fighter.first_name}
                       className="w-8 h-8 rounded-full object-cover"
                       fallbackIcon={
                         <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                           <User className="h-4 w-4 text-muted-foreground" />
                         </div>
                       }
                     />
                     <div className="flex-1 min-w-0">
                       <p className="font-medium truncate">
                         {fighter.first_name} {fighter.last_name}
                       </p>
                       {fighter.nickname && (
                         <p className="text-xs text-muted-foreground truncate">"{fighter.nickname}"</p>
                       )}
                     </div>
                     {selectedFighter === fighter.id && (
                       <Check className="h-5 w-5 text-primary" />
                     )}
                   </div>
                 ))}
               </div>
             )}
           </ScrollArea>
 
           {/* Selected Fighter Info */}
           {selectedFighterData && (
             <div className="p-3 bg-muted/50 rounded-lg">
               <p className="text-sm font-medium mb-1">
                 Seleccionado: {selectedFighterData.first_name} {selectedFighterData.last_name}
               </p>
               <div className="flex gap-2">
                 <Badge variant="outline">{selectedFighterData.weight_class}</Badge>
                 {selectedFighterData.discipline && (
                   <Badge variant="secondary">{selectedFighterData.discipline}</Badge>
                 )}
               </div>
             </div>
           )}
 
           {/* Level & Weight Class */}
           <div className="grid grid-cols-2 gap-4">
             <div>
               <Label>Nivel *</Label>
               <Select value={level} onValueChange={setLevel}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {organization.allowed_levels.map((l) => (
                     <SelectItem key={l} value={l}>{l}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div>
               <Label>Categoría de Peso *</Label>
               <Select value={weightClass} onValueChange={setWeightClass}>
                 <SelectTrigger>
                   <SelectValue placeholder="Seleccionar" />
                 </SelectTrigger>
                 <SelectContent>
                   {WEIGHT_CLASSES.map((wc) => (
                     <SelectItem key={wc.value} value={wc.value}>{wc.label}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
 
           <p className="text-sm text-muted-foreground">
             El peleador iniciará con 0 puntos en {organization.name}.
           </p>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={handleClose}>
             Cancelar
           </Button>
           <Button 
             onClick={handleEnroll}
             disabled={!selectedFighter || !level || !weightClass || isLoading}
           >
             {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
             Inscribir
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }