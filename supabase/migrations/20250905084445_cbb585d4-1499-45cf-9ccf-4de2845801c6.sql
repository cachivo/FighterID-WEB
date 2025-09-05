-- Eliminar la solicitud de Fighter ID para blackboxdjhn@gmail.com (Moises Cardenas)
-- Corregir orden de eliminación para manejar foreign key constraints

-- Primero, remover la referencia primary_license_id del perfil de peleador
UPDATE public.fighter_profiles 
SET primary_license_id = NULL
WHERE id = '8f1a0412-61b6-468e-811b-0e054bdbc3c6';

-- Ahora eliminar datos relacionados en orden correcto de dependencias

-- 1. Eliminar reservas de peleas
DELETE FROM public.fight_bookings 
WHERE license_id = '7b93ff3f-c5d7-4246-aaa4-504118dd8619';

-- 2. Eliminar certificaciones médicas (si existe la tabla)
-- DELETE FROM public.medical_certifications
-- WHERE license_id = '7b93ff3f-c5d7-4246-aaa4-504118dd8619';

-- 3. Eliminar documentos de licencia
DELETE FROM public.license_documents
WHERE license_id = '7b93ff3f-c5d7-4246-aaa4-504118dd8619';

-- 4. Eliminar tokens de verificación
DELETE FROM public.license_verification_tokens
WHERE license_id = '7b93ff3f-c5d7-4246-aaa4-504118dd8619';

-- 5. Eliminar licencias del peleador
DELETE FROM public.fighter_licenses 
WHERE fighter_id = '8f1a0412-61b6-468e-811b-0e054bdbc3c6';

-- 6. Eliminar actualizaciones de estado del peleador
DELETE FROM public.fighter_status_updates 
WHERE fighter_id = '8f1a0412-61b6-468e-811b-0e054bdbc3c6';

-- 7. Actualizar referencias en fights_history (mantener historial pero limpiar referencias)
UPDATE public.fights_history 
SET red_fighter_id = NULL 
WHERE red_fighter_id = '8f1a0412-61b6-468e-811b-0e054bdbc3c6';

UPDATE public.fights_history 
SET blue_fighter_id = NULL 
WHERE blue_fighter_id = '8f1a0412-61b6-468e-811b-0e054bdbc3c6';

-- 8. Actualizar referencias en fights (limpiar referencias)
UPDATE public.fights 
SET fighter_a_id = NULL, winner_id = NULL 
WHERE fighter_a_id = '8f1a0412-61b6-468e-811b-0e054bdbc3c6' OR winner_id = '8f1a0412-61b6-468e-811b-0e054bdbc3c6';

UPDATE public.fights 
SET fighter_b_id = NULL, winner_id = NULL 
WHERE fighter_b_id = '8f1a0412-61b6-468e-811b-0e054bdbc3c6' OR winner_id = '8f1a0412-61b6-468e-811b-0e054bdbc3c6';

-- 9. Finalmente eliminar el perfil de peleador
DELETE FROM public.fighter_profiles 
WHERE id = '8f1a0412-61b6-468e-811b-0e054bdbc3c6';