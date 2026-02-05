 import { useState, useEffect } from "react";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { useRankingOrganizations, RankingOrganization } from "@/hooks/useRankingOrganizations";
 import { Skeleton } from "@/components/ui/skeleton";
import { Swords } from "lucide-react";
 
 interface LeagueSelectorProps {
   value: string;
   onChange: (organizationCode: string) => void;
 }
 
 export function LeagueSelector({ value, onChange }: LeagueSelectorProps) {
   const { data: organizations, isLoading } = useRankingOrganizations();
   const [selectedDiscipline, setSelectedDiscipline] = useState<'MMA' | 'Boxeo'>('MMA');
 
   // Group organizations by discipline
   const mmaOrgs = organizations?.filter(org => org.discipline === 'MMA') || [];
   const boxeoOrgs = organizations?.filter(org => org.discipline === 'Boxeo') || [];
 
   // Set initial organization based on discipline
   useEffect(() => {
     const currentOrg = organizations?.find(org => org.code === value);
     if (currentOrg) {
       setSelectedDiscipline(currentOrg.discipline as 'MMA' | 'Boxeo');
     }
   }, [value, organizations]);
 
   // When discipline changes, select first org of that discipline
   useEffect(() => {
     const orgsForDiscipline = selectedDiscipline === 'MMA' ? mmaOrgs : boxeoOrgs;
     const currentOrg = organizations?.find(org => org.code === value);
     
     if (orgsForDiscipline.length > 0 && currentOrg?.discipline !== selectedDiscipline) {
       onChange(orgsForDiscipline[0].code);
     }
   }, [selectedDiscipline, mmaOrgs, boxeoOrgs, value, onChange, organizations]);
 
   if (isLoading) {
     return (
       <div className="space-y-4 mb-6">
         <Skeleton className="h-10 w-48 mx-auto" />
         <Skeleton className="h-12 w-full max-w-md mx-auto" />
       </div>
     );
   }
 
   const currentOrgs = selectedDiscipline === 'MMA' ? mmaOrgs : boxeoOrgs;
 
   return (
     <div className="space-y-4 mb-6">
       {/* Discipline Tabs */}
       <div className="flex justify-center">
         <Tabs 
           value={selectedDiscipline} 
           onValueChange={(v) => setSelectedDiscipline(v as 'MMA' | 'Boxeo')}
         >
           <TabsList className="bg-black/60 border border-purple-neon-primary/30 h-12">
             <TabsTrigger 
               value="MMA"
               className="data-[state=active]:bg-purple-neon-primary data-[state=active]:text-black px-6 py-2 gap-2"
             >
               <Swords className="h-4 w-4" />
               MMA
             </TabsTrigger>
             <TabsTrigger 
               value="Boxeo"
               className="data-[state=active]:bg-purple-neon-primary data-[state=active]:text-black px-6 py-2 gap-2"
             >
                <Swords className="h-4 w-4" />
               BOXEO
             </TabsTrigger>
           </TabsList>
         </Tabs>
       </div>
 
       {/* Organization Tabs */}
       {currentOrgs.length > 1 && (
         <div className="flex justify-center">
           <Tabs value={value} onValueChange={onChange}>
             <TabsList className="bg-black/40 border border-purple-neon-primary/20 flex-wrap h-auto gap-1 p-1">
               {currentOrgs.map((org) => (
                 <TabsTrigger
                   key={org.code}
                   value={org.code}
                   className="data-[state=active]:bg-purple-neon-primary/80 data-[state=active]:text-black px-4 py-2 flex flex-col items-center gap-1"
                 >
                   <span className="font-bold text-sm">{org.short_name}</span>
                   <div className="flex gap-1">
                     {org.allowed_levels.map((level) => (
                       <Badge 
                         key={level} 
                         variant="outline" 
                         className="text-[10px] px-1 py-0 border-purple-neon-primary/40"
                       >
                         {level === 'Profesional' ? 'PRO' : level === 'Semi-profesional' ? 'SEMI' : 'AM'}
                       </Badge>
                     ))}
                   </div>
                 </TabsTrigger>
               ))}
             </TabsList>
           </Tabs>
         </div>
       )}
 
       {/* Organization Description */}
       {currentOrgs.length > 0 && (
         <p className="text-center text-gray-400 text-sm">
           {currentOrgs.find(org => org.code === value)?.description}
         </p>
       )}
     </div>
   );
 }
 
 export default LeagueSelector;