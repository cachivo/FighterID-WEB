import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Calendar, MapPin, Clock, Trophy, Eye, EyeOff, Search, Wand2, Palette, Check, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, useFights, BdgEvent } from '@/hooks/useEvents';
import { useExternalFighters } from '@/hooks/useExternalFighters';
import { ExternalFighterForm } from '@/components/admin/ExternalFighterForm';
import { FileUpload } from '@/components/ui/file-upload';
import { Switch } from '@/components/ui/switch';
import { WEIGHT_CLASSES } from '@/lib/constants/disciplines';
import { EventBrandingModal } from '@/components/admin/EventBrandingModal';
 
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
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Label } from '@/components/ui/label';
 import { format } from 'date-fns';
 import { es } from 'date-fns/locale';
 
 interface FighterProfile {
   id: string;
   first_name: string;
   last_name: string;
   nickname?: string;
   weight_class: string;
   record_wins: number;
   record_losses: number;
   record_draws: number;
   avatar_url?: string;
 }
 
export default function EventosPelea() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { events, loading, createEvent, updateEvent, updateEventState, updateEventMeta, togglePublishEvent, deleteEvent, refreshEvents } = useEvents();
    console.log('[EventosPelea] loading:', loading, 'events:', events?.length);
    
    // Branding modal state
    const [showBrandingModal, setShowBrandingModal] = useState(false);
    const [brandingEvent, setBrandingEvent] = useState<BdgEvent | null>(null);
   console.log('[EventosPelea] loading:', loading, 'events:', events?.length);
   
   const [showCreateDialog, setShowCreateDialog] = useState(false);
   const [showFightersDialog, setShowFightersDialog] = useState(false);
   const [showFightsDialog, setShowFightsDialog] = useState(false);
   const [selectedEvent, setSelectedEvent] = useState<BdgEvent | null>(null);
   const [fighters, setFighters] = useState<FighterProfile[]>([]);
   const [availableFighters, setAvailableFighters] = useState<FighterProfile[]>([]);
   const [eventFighters, setEventFighters] = useState<string[]>([]);
   const [fighterSearchTerm, setFighterSearchTerm] = useState('');
   const [editingFight, setEditingFight] = useState<any | null>(null);
   
   // External fighters hook
   const { externalFighters, createExternalFighter, searchExternalFighters } = useExternalFighters();
   
   // Fight creation with external fighters
   const [fighterAIsRegistered, setFighterAIsRegistered] = useState(true);
   const [fighterBIsRegistered, setFighterBIsRegistered] = useState(true);
   const [externalFighterAData, setExternalFighterAData] = useState({
     name: '',
     nickname: '',
     weight_class: '',
     gym: '',
     country: 'Honduras',
     record: { wins: 0, losses: 0, draws: 0 }
   });
   const [externalFighterBData, setExternalFighterBData] = useState({
     name: '',
     nickname: '',
     weight_class: '',
     gym: '',
     country: 'Honduras',
     record: { wins: 0, losses: 0, draws: 0 }
   });
    const [imageFileA, setImageFileA] = useState<File | undefined>();
    const [imageFileB, setImageFileB] = useState<File | undefined>();
    const [eventImageFileA, setEventImageFileA] = useState<File | undefined>();
    const [eventImageFileB, setEventImageFileB] = useState<File | undefined>();
    const [removeBackgroundA, setRemoveBackgroundA] = useState(false);
    const [removeBackgroundB, setRemoveBackgroundB] = useState(false);
    
    // New states for explicit IA processing
    const [processedImageA, setProcessedImageA] = useState<File | null>(null);
    const [processedImageB, setProcessedImageB] = useState<File | null>(null);
    const [processingA, setProcessingA] = useState(false);
    const [processingB, setProcessingB] = useState(false);
    const [processedHashA, setProcessedHashA] = useState<string | null>(null);
    const [processedHashB, setProcessedHashB] = useState<string | null>(null);
    
    // Image source selection: 'upload' | 'profile'
    const [imageSourceA, setImageSourceA] = useState<'upload' | 'profile'>('upload');
    const [imageSourceB, setImageSourceB] = useState<'upload' | 'profile'>('upload');
    
    // Hash a file for deduplication
    const hashFile = async (file: File): Promise<string> => {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };
    
    // Process image with AI (explicit button click)
    const handleProcessImageWithAI = async (corner: 'A' | 'B') => {
      const file = corner === 'A' ? eventImageFileA : eventImageFileB;
      if (!file) {
        toast({ description: 'Primero selecciona una imagen', variant: 'destructive' });
        return;
      }
      
      const setProcessing = corner === 'A' ? setProcessingA : setProcessingB;
      const setProcessedImage = corner === 'A' ? setProcessedImageA : setProcessedImageB;
      const setProcessedHash = corner === 'A' ? setProcessedHashA : setProcessedHashB;
      const currentHash = corner === 'A' ? processedHashA : processedHashB;
      
      try {
        // Check if already processed (same file)
        const fileHash = await hashFile(file);
        if (fileHash === currentHash) {
          toast({ description: '⚠️ Esta imagen ya fue procesada. No se consumirán créditos adicionales.' });
          return;
        }
        
        setProcessing(true);
        toast({ description: `Removiendo fondo con IA (1 crédito)...` });
        
        const { removeBackgroundAI } = await import('@/lib/backgroundRemovalAI');
        const processedBlob = await removeBackgroundAI(file);
        
        // Optional: trim transparent borders
        const { trimTransparentBorders } = await import('@/lib/imageUtils');
        const trimmedFile = await trimTransparentBorders(
          new File([processedBlob], `processed-${corner}.png`, { type: 'image/png' })
        );
        
        setProcessedImage(trimmedFile);
        setProcessedHash(fileHash);
        
        toast({ description: '✅ ¡Fondo removido y recortado correctamente!' });
      } catch (error) {
        console.error('AI processing error:', error);
        toast({ 
          description: 'Error al procesar la imagen. Intenta de nuevo.', 
          variant: 'destructive' 
        });
      } finally {
        setProcessing(false);
      }
    };
     
    // Validation for event images (accept more formats when using AI removal)
    const validateEventImage = (file: File, useAIRemoval: boolean): string | null => {
      const allowedTypes = useAIRemoval 
        ? ['image/png', 'image/jpeg', 'image/webp', 'image/jpg']
        : ['image/png'];
      
      if (!allowedTypes.includes(file.type)) {
        return useAIRemoval 
          ? 'Solo se permiten imágenes PNG, JPG o WebP'
          : 'Solo se permiten imágenes PNG (sin fondo/transparentes)';
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        return 'La imagen no puede superar 5MB';
      }
      return null;
    };
   
   // Form states
   const [formData, setFormData] = useState({
     name: '',
     description: '',
     discipline: 'MMA',
     venue: '',
     start_time: '',
     end_time: '',
     branding: 'ucc' as 'ucc' | 'hoodfights' | 'custom'
   });
 
   const [fightData, setFightData] = useState({
     fight_number: 1,
     fight_type: 'AMATEUR',
     fighter_a_id: '',
     fighter_b_id: '',
     weight_class: '',
     card_position: 'regular' as 'main_event' | 'co_main_event' | 'regular',
     number_of_rounds: 3
   });
 
   useEffect(() => {
     console.log('[EventosPelea] Component mounted, fetching fighters');
     fetchFighters();
   }, []);
 
   useEffect(() => {
     console.log('[EventosPelea] events updated:', events);
   }, [events]);
 
   useEffect(() => {
     console.log('[EventosPelea] loading state changed:', loading);
   }, [loading]);
 
   const fetchFighters = async () => {
     try {
       const { data, error } = await supabase
         .from('fighter_profiles')
         .select('id, first_name, last_name, nickname, weight_class, record_wins, record_losses, record_draws, avatar_url')
         .eq('active', true)
         .order('first_name');
 
       if (error) throw error;
       setAvailableFighters(data || []);
     } catch (error) {
       console.error('Error fetching fighters:', error);
     }
   };
 
   const handleCreateEvent = async () => {
     if (!formData.name || !formData.discipline) {
       toast({
         title: 'Error',
         description: 'El nombre y disciplina son obligatorios',
         variant: 'destructive',
       });
       return;
     }

     try {
       // Build branding meta based on selection
       const brandingLogos: Record<string, { logo: string; watermark: string }> = {
         ucc: {
           logo: '/lovable-uploads/ucc-logo-transparent.png',
           watermark: '/lovable-uploads/ucc-logo-transparent.png'
         },
         hoodfights: {
           logo: '/lovable-uploads/honduras-hoodfights-logo.png',
           watermark: '/lovable-uploads/honduras-hoodfights-logo.png'
         }
       };

       const branding = {
         key: formData.branding,
         logo_url: brandingLogos[formData.branding]?.logo || '',
         watermark_url: brandingLogos[formData.branding]?.watermark || '',
         require_billboard_images: formData.branding === 'hoodfights'
       };

       const eventData = {
         name: formData.name,
         description: formData.description,
         discipline: formData.discipline,
         venue: formData.venue,
         start_time: formData.start_time,
         end_time: formData.end_time,
         meta: { branding }
       };
       
       await createEvent(eventData);
       setShowCreateDialog(false);
       setFormData({
         name: '',
         description: '',
         discipline: 'MMA',
         venue: '',
         start_time: '',
         end_time: '',
         branding: 'ucc'
       });
       
       toast({
         title: 'Éxito',
         description: 'Evento creado correctamente',
       });
     } catch (error) {
       toast({
         title: 'Error',
         description: 'No se pudo crear el evento',
         variant: 'destructive',
       });
     }
   };
 
   const handleAddFighterToEvent = async (fighterId: string) => {
     if (!selectedEvent || eventFighters.includes(fighterId)) return;
 
     setEventFighters(prev => [...prev, fighterId]);
     toast({
       title: 'Éxito',
       description: 'Peleador agregado al evento',
     });
   };
 
   const handleSaveFight = async () => {
     if (!user) {
       toast({
         title: 'Error de autenticación',
         description: 'Debes iniciar sesión para gestionar peleas',
         variant: 'destructive',
       });
       return;
     }
 
     if (!selectedEvent || !fightData.weight_class) {
       toast({
         title: 'Error',
         description: 'Debes completar todos los campos obligatorios',
         variant: 'destructive',
       });
       return;
     }
 
     try {
       let fighterAId: string | null = null;
       let fighterAExternalId: string | null = null;
       let fighterBId: string | null = null;
       let fighterBExternalId: string | null = null;
 
       if (fighterAIsRegistered) {
         if (!fightData.fighter_a_id) {
           toast({
             title: 'Error',
             description: 'Debes seleccionar el Peleador A',
             variant: 'destructive',
           });
           return;
         }
         fighterAId = fightData.fighter_a_id;
       } else {
         if (editingFight?.fighter_a_external_id) {
           fighterAExternalId = editingFight.fighter_a_external_id;
         } else {
           if (!externalFighterAData.name || !externalFighterAData.weight_class) {
             toast({
               title: 'Error',
               description: 'Debes completar nombre y categoría del Peleador A',
               variant: 'destructive',
             });
             return;
           }
           const externalId = await createExternalFighter(externalFighterAData, imageFileA);
           if (!externalId) return;
           fighterAExternalId = externalId;
         }
       }
 
       if (fighterBIsRegistered) {
         if (!fightData.fighter_b_id) {
           toast({
             title: 'Error',
             description: 'Debes seleccionar el Peleador B',
             variant: 'destructive',
           });
           return;
         }
         if (fighterAId && fightData.fighter_b_id === fighterAId) {
           toast({
             title: 'Error',
             description: 'No puedes asignar el mismo peleador dos veces',
             variant: 'destructive',
           });
           return;
         }
         fighterBId = fightData.fighter_b_id;
       } else {
         if (editingFight?.fighter_b_external_id) {
           fighterBExternalId = editingFight.fighter_b_external_id;
         } else {
           if (!externalFighterBData.name || !externalFighterBData.weight_class) {
             toast({
               title: 'Error',
               description: 'Debes completar nombre y categoría del Peleador B',
               variant: 'destructive',
             });
             return;
           }
           const externalId = await createExternalFighter(externalFighterBData, imageFileB);
           if (!externalId) return;
           fighterBExternalId = externalId;
         }
       }
 
        let fighterAEventImageUrl: string | null = editingFight?.fighter_a_event_image_url || null;
        let fighterBEventImageUrl: string | null = editingFight?.fighter_b_event_image_url || null;

        // IMPROVED: Use pre-processed images or fallback to profile
        if (imageSourceA === 'upload') {
          const fileToUpload = processedImageA || eventImageFileA;
          if (fileToUpload) {
            const fileName = `${Date.now()}-fighter-a-${Math.random().toString(36).substring(7)}.png`;
            
            const { error: uploadErrorA } = await supabase.storage
              .from('event-fighter-images')
              .upload(fileName, fileToUpload);
    
            if (uploadErrorA) throw uploadErrorA;
    
            const { data: { publicUrl: publicUrlA } } = supabase.storage
              .from('event-fighter-images')
              .getPublicUrl(fileName);
    
            fighterAEventImageUrl = publicUrlA;
          }
        } else if (imageSourceA === 'profile') {
          // Use profile image - explicitly set to avatar_url so it's stored in the fight record
          const fighterA = fighterAIsRegistered 
            ? availableFighters.find(f => f.id === fightData.fighter_a_id)
            : null;
          if (fighterA?.avatar_url) {
            fighterAEventImageUrl = fighterA.avatar_url;
          }
        }

        if (imageSourceB === 'upload') {
          const fileToUpload = processedImageB || eventImageFileB;
          if (fileToUpload) {
            const fileName = `${Date.now()}-fighter-b-${Math.random().toString(36).substring(7)}.png`;
            
            const { error: uploadErrorB } = await supabase.storage
              .from('event-fighter-images')
              .upload(fileName, fileToUpload);
    
            if (uploadErrorB) throw uploadErrorB;
    
            const { data: { publicUrl: publicUrlB } } = supabase.storage
              .from('event-fighter-images')
              .getPublicUrl(fileName);
    
            fighterBEventImageUrl = publicUrlB;
          }
        } else if (imageSourceB === 'profile') {
          // Use profile image
          const fighterB = fighterBIsRegistered 
            ? availableFighters.find(f => f.id === fightData.fighter_b_id)
            : null;
          if (fighterB?.avatar_url) {
            fighterBEventImageUrl = fighterB.avatar_url;
          }
        }
 
       if (editingFight) {
         const { error } = await supabase
           .from('fights')
           .update({
             fight_number: fightData.fight_number,
             fight_type: fightData.fight_type,
             fighter_a_id: fighterAId,
             fighter_b_id: fighterBId,
             fighter_a_external_id: fighterAExternalId,
             fighter_b_external_id: fighterBExternalId,
             fighter_a_event_image_url: fighterAEventImageUrl,
             fighter_b_event_image_url: fighterBEventImageUrl,
             weight_class: fightData.weight_class,
             card_position: fightData.card_position
           })
           .eq('id', editingFight.id);
 
         if (error) throw error;
 
         const { data: existingRounds } = await supabase
           .from('fight_rounds')
           .select('id, number')
           .eq('fight_id', editingFight.id)
           .order('number');
 
         const currentRoundsCount = existingRounds?.length || 0;
         const desiredRounds = fightData.number_of_rounds;
 
         if (currentRoundsCount < desiredRounds) {
           const roundsToCreate = [];
           for (let i = currentRoundsCount + 1; i <= desiredRounds; i++) {
             roundsToCreate.push({
               fight_id: editingFight.id,
               number: i,
               duration_seconds: 300,
               status: 'scheduled'
             });
           }
 
           if (roundsToCreate.length > 0) {
             await supabase.from('fight_rounds').insert(roundsToCreate);
           }
         } else if (currentRoundsCount > desiredRounds) {
           const roundsToDelete = existingRounds
             ?.filter(r => r.number > desiredRounds)
             .map(r => r.id) || [];
           
           if (roundsToDelete.length > 0) {
             await supabase
               .from('fight_rounds')
               .delete()
               .in('id', roundsToDelete);
           }
         }
 
         toast({
           title: '✅ Pelea actualizada',
           description: `Pelea #${fightData.fight_number} actualizada con ${desiredRounds} rounds`,
         });
       } else {
         const { data, error } = await supabase
           .from('fights')
           .insert({
             event_id: selectedEvent.id,
             fight_number: fightData.fight_number,
             fight_type: fightData.fight_type,
             fighter_a_id: fighterAId,
             fighter_b_id: fighterBId,
             fighter_a_external_id: fighterAExternalId,
             fighter_b_external_id: fighterBExternalId,
             fighter_a_event_image_url: fighterAEventImageUrl,
             fighter_b_event_image_url: fighterBEventImageUrl,
             weight_class: fightData.weight_class,
             status: 'scheduled',
             card_position: fightData.card_position
           })
           .select()
           .single();
 
         if (error) throw error;
 
         const { data: existingRounds } = await supabase
           .from('fight_rounds')
           .select('id, number, status')
           .eq('fight_id', data.id)
           .order('number');
 
         const currentRoundsCount = existingRounds?.length || 0;
         const desiredRounds = fightData.number_of_rounds;
 
         if (currentRoundsCount < desiredRounds) {
           const roundsToCreate = [];
           for (let i = currentRoundsCount + 1; i <= desiredRounds; i++) {
             roundsToCreate.push({
               fight_id: data.id,
               number: i,
               duration_seconds: 300,
               status: 'scheduled'
             });
           }
 
           if (roundsToCreate.length > 0) {
             const { error: createRoundsError } = await supabase
               .from('fight_rounds')
               .insert(roundsToCreate);
 
             if (createRoundsError) {
               console.error('Error creating additional rounds:', createRoundsError);
               toast({
                 title: 'Advertencia',
                 description: `Pelea creada pero hubo un problema al crear todos los rounds`,
                 variant: 'destructive',
               });
             }
           }
         }
 
         toast({
           title: '✅ Éxito',
           description: `Pelea #${data.fight_number} creada con ${desiredRounds} rounds`,
         });
       }
 
       resetFightForm();
       setShowFightsDialog(false);
 
     } catch (error: any) {
       console.error('Fight save error:', error);
       toast({
         title: 'Error',
         description: error.message || 'No se pudo guardar la pelea',
         variant: 'destructive',
       });
     }
   };
 
   const resetFightForm = () => {
     setFightData({
       fight_number: editingFight ? fightData.fight_number : fightData.fight_number + 1,
       fight_type: 'AMATEUR',
       fighter_a_id: '',
       fighter_b_id: '',
       weight_class: '',
       card_position: 'regular',
       number_of_rounds: 3
     });
     setFighterAIsRegistered(true);
     setFighterBIsRegistered(true);
     setExternalFighterAData({
       name: '',
       nickname: '',
       weight_class: '',
       gym: '',
       country: 'Honduras',
       record: { wins: 0, losses: 0, draws: 0 }
     });
     setExternalFighterBData({
       name: '',
       nickname: '',
       weight_class: '',
       gym: '',
       country: 'Honduras',
       record: { wins: 0, losses: 0, draws: 0 }
     });
      setImageFileA(undefined);
      setImageFileB(undefined);
      setEventImageFileA(undefined);
      setEventImageFileB(undefined);
      setRemoveBackgroundA(false);
      setRemoveBackgroundB(false);
      setProcessedImageA(null);
      setProcessedImageB(null);
      setProcessedHashA(null);
      setProcessedHashB(null);
      setImageSourceA('upload');
      setImageSourceB('upload');
      setEditingFight(null);
    };
 
   const handleEditFight = async (fight: any) => {
     const { count } = await supabase
       .from('fight_rounds')
       .select('*', { count: 'exact', head: true })
       .eq('fight_id', fight.id);
     
     setEditingFight(fight);
     setFightData({
       fight_number: fight.fight_number,
       fight_type: fight.fight_type,
       fighter_a_id: fight.fighter_a_id || '',
       fighter_b_id: fight.fighter_b_id || '',
       weight_class: fight.weight_class,
       card_position: fight.card_position || 'regular',
       number_of_rounds: count || 3
     });
     
     setFighterAIsRegistered(!!fight.fighter_a_id);
     setFighterBIsRegistered(!!fight.fighter_b_id);
     
     if (fight.fighter_a_external_id) {
       const { data: externalA } = await supabase
         .from('external_fighters')
         .select('*')
         .eq('id', fight.fighter_a_external_id)
         .single();
       
       if (externalA) {
         const recordA = typeof externalA.record === 'object' && externalA.record !== null
           ? externalA.record as { wins: number; losses: number; draws: number }
           : { wins: 0, losses: 0, draws: 0 };
           
         setExternalFighterAData({
           name: externalA.name || '',
           nickname: externalA.nickname || '',
           weight_class: externalA.weight_class || '',
           gym: externalA.gym || '',
           country: externalA.country || 'Honduras',
           record: recordA
         });
       }
     }
     
     if (fight.fighter_b_external_id) {
       const { data: externalB } = await supabase
         .from('external_fighters')
         .select('*')
         .eq('id', fight.fighter_b_external_id)
         .single();
       
       if (externalB) {
         const recordB = typeof externalB.record === 'object' && externalB.record !== null
           ? externalB.record as { wins: number; losses: number; draws: number }
           : { wins: 0, losses: 0, draws: 0 };
           
         setExternalFighterBData({
           name: externalB.name || '',
           nickname: externalB.nickname || '',
           weight_class: externalB.weight_class || '',
           gym: externalB.gym || '',
           country: externalB.country || 'Honduras',
           record: recordB
         });
       }
     }
   };
 
   const handleDeleteEvent = async (eventId: string) => {
     try {
       await deleteEvent(eventId);
       toast({
         title: 'Éxito',
         description: 'Evento eliminado correctamente',
       });
     } catch (error) {
       toast({
         title: 'Error',
         description: 'No se pudo eliminar el evento',
         variant: 'destructive',
       });
     }
   };
 
   const handleTogglePublish = async (eventId: string, currentPublished: boolean) => {
     try {
       await togglePublishEvent(eventId, !currentPublished);
       toast({
         title: 'Éxito',
         description: !currentPublished 
           ? 'Evento publicado y visible al público' 
           : 'Evento despublicado y ahora es privado',
       });
     } catch (error) {
       toast({
         title: 'Error',
         description: 'No se pudo cambiar la visibilidad del evento',
         variant: 'destructive',
       });
     }
   };
 
   const getStateColor = (state: string) => {
     switch (state) {
       case 'draft':
         return 'bg-muted text-muted-foreground';
       case 'live':
         return 'bg-destructive text-destructive-foreground';
       case 'finished':
         return 'bg-muted-foreground text-background';
       default:
         return 'bg-secondary text-secondary-foreground';
     }
   };
 
   const getStateText = (state: string) => {
     switch (state) {
       case 'draft':
         return 'Borrador';
       case 'live':
         return 'EN VIVO';
       case 'finished':
         return 'Finalizado';
       default:
         return state.toUpperCase();
     }
   };
 
   const EventIcon = Trophy;
 
   const eventFightersData = eventFighters.map(fighterId => 
     availableFighters.find(f => f.id === fighterId)
   ).filter(Boolean);
 
   if (loading) {
     return (
       <div className="flex items-center justify-center min-h-[400px]">
         <div className="text-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
           <p className="text-muted-foreground">Cargando eventos...</p>
         </div>
       </div>
     );
   }
 
   const hasEvents = Array.isArray(events) && events.length > 0;
   
   if (!hasEvents) {
     return (
       <div className="space-y-6">
         <div className="flex justify-between items-center">
           <div>
             <h2 className="text-3xl font-bold tracking-tight">Eventos de Pelea</h2>
             <p className="text-muted-foreground">
               Gestiona los eventos de combate con peleadores y peleas específicas
             </p>
           </div>
           <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
             <DialogTrigger asChild>
               <Button>
                 <Plus className="mr-2 h-4 w-4" />
                 Nuevo Evento de Pelea
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
               <DialogHeader>
                 <DialogTitle>Crear Nuevo Evento de Pelea</DialogTitle>
                 <DialogDescription>
                   Crea un evento específico de combate donde puedes agregar peleadores y peleas.
                 </DialogDescription>
               </DialogHeader>
               <div className="space-y-4">
                 <div>
                   <Label htmlFor="name">Nombre del Evento *</Label>
                   <Input
                     id="name"
                     placeholder="Ej: Batalla de Gimnasios #1"
                     value={formData.name}
                     onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                   />
                 </div>
                 
                 <div>
                   <Label htmlFor="description">Descripción</Label>
                   <Textarea
                     id="description"
                     placeholder="Describe el evento"
                     value={formData.description}
                     onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                     rows={3}
                   />
                 </div>
 
                 <div>
                   <Label htmlFor="discipline">Disciplina *</Label>
                   <Select value={formData.discipline} onValueChange={(value) => setFormData(prev => ({...prev, discipline: value}))}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="MMA">MMA</SelectItem>
                       <SelectItem value="Boxeo">Boxeo</SelectItem>
                       <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                       <SelectItem value="Muay Thai">Muay Thai</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div>
                   <Label htmlFor="venue">Sede</Label>
                   <Input
                     id="venue"
                     placeholder="Ej: Arena Multideportiva"
                     value={formData.venue}
                     onChange={(e) => setFormData(prev => ({...prev, venue: e.target.value}))}
                   />
                 </div>
 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="start_time">Fecha y Hora Inicio</Label>
                     <Input
                       id="start_time"
                       type="datetime-local"
                       value={formData.start_time}
                       onChange={(e) => setFormData(prev => ({...prev, start_time: e.target.value}))}
                     />
                   </div>
                   <div>
                     <Label htmlFor="end_time">Fecha y Hora Fin</Label>
                     <Input
                       id="end_time"
                       type="datetime-local"
                       value={formData.end_time}
                       onChange={(e) => setFormData(prev => ({...prev, end_time: e.target.value}))}
                     />
                   </div>
                  </div>

                  {/* Branding Selection */}
                  <div>
                    <Label htmlFor="branding-empty" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Marca/Branding del Evento *
                    </Label>
                    <Select 
                      value={formData.branding} 
                      onValueChange={(value: 'ucc' | 'hoodfights' | 'custom') => setFormData(prev => ({...prev, branding: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ucc">UCC (Urban Combat Championship)</SelectItem>
                        <SelectItem value="hoodfights">
                          <div className="flex items-center gap-2">
                            <span>Honduras Hoodfights</span>
                            <Badge variant="secondary" className="text-xs">Requiere imágenes</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.branding === 'hoodfights' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Este evento requerirá imágenes de cartelera sin fondo para cada peleador
                      </p>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateEvent}>Crear Evento</Button>
                </DialogFooter>
             </DialogContent>
           </Dialog>
         </div>
         
         <Card>
           <CardContent className="flex flex-col items-center justify-center py-12">
             <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
             <h3 className="text-xl font-semibold mb-2">No hay eventos creados</h3>
             <p className="text-muted-foreground mb-4">Crea tu primer evento de pelea para comenzar</p>
             <Button onClick={() => setShowCreateDialog(true)}>
               <Plus className="mr-2 h-4 w-4" />
               Crear Primer Evento
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <div className="flex justify-between items-center">
         <div>
           <h2 className="text-3xl font-bold tracking-tight">Eventos de Pelea</h2>
           <p className="text-muted-foreground">
             Gestiona los eventos de combate con peleadores y peleas específicas
           </p>
         </div>
         <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
           <DialogTrigger asChild>
             <Button>
               <Plus className="mr-2 h-4 w-4" />
               Nuevo Evento de Pelea
             </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>Crear Nuevo Evento de Pelea</DialogTitle>
               <DialogDescription>
                 Crea un evento específico de combate donde puedes agregar peleadores y peleas.
               </DialogDescription>
             </DialogHeader>
             <div className="space-y-4">
               <div>
                 <Label htmlFor="name">Nombre del Evento *</Label>
                 <Input
                   id="name"
                   placeholder="Ej: Batalla de Gimnasios #1"
                   value={formData.name}
                   onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                 />
               </div>
               
               <div>
                 <Label htmlFor="description">Descripción</Label>
                 <Textarea
                   id="description"
                   placeholder="Describe el evento"
                   value={formData.description}
                   onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                   rows={3}
                 />
               </div>
 
               <div>
                 <Label htmlFor="discipline">Disciplina *</Label>
                 <Select value={formData.discipline} onValueChange={(value) => setFormData(prev => ({...prev, discipline: value}))}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="MMA">MMA</SelectItem>
                     <SelectItem value="Boxeo">Boxeo</SelectItem>
                     <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                     <SelectItem value="Muay Thai">Muay Thai</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
 
               <div>
                 <Label htmlFor="venue">Sede</Label>
                 <Input
                   id="venue"
                   placeholder="Ej: Arena Multideportiva"
                   value={formData.venue}
                   onChange={(e) => setFormData(prev => ({...prev, venue: e.target.value}))}
                 />
               </div>
 
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="start_time">Fecha y Hora Inicio</Label>
                   <Input
                     id="start_time"
                     type="datetime-local"
                     value={formData.start_time}
                     onChange={(e) => setFormData(prev => ({...prev, start_time: e.target.value}))}
                   />
                 </div>
                 <div>
                   <Label htmlFor="end_time">Fecha y Hora Fin</Label>
                   <Input
                     id="end_time"
                     type="datetime-local"
                     value={formData.end_time}
                     onChange={(e) => setFormData(prev => ({...prev, end_time: e.target.value}))}
                   />
                 </div>
                </div>

                {/* Branding Selection */}
                <div>
                  <Label htmlFor="branding" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Marca/Branding del Evento *
                  </Label>
                  <Select 
                    value={formData.branding} 
                    onValueChange={(value: 'ucc' | 'hoodfights' | 'custom') => setFormData(prev => ({...prev, branding: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ucc">
                        <div className="flex items-center gap-2">
                          <span>UCC (Urban Combat Championship)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hoodfights">
                        <div className="flex items-center gap-2">
                          <span>Honduras Hoodfights</span>
                          <Badge variant="secondary" className="text-xs">Requiere imágenes</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.branding === 'hoodfights' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Este evento requerirá imágenes de cartelera sin fondo para cada peleador
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateEvent}>Crear Evento</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Eventos de Combate</CardTitle>
            <CardDescription>
              {events.length} eventos creados
            </CardDescription>
          </CardHeader>
         <CardContent>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Nombre</TableHead>
                 <TableHead>Disciplina</TableHead>
                 <TableHead>Estado</TableHead>
                 <TableHead>Visibilidad</TableHead>
                 <TableHead>Fecha</TableHead>
                 <TableHead>Sede</TableHead>
                 <TableHead>Acciones</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {events.map((event) => (
                 <TableRow key={event.id}>
                   <TableCell className="font-medium">
                     <div className="flex items-center gap-2">
                       <EventIcon className="h-5 w-5" />
                       {event.name}
                     </div>
                   </TableCell>
                   <TableCell>
                     <Badge variant="outline">{event.discipline}</Badge>
                   </TableCell>
                   <TableCell>
                     <Badge className={getStateColor(event.state)}>
                       {getStateText(event.state)}
                     </Badge>
                   </TableCell>
                   <TableCell>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleTogglePublish(event.id, event.published)}
                       className={event.published ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}
                     >
                       {event.published ? (
                         <>
                           <Eye className="h-4 w-4 mr-1" />
                           Público
                         </>
                       ) : (
                         <>
                           <EyeOff className="h-4 w-4 mr-1" />
                           Privado
                         </>
                       )}
                     </Button>
                   </TableCell>
                   <TableCell>
                     {event.start_time ? (
                       <div className="flex items-center gap-2 text-sm">
                         <Calendar className="w-4 h-4" />
                         {format(new Date(event.start_time), 'dd/MM/yyyy HH:mm', { locale: es })}
                       </div>
                     ) : (
                       <span className="text-muted-foreground">Sin fecha</span>
                     )}
                   </TableCell>
                   <TableCell>
                     {event.venue ? (
                       <div className="flex items-center gap-2 text-sm">
                         <MapPin className="w-4 h-4" />
                         {event.venue}
                       </div>
                     ) : (
                       <span className="text-muted-foreground">Sin sede</span>
                     )}
                   </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setBrandingEvent(event);
                            setShowBrandingModal(true);
                          }}
                          className="text-primary border-primary/30"
                        >
                          <Palette className="w-4 h-4 mr-1" />
                          Branding
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setEventFighters([]);
                            setShowFightersDialog(true);
                          }}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Peleadores
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            resetFightForm();
                            setShowFightsDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Peleas
                        </Button>
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm">
                             <Trash2 className="w-4 h-4 mr-1" />
                             Eliminar
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
                             <AlertDialogDescription>
                               Esta acción no se puede deshacer. Se eliminará permanentemente el evento "{event.name}" y todas las peleas asociadas.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                             <AlertDialogAction 
                               onClick={() => handleDeleteEvent(event.id)}
                               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                             >
                               Eliminar
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                       <Select value={event.state} onValueChange={(value) => updateEventState(event.id, value)}>
                         <SelectTrigger className="w-32">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="draft">Borrador</SelectItem>
                           <SelectItem value="live">En Vivo</SelectItem>
                           <SelectItem value="finished">Finalizado</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </CardContent>
       </Card>
 
       {/* Fighters Management Dialog */}
       <Dialog open={showFightersDialog} onOpenChange={setShowFightersDialog}>
         <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>Gestionar Peleadores - {selectedEvent?.name}</DialogTitle>
             <DialogDescription>
               Agrega peleadores que participarán en este evento
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4">
             {eventFightersData.length > 0 && (
               <div>
                 <h4 className="font-medium mb-2">Peleadores del Evento ({eventFightersData.length})</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                   {eventFightersData.map((fighter) => (
                     <div key={fighter?.id} className="flex items-center justify-between p-2 border rounded">
                       <div>
                         <span className="font-medium">{fighter?.first_name} {fighter?.last_name}</span>
                         {fighter?.nickname && <span className="text-sm text-muted-foreground"> "{fighter.nickname}"</span>}
                         <div className="text-xs text-muted-foreground">
                           {fighter?.weight_class} • {fighter?.record_wins}W-{fighter?.record_losses}L-{fighter?.record_draws}D
                         </div>
                       </div>
                       <Button 
                         variant="ghost" 
                         size="sm"
                         onClick={() => setEventFighters(prev => prev.filter(id => id !== fighter?.id))}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                   ))}
                 </div>
               </div>
             )}
 
             <div>
               <h4 className="font-medium mb-2">Peleadores Disponibles</h4>
               <div className="relative mb-3">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input
                   type="text"
                   placeholder="Buscar por nombre o apodo..."
                   value={fighterSearchTerm}
                   onChange={(e) => setFighterSearchTerm(e.target.value)}
                   className="pl-10"
                 />
               </div>
               <div className="max-h-64 overflow-y-auto space-y-2">
                 {availableFighters
                   .filter(f => !eventFighters.includes(f.id))
                   .filter(f => {
                     if (!fighterSearchTerm) return true;
                     const searchLower = fighterSearchTerm.toLowerCase();
                     const fullName = `${f.first_name} ${f.last_name}`.toLowerCase();
                     const nickname = f.nickname?.toLowerCase() || '';
                     return fullName.includes(searchLower) || nickname.includes(searchLower);
                   })
                   .map((fighter) => (
                   <div key={fighter.id} className="flex items-center justify-between p-2 border rounded">
                     <div>
                       <span className="font-medium">{fighter.first_name} {fighter.last_name}</span>
                       {fighter.nickname && <span className="text-sm text-muted-foreground"> "{fighter.nickname}"</span>}
                       <div className="text-xs text-muted-foreground">
                         {fighter.weight_class} • {fighter.record_wins}W-{fighter.record_losses}L-{fighter.record_draws}D
                       </div>
                     </div>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => handleAddFighterToEvent(fighter.id)}
                     >
                       <Plus className="w-4 h-4 mr-1" />
                       Agregar
                     </Button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
           
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowFightersDialog(false)}>
               Cerrar
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Simplified Fights Dialog */}
       <Dialog open={showFightsDialog} onOpenChange={setShowFightsDialog}>
         <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>
               {editingFight ? 'Editar Pelea' : 'Crear Pelea'} - {selectedEvent?.name}
             </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4">
             <div className="grid grid-cols-3 gap-4">
               <div>
                 <Label>Número de Pelea</Label>
                 <Input
                   type="number"
                   min="1"
                   value={fightData.fight_number}
                   onChange={(e) => setFightData(prev => ({...prev, fight_number: parseInt(e.target.value) || 1}))}
                 />
               </div>
               <div>
                 <Label>Tipo de Pelea</Label>
                 <Select value={fightData.fight_type} onValueChange={(value) => setFightData(prev => ({...prev, fight_type: value}))}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="AMATEUR">Amateur</SelectItem>
                     <SelectItem value="PROFESSIONAL">Profesional</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label>Número de Rounds</Label>
                 <Select 
                   value={fightData.number_of_rounds.toString()} 
                   onValueChange={(value) => setFightData(prev => ({...prev, number_of_rounds: parseInt(value)}))}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="1">1 Round</SelectItem>
                     <SelectItem value="2">2 Rounds</SelectItem>
                     <SelectItem value="3">3 Rounds</SelectItem>
                     <SelectItem value="5">5 Rounds</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
 
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <Label>Peleador A</Label>
                   <div className="flex items-center gap-2">
                     <Label htmlFor="fighter-a-registered" className="text-xs text-muted-foreground">
                       ¿Registrado?
                     </Label>
                     <Switch
                       id="fighter-a-registered"
                       checked={fighterAIsRegistered}
                       onCheckedChange={setFighterAIsRegistered}
                     />
                   </div>
                 </div>
                 
                 {fighterAIsRegistered ? (
                   <Select value={fightData.fighter_a_id} onValueChange={(value) => setFightData(prev => ({...prev, fighter_a_id: value}))}>
                     <SelectTrigger>
                       <SelectValue placeholder="Seleccionar peleador" />
                     </SelectTrigger>
                     <SelectContent>
                       {availableFighters.map((fighter) => (
                         <SelectItem key={fighter.id} value={fighter.id}>
                           {fighter.first_name} {fighter.last_name} {fighter.nickname && `"${fighter.nickname}"`}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 ) : (
                   <div className="border rounded-lg p-3 bg-muted/30">
                     <ExternalFighterForm
                       formData={externalFighterAData}
                       imageFile={imageFileA}
                       onFormChange={setExternalFighterAData}
                       onImageChange={setImageFileA}
                     />
                   </div>
                 )}
               </div>
               
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <Label>Peleador B</Label>
                   <div className="flex items-center gap-2">
                     <Label htmlFor="fighter-b-registered" className="text-xs text-muted-foreground">
                       ¿Registrado?
                     </Label>
                     <Switch
                       id="fighter-b-registered"
                       checked={fighterBIsRegistered}
                       onCheckedChange={setFighterBIsRegistered}
                     />
                   </div>
                 </div>
                 
                 {fighterBIsRegistered ? (
                   <Select value={fightData.fighter_b_id} onValueChange={(value) => setFightData(prev => ({...prev, fighter_b_id: value}))}>
                     <SelectTrigger>
                       <SelectValue placeholder="Seleccionar peleador" />
                     </SelectTrigger>
                     <SelectContent>
                       {availableFighters
                         .filter(f => f.id !== fightData.fighter_a_id)
                         .map((fighter) => (
                           <SelectItem key={fighter.id} value={fighter.id}>
                             {fighter.first_name} {fighter.last_name} {fighter.nickname && `"${fighter.nickname}"`}
                           </SelectItem>
                         ))
                       }
                     </SelectContent>
                   </Select>
                 ) : (
                   <div className="border rounded-lg p-3 bg-muted/30">
                     <ExternalFighterForm
                       formData={externalFighterBData}
                       imageFile={imageFileB}
                       onFormChange={setExternalFighterBData}
                       onImageChange={setImageFileB}
                     />
                   </div>
                 )}
               </div>
             </div>
 
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label>Categoría de Peso</Label>
                 <Select value={fightData.weight_class} onValueChange={(value) => setFightData(prev => ({...prev, weight_class: value}))}>
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
               <div>
                 <Label>Importancia</Label>
                 <Select value={fightData.card_position} onValueChange={(value: 'main_event' | 'co_main_event' | 'regular') => setFightData(prev => ({...prev, card_position: value}))}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="regular">Normal</SelectItem>
                     <SelectItem value="co_main_event">Co-Estelar</SelectItem>
                     <SelectItem value="main_event">Estelar ⭐</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
              </div>

              {/* Event Images Section - IMPROVED */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Imágenes de Cartelera
                  {selectedEvent?.meta && (selectedEvent.meta as any)?.branding?.require_billboard_images && (
                    <Badge variant="destructive" className="text-xs">Requeridas</Badge>
                  )}
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* FIGHTER A IMAGE */}
                  <div className="space-y-3 p-3 border rounded-lg bg-red-500/5">
                    <Label className="flex items-center gap-2 text-red-400">
                      Esquina Roja (Peleador A)
                    </Label>
                    
                    {/* Source selector */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={imageSourceA === 'upload' ? 'default' : 'outline'}
                        onClick={() => setImageSourceA('upload')}
                        className="flex-1 text-xs"
                      >
                        Subir imagen
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={imageSourceA === 'profile' ? 'default' : 'outline'}
                        onClick={() => setImageSourceA('profile')}
                        className="flex-1 text-xs"
                      >
                        Usar perfil
                      </Button>
                    </div>
                    
                    {imageSourceA === 'upload' ? (
                      <>
                        <input
                          id="event-image-a"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const error = validateEventImage(file, true);
                              if (error) {
                                toast({ description: error, variant: 'destructive' });
                                e.target.value = '';
                              } else {
                                setEventImageFileA(file);
                                setProcessedImageA(null);
                                setProcessedHashA(null);
                              }
                            }
                          }}
                          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        
                        {/* Preview with checkerboard for transparency */}
                        {(processedImageA || eventImageFileA) && (
                          <div 
                            className="relative h-24 rounded-lg overflow-hidden"
                            style={{
                              backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                              backgroundSize: '10px 10px',
                              backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                            }}
                          >
                            <img 
                              src={URL.createObjectURL(processedImageA || eventImageFileA!)} 
                              alt="Preview A"
                              className="h-full w-auto mx-auto object-contain"
                            />
                            {processedImageA && (
                              <Badge className="absolute top-1 right-1 bg-green-600 text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Procesado
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Process with AI button */}
                        {eventImageFileA && !processedImageA && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleProcessImageWithAI('A')}
                            disabled={processingA}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            {processingA ? 'Procesando...' : 'Procesar con IA (1 crédito)'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground p-2 bg-muted rounded">
                        ⚠️ Se usará la foto de perfil del peleador. Si tiene fondo oscuro, se verá el cuadro negro.
                      </p>
                    )}
                  </div>
                  
                  {/* FIGHTER B IMAGE */}
                  <div className="space-y-3 p-3 border rounded-lg bg-blue-500/5">
                    <Label className="flex items-center gap-2 text-blue-400">
                      Esquina Azul (Peleador B)
                    </Label>
                    
                    {/* Source selector */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={imageSourceB === 'upload' ? 'default' : 'outline'}
                        onClick={() => setImageSourceB('upload')}
                        className="flex-1 text-xs"
                      >
                        Subir imagen
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={imageSourceB === 'profile' ? 'default' : 'outline'}
                        onClick={() => setImageSourceB('profile')}
                        className="flex-1 text-xs"
                      >
                        Usar perfil
                      </Button>
                    </div>
                    
                    {imageSourceB === 'upload' ? (
                      <>
                        <input
                          id="event-image-b"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const error = validateEventImage(file, true);
                              if (error) {
                                toast({ description: error, variant: 'destructive' });
                                e.target.value = '';
                              } else {
                                setEventImageFileB(file);
                                setProcessedImageB(null);
                                setProcessedHashB(null);
                              }
                            }
                          }}
                          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        
                        {/* Preview with checkerboard for transparency */}
                        {(processedImageB || eventImageFileB) && (
                          <div 
                            className="relative h-24 rounded-lg overflow-hidden"
                            style={{
                              backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                              backgroundSize: '10px 10px',
                              backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                            }}
                          >
                            <img 
                              src={URL.createObjectURL(processedImageB || eventImageFileB!)} 
                              alt="Preview B"
                              className="h-full w-auto mx-auto object-contain"
                            />
                            {processedImageB && (
                              <Badge className="absolute top-1 right-1 bg-green-600 text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Procesado
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Process with AI button */}
                        {eventImageFileB && !processedImageB && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleProcessImageWithAI('B')}
                            disabled={processingB}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            {processingB ? 'Procesando...' : 'Procesar con IA (1 crédito)'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground p-2 bg-muted rounded">
                        ⚠️ Se usará la foto de perfil del peleador. Si tiene fondo oscuro, se verá el cuadro negro.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
           
           <DialogFooter>
             <Button variant="outline" onClick={() => {
               resetFightForm();
               setShowFightsDialog(false);
             }}>
               Cerrar
             </Button>
             {editingFight && (
               <Button variant="outline" onClick={resetFightForm}>
                 Cancelar Edición
               </Button>
             )}
             <Button onClick={handleSaveFight}>
               {editingFight ? 'Actualizar Pelea' : 'Crear Pelea'}
             </Button>
           </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Branding Modal */}
        <EventBrandingModal
          open={showBrandingModal}
          onOpenChange={setShowBrandingModal}
          event={brandingEvent}
          onSave={updateEventMeta}
        />
      </div>
    );
  }