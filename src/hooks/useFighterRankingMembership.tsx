 import { useState } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import { useQueryClient } from '@tanstack/react-query';
 
 export interface EnrollFighterParams {
   fighterId: string;
   organizationCode: string;
   level: string;
   weightClass: string;
 }
 
 export function useFighterRankingMembership() {
   const [isLoading, setIsLoading] = useState(false);
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   /**
    * Enroll a fighter in a ranking organization
    */
   const enrollFighter = async (params: EnrollFighterParams): Promise<string | null> => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase.rpc('enroll_fighter_in_ranking', {
         p_fighter_id: params.fighterId,
         p_organization_code: params.organizationCode,
         p_level: params.level,
         p_weight_class: params.weightClass,
       });
 
       if (error) throw error;
 
       toast({
         title: '¡Peleador inscrito!',
         description: `Inscrito correctamente en el ranking con 0 puntos iniciales.`,
       });
 
       // Invalidate relevant queries
       queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues', params.fighterId] });
       queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
 
       return data as string;
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Error al inscribir peleador';
       toast({
         title: 'Error',
         description: errorMessage,
         variant: 'destructive',
       });
       return null;
     } finally {
       setIsLoading(false);
     }
   };
 
   /**
    * Remove a fighter from a ranking (soft delete)
    */
   const removeFighterFromRanking = async (rankingId: string): Promise<boolean> => {
     setIsLoading(true);
     try {
       const { error } = await supabase.rpc('remove_fighter_from_ranking', {
         p_ranking_id: rankingId,
       });
 
       if (error) throw error;
 
       toast({
         title: 'Peleador removido',
         description: 'El peleador ha sido removido del ranking.',
       });
 
       // Invalidate relevant queries
       queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues'] });
       queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
 
       return true;
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Error al remover peleador';
       toast({
         title: 'Error',
         description: errorMessage,
         variant: 'destructive',
       });
       return false;
     } finally {
       setIsLoading(false);
     }
   };
 
   /**
    * Update a fighter's ranking level
    */
   const updateRankingLevel = async (rankingId: string, newLevel: string): Promise<boolean> => {
     setIsLoading(true);
     try {
       const { error } = await supabase.rpc('update_fighter_ranking_level', {
         p_ranking_id: rankingId,
         p_new_level: newLevel,
       });
 
       if (error) throw error;
 
       toast({
         title: 'Nivel actualizado',
         description: `El nivel ha sido cambiado a ${newLevel}.`,
       });
 
       // Invalidate relevant queries
       queryClient.invalidateQueries({ queryKey: ['fighter-active-leagues'] });
       queryClient.invalidateQueries({ queryKey: ['organization-ranking'] });
 
       return true;
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Error al actualizar nivel';
       toast({
         title: 'Error',
         description: errorMessage,
         variant: 'destructive',
       });
       return false;
     } finally {
       setIsLoading(false);
     }
   };
 
   return {
     enrollFighter,
     removeFighterFromRanking,
     updateRankingLevel,
     isLoading,
   };
 }