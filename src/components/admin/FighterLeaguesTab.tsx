 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
 import { Label } from '@/components/ui/label';
 import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
 import { Trophy, Plus, Trash2, ArrowUp, Medal, Loader2 } from 'lucide-react';
 import { useFighterActiveLeagues, FighterActiveLeague } from '@/hooks/useFighterActiveLeagues';
 import { useFighterRankingMembership } from '@/hooks/useFighterRankingMembership';
 import { useRankingOrganizations } from '@/hooks/useRankingOrganizations';
 import { WEIGHT_CLASSES } from '@/lib/constants/disciplines';
 import { getWeightClassLabel } from '@/lib/constants/disciplines';
 
 interface FighterLeaguesTabProps {
   fighterId: string;
   fighterWeightClass?: string;
 }
 
 export function FighterLeaguesTab({ fighterId, fighterWeightClass }: FighterLeaguesTabProps) {
   const { data: leagues, isLoading: loadingLeagues, refetch } = useFighterActiveLeagues(fighterId);
   const { data: organizations, isLoading: loadingOrgs } = useRankingOrganizations();
   const { enrollFighter, removeFighterFromRanking, updateRankingLevel, isLoading } = useFighterRankingMembership();
 
   const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
   const [levelDialogOpen, setLevelDialogOpen] = useState(false);
   const [selectedLeague, setSelectedLeague] = useState<FighterActiveLeague | null>(null);
 
   // Enrollment form state
   const [enrollOrg, setEnrollOrg] = useState('');
   const [enrollLevel, setEnrollLevel] = useState('');
   const [enrollWeight, setEnrollWeight] = useState(fighterWeightClass || '');
 
   // Level change state
   const [newLevel, setNewLevel] = useState('');
 
   const selectedOrgData = organizations?.find(o => o.code === enrollOrg);
 
   const handleEnroll = async () => {
     if (!enrollOrg || !enrollLevel || !enrollWeight) return;
 
     const result = await enrollFighter({
       fighterId,
       organizationCode: enrollOrg,
       level: enrollLevel,
       weightClass: enrollWeight,
     });
 
     if (result) {
       setEnrollDialogOpen(false);
       setEnrollOrg('');
       setEnrollLevel('');
       refetch();
     }
   };
 
   const handleRemove = async (rankingId: string) => {
     const success = await removeFighterFromRanking(rankingId);
     if (success) {
       refetch();
     }
   };
 
   const handleLevelChange = async () => {
     if (!selectedLeague || !newLevel) return;
 
     const success = await updateRankingLevel(selectedLeague.id, newLevel);
     if (success) {
       setLevelDialogOpen(false);
       setSelectedLeague(null);
       setNewLevel('');
       refetch();
     }
   };
 
   const openLevelDialog = (league: FighterActiveLeague) => {
     setSelectedLeague(league);
     setNewLevel(league.level);
     setLevelDialogOpen(true);
   };
 
   const selectedLeagueOrg = selectedLeague 
     ? organizations?.find(o => o.code === selectedLeague.organization_code)
     : null;
 
   if (loadingLeagues || loadingOrgs) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   return (
     <div className="space-y-4">
       <Card>
         <CardHeader>
           <div className="flex items-center justify-between">
             <CardTitle className="flex items-center gap-2">
               <Trophy className="h-5 w-5" />
               Ligas de Competencia
             </CardTitle>
             <Button size="sm" onClick={() => setEnrollDialogOpen(true)}>
               <Plus className="h-4 w-4 mr-1" />
               Agregar Liga
             </Button>
           </div>
         </CardHeader>
         <CardContent>
           {leagues?.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               <Medal className="h-12 w-12 mx-auto mb-3 opacity-50" />
               <p>No está inscrito en ninguna liga</p>
               <p className="text-sm mt-1">Agrega una liga para que aparezca en los rankings</p>
             </div>
           ) : (
             <div className="space-y-3">
               {leagues?.map((league) => (
                 <div
                   key={league.id}
                   className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                 >
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <span className="font-semibold">{league.organization_name}</span>
                       {league.is_champion && (
                         <Badge variant="default" className="bg-primary text-primary-foreground">
                           🏆 Campeón
                         </Badge>
                       )}
                     </div>
                     <div className="flex flex-wrap gap-2 text-sm">
                       <Badge variant="secondary">{league.level}</Badge>
                       <Badge variant="outline">{getWeightClassLabel(league.weight_class)}</Badge>
                       <span className="text-muted-foreground">
                         {league.points} pts
                         {league.ranking_position && ` • #${league.ranking_position}`}
                       </span>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => openLevelDialog(league)}
                     >
                       <ArrowUp className="h-4 w-4 mr-1" />
                       Nivel
                     </Button>
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>¿Remover de {league.organization_short_name}?</AlertDialogTitle>
                           <AlertDialogDescription>
                             El peleador dejará de aparecer en el ranking de {league.organization_name}.
                             Esta acción puede deshacerse agregándolo nuevamente.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancelar</AlertDialogCancel>
                           <AlertDialogAction
                             onClick={() => handleRemove(league.id)}
                             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                           >
                             Remover
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Enroll Dialog */}
       <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Agregar a Nueva Liga</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div>
               <Label>Liga/Organización *</Label>
               <Select value={enrollOrg} onValueChange={(v) => { setEnrollOrg(v); setEnrollLevel(''); }}>
                 <SelectTrigger>
                   <SelectValue placeholder="Seleccionar liga" />
                 </SelectTrigger>
                 <SelectContent>
                   {organizations?.map((org) => (
                     <SelectItem key={org.code} value={org.code}>
                       {org.name} ({org.discipline})
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             {selectedOrgData && (
               <div>
                 <Label>Nivel *</Label>
                 <Select value={enrollLevel} onValueChange={setEnrollLevel}>
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccionar nivel" />
                   </SelectTrigger>
                   <SelectContent>
                     {selectedOrgData.allowed_levels.map((level) => (
                       <SelectItem key={level} value={level}>
                         {level}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}
 
             <div>
               <Label>Categoría de Peso *</Label>
               <Select value={enrollWeight} onValueChange={setEnrollWeight}>
                 <SelectTrigger>
                   <SelectValue placeholder="Seleccionar categoría" />
                 </SelectTrigger>
                 <SelectContent>
                   {WEIGHT_CLASSES.map((wc) => (
                     <SelectItem key={wc.value} value={wc.value}>
                       {wc.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             <p className="text-sm text-muted-foreground">
               El peleador iniciará con 0 puntos en este ranking.
             </p>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
               Cancelar
             </Button>
             <Button 
               onClick={handleEnroll} 
               disabled={!enrollOrg || !enrollLevel || !enrollWeight || isLoading}
             >
               {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Inscribir
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Level Change Dialog */}
       <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Cambiar Nivel</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <p className="text-sm text-muted-foreground">
               Liga: <strong>{selectedLeague?.organization_name}</strong>
             </p>
             <div>
               <Label>Nuevo Nivel *</Label>
               <Select value={newLevel} onValueChange={setNewLevel}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {selectedLeagueOrg?.allowed_levels.map((level) => (
                     <SelectItem key={level} value={level}>
                       {level}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setLevelDialogOpen(false)}>
               Cancelar
             </Button>
             <Button 
               onClick={handleLevelChange} 
               disabled={!newLevel || newLevel === selectedLeague?.level || isLoading}
             >
               {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Guardar
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }