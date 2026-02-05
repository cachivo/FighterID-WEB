 import { useState, useMemo } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Skeleton } from '@/components/ui/skeleton';
 import { OptimizedImage } from '@/components/ui/optimized-image';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Trophy, Search, User, Medal, Filter } from 'lucide-react';
 import { useAdminFighters } from '@/hooks/useAdminFighters';
 import { WEIGHT_CLASSES, getWeightClassLabel } from '@/lib/constants/disciplines';
 
 // Organizaciones por disciplina
 const RANKINGS_CONFIG = {
   MMA: [
     { id: 'UCC_MMA', name: 'UCC MMA Honduras', description: 'Ranking oficial UCC' }
   ],
   Boxeo: [
     { id: 'BDG_PRO_BOX', name: 'BDG Pro Boxing', description: 'Boxeo profesional' },
     { id: 'HHF_AMATEUR', name: 'Honduras Hood Fights', description: 'Boxeo amateur' }
   ]
 };
 
 export default function RankingsManagement() {
   const { fighters, loading } = useAdminFighters();
   const [selectedDiscipline, setSelectedDiscipline] = useState<'MMA' | 'Boxeo'>('MMA');
   const [selectedOrg, setSelectedOrg] = useState<string>('UCC_MMA');
   const [selectedWeightClass, setSelectedWeightClass] = useState<string>('all');
   const [selectedLevel, setSelectedLevel] = useState<string>('all');
   const [searchTerm, setSearchTerm] = useState('');
 
   // Filtrar peleadores por disciplina y otros criterios
   const filteredFighters = useMemo(() => {
     return fighters
       .filter(fighter => {
         const matchesDiscipline = fighter.discipline === selectedDiscipline;
         const matchesWeight = selectedWeightClass === 'all' || fighter.weight_class === selectedWeightClass;
         const matchesLevel = selectedLevel === 'all' || fighter.level === selectedLevel;
         const matchesSearch = `${fighter.first_name} ${fighter.last_name} ${fighter.nickname || ''}`
           .toLowerCase()
           .includes(searchTerm.toLowerCase());
         return matchesDiscipline && matchesWeight && matchesLevel && matchesSearch && fighter.active;
       })
       .sort((a, b) => {
         // Ordenar por puntos (wins * 3 + draws - losses)
         const pointsA = (a.record_wins * 3) + a.record_draws - a.record_losses;
         const pointsB = (b.record_wins * 3) + b.record_draws - b.record_losses;
         if (pointsB !== pointsA) return pointsB - pointsA;
         // Desempate por victorias
         return b.record_wins - a.record_wins;
       });
   }, [fighters, selectedDiscipline, selectedWeightClass, selectedLevel, searchTerm]);
 
   const handleDisciplineChange = (discipline: string) => {
     setSelectedDiscipline(discipline as 'MMA' | 'Boxeo');
     // Auto-seleccionar primera organización de la disciplina
     const orgs = RANKINGS_CONFIG[discipline as 'MMA' | 'Boxeo'];
     if (orgs.length > 0) {
       setSelectedOrg(orgs[0].id);
     }
   };
 
   const currentOrgs = RANKINGS_CONFIG[selectedDiscipline];
 
   if (loading) {
     return (
       <div className="space-y-6">
         <div className="flex items-center gap-3">
           <Trophy className="h-8 w-8 text-primary" />
           <div>
             <h1 className="text-2xl font-bold">Gestión de Rankings</h1>
             <p className="text-muted-foreground">Cargando peleadores...</p>
           </div>
         </div>
         <div className="grid gap-4">
           {[...Array(5)].map((_, i) => (
             <Skeleton key={i} className="h-16 w-full" />
           ))}
         </div>
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center gap-3">
         <Trophy className="h-8 w-8 text-primary" />
         <div>
           <h1 className="text-2xl font-bold">Gestión de Rankings</h1>
           <p className="text-muted-foreground">
             Administra los rankings por disciplina y organización
           </p>
         </div>
       </div>
 
       {/* Tabs de Disciplina */}
       <Tabs value={selectedDiscipline} onValueChange={handleDisciplineChange}>
         <TabsList className="grid w-full grid-cols-2 max-w-md">
           <TabsTrigger value="MMA" className="flex items-center gap-2">
             <Medal className="h-4 w-4" />
             MMA
           </TabsTrigger>
           <TabsTrigger value="Boxeo" className="flex items-center gap-2">
             <Medal className="h-4 w-4" />
             Boxeo
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value={selectedDiscipline} className="mt-6 space-y-4">
           {/* Selector de Organización */}
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-lg">Organización</CardTitle>
               <CardDescription>
                 Selecciona la liga o federación para ver su ranking
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="flex flex-wrap gap-2">
                 {currentOrgs.map((org) => (
                   <Button
                     key={org.id}
                     variant={selectedOrg === org.id ? 'default' : 'outline'}
                     size="sm"
                     onClick={() => setSelectedOrg(org.id)}
                     className="min-h-[44px] touch-manipulation"
                   >
                     {org.name}
                   </Button>
                 ))}
               </div>
             </CardContent>
           </Card>
 
           {/* Filtros */}
           <Card>
             <CardContent className="pt-6">
               <div className="flex flex-col md:flex-row gap-4">
                 <div className="flex-1 relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     placeholder="Buscar peleador..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-9"
                   />
                 </div>
                 <Select value={selectedWeightClass} onValueChange={setSelectedWeightClass}>
                   <SelectTrigger className="w-full md:w-48">
                     <SelectValue placeholder="Categoría" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todas las categorías</SelectItem>
                     {WEIGHT_CLASSES.map(wc => (
                       <SelectItem key={wc.value} value={wc.value}>
                         {wc.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                   <SelectTrigger className="w-full md:w-40">
                     <SelectValue placeholder="Nivel" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos los niveles</SelectItem>
                     <SelectItem value="Amateur">Amateur</SelectItem>
                     <SelectItem value="Semi-profesional">Semi-pro</SelectItem>
                     <SelectItem value="Profesional">Profesional</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <p className="text-sm text-muted-foreground mt-3">
                 <Filter className="inline h-4 w-4 mr-1" />
                 Mostrando {filteredFighters.length} peleadores en {selectedDiscipline}
               </p>
             </CardContent>
           </Card>
 
           {/* Tabla de Ranking */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Trophy className="h-5 w-5 text-yellow-500" />
                 Ranking {currentOrgs.find(o => o.id === selectedOrg)?.name}
               </CardTitle>
             </CardHeader>
             <CardContent>
               {filteredFighters.length === 0 ? (
                 <div className="text-center py-12">
                   <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                   <p className="text-lg font-medium">No hay peleadores</p>
                   <p className="text-muted-foreground">
                     No se encontraron peleadores de {selectedDiscipline} con los filtros seleccionados
                   </p>
                 </div>
               ) : (
                 <div className="overflow-x-auto">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead className="w-16">#</TableHead>
                         <TableHead>Peleador</TableHead>
                         <TableHead>Categoría</TableHead>
                         <TableHead>Nivel</TableHead>
                         <TableHead className="text-center">Récord</TableHead>
                         <TableHead className="text-center">Pts</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {filteredFighters.map((fighter, index) => {
                         const points = (fighter.record_wins * 3) + fighter.record_draws - fighter.record_losses;
                         return (
                           <TableRow key={fighter.id}>
                             <TableCell>
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                 index === 0 ? 'bg-yellow-500 text-yellow-950' :
                                 index === 1 ? 'bg-gray-300 text-gray-800' :
                                 index === 2 ? 'bg-amber-600 text-amber-50' :
                                 'bg-muted text-muted-foreground'
                               }`}>
                                 {index + 1}
                               </div>
                             </TableCell>
                             <TableCell>
                               <div className="flex items-center gap-3">
                                 <OptimizedImage
                                   src={fighter.avatar_url || ''}
                                   alt={`${fighter.first_name} ${fighter.last_name}`}
                                   className="w-10 h-10 rounded-full object-cover border"
                                   fallbackIcon={
                                     <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                       <User className="h-5 w-5 text-muted-foreground" />
                                     </div>
                                   }
                                 />
                                 <div>
                                   <p className="font-medium">
                                     {fighter.first_name} {fighter.last_name}
                                   </p>
                                   {fighter.nickname && (
                                     <p className="text-xs text-muted-foreground">"{fighter.nickname}"</p>
                                   )}
                                 </div>
                               </div>
                             </TableCell>
                             <TableCell>
                               <Badge variant="outline" className="text-xs">
                                 {getWeightClassLabel(fighter.weight_class)}
                               </Badge>
                             </TableCell>
                             <TableCell>
                               <Badge variant="secondary" className="text-xs">
                                 {fighter.level || 'Amateur'}
                               </Badge>
                             </TableCell>
                             <TableCell className="text-center font-mono">
                               <span className="text-green-600">{fighter.record_wins}</span>
                               -
                               <span className="text-red-600">{fighter.record_losses}</span>
                               -
                               <span className="text-muted-foreground">{fighter.record_draws}</span>
                             </TableCell>
                             <TableCell className="text-center">
                               <span className="font-bold text-primary">{points}</span>
                             </TableCell>
                           </TableRow>
                         );
                       })}
                     </TableBody>
                   </Table>
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>
   );
 }