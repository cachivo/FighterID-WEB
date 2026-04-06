

# Exponer Avatares de Peleadores al Motor 3D Vision

## Problema

La vista `vision_fight_context` — que es la fuente de datos del motor 3D Vision local — no incluye `avatar_url`. El motor recibe nombres, récords y peso, pero no las fotos de perfil. El bucket `fighter-avatars` ya es público (SELECT abierto), así que las URLs son accesibles, pero el motor no sabe cuáles son.

## Solución

Agregar `avatar_url` a la vista `vision_fight_context` y al response del endpoint `/start`, para que el motor reciba las URLs de las fotos al iniciar una sesión.

## Cambios

### 1. Migración SQL — Actualizar `vision_fight_context`

Recrear la vista agregando dos columnas:

```sql
CREATE OR REPLACE VIEW public.vision_fight_context AS
SELECT 
  f.id AS fight_id, f.event_id, f.fight_number, f.status, f.weight_class,
  fp1.id AS fighter_a_id,
  COALESCE(NULLIF(fp1.name,''), CONCAT_WS(' ',fp1.first_name,fp1.last_name)) AS fighter_a_name,
  fp1.nickname AS fighter_a_nickname,
  fp1.weight_class AS fighter_a_weight,
  fp1.avatar_url AS fighter_a_avatar,     -- NUEVO
  fp1.record_wins AS fighter_a_wins,
  fp1.record_losses AS fighter_a_losses,
  fp1.record_draws AS fighter_a_draws,
  fp2.id AS fighter_b_id,
  COALESCE(NULLIF(fp2.name,''), CONCAT_WS(' ',fp2.first_name,fp2.last_name)) AS fighter_b_name,
  fp2.nickname AS fighter_b_nickname,
  fp2.weight_class AS fighter_b_weight,
  fp2.avatar_url AS fighter_b_avatar,     -- NUEVO
  fp2.record_wins AS fighter_b_wins,
  fp2.record_losses AS fighter_b_losses,
  fp2.record_draws AS fighter_b_draws,
  e.name AS event_name,
  e.start_time AS event_date,
  e.venue AS event_venue
FROM fights f
LEFT JOIN fighter_profiles fp1 ON f.fighter_a_id = fp1.id
LEFT JOIN fighter_profiles fp2 ON f.fighter_b_id = fp2.id
LEFT JOIN bdg_event e ON f.event_id = e.id;
```

La vista dependiente `fights_hud` no se rompe porque no referencia las columnas nuevas.

### 2. `supabase/functions/ai-strike-ingest/index.ts`

En el response del endpoint `/start` (línea ~170), agregar `avatar_url` a cada fighter:

```typescript
fighters: {
  red: {
    id: ctx.fighter_a_id,
    name: ctx.fighter_a_name,
    nickname: ctx.fighter_a_nickname,
    record: formatRecord(...),
    weight_class: ctx.fighter_a_weight,
    avatar_url: ctx.fighter_a_avatar || null,   // NUEVO
  },
  blue: {
    id: ctx.fighter_b_id,
    name: ctx.fighter_b_name,
    nickname: ctx.fighter_b_nickname,
    record: formatRecord(...),
    weight_class: ctx.fighter_b_weight,
    avatar_url: ctx.fighter_b_avatar || null,   // NUEVO
  },
},
```

## Seguridad

- El bucket `fighter-avatars` ya tiene política pública de SELECT — las URLs son accesibles sin autenticación.
- El motor 3D Vision solo recibe URLs públicas, no acceso directo al bucket ni a otras carpetas de storage.
- No se exponen datos sensibles adicionales.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Agregar `fighter_a_avatar` y `fighter_b_avatar` a `vision_fight_context` |
| `supabase/functions/ai-strike-ingest/index.ts` | Incluir `avatar_url` en el response de `/start` |

