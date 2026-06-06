# Récords del Time Master no se ven actualizados

## Diagnóstico

Verificación contra la base de datos del último combate (KO, 01:59:54Z):

- `tm_verdict` registró el veredicto con `records_updated = true`.
- `fighter_profiles` de ganador y perdedor tienen `updated_at` exacto al microsegundo del veredicto, con récords incrementados correctamente.

Conclusión: el backend funciona. El problema es de **frontend**: tras firmar, el `FighterSelector` sigue mostrando los récords cacheados en `fighterProfiles` (cargados una sola vez en `useEffect` al montar la página). El usuario interpreta esa cifra estática como "no se actualizó".

Además, al revisar `tm_verdict` aparecen **dos filas casi simultáneas** por cada pelea (una con `records_updated=false` y otra con `true`, separadas por menos de 1 ms en el último caso). La verificación de idempotencia del RPC `save_fight_result` corre antes de que la transacción concurrente haga commit, así que ambas pasan el chequeo. Riesgo: en una carrera real los récords podrían **incrementarse dos veces**.

## Cambios

### 1. Refrescar récords tras firmar (frontend)
`src/hooks/useTimeMaster.ts` — en `updateFighterRecords`, después de `saveResultAtomic` exitoso y no-duplicado, llamar a `loadFighters()` para que los récords nuevos aparezcan en el selector y en cualquier vista que use ese estado.

`src/pages/TimeMaster.tsx` — sin cambios funcionales necesarios, pero podemos mostrar el récord actualizado del ganador/perdedor en el toast de confirmación para feedback visible inmediato.

### 2. Blindar el RPC contra doble inserción (backend)
Nueva migración: agregar un **índice único parcial** en `tm_verdict` que impida dos veredictos del mismo juez sobre el mismo par de peleadores en el mismo día UTC:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tm_verdict_judge_pair_day
  ON public.tm_verdict (
    judge_user_id,
    red_fighter_id,
    blue_fighter_id,
    ((signed_at AT TIME ZONE 'UTC')::date)
  );
```

Y en `save_fight_result`, envolver el `INSERT INTO tm_verdict` y los `UPDATE fighter_profiles` en una sección que capture `unique_violation` y devuelva `duplicate=true` sin re-incrementar récords. Esto convierte la idempotencia en una garantía atómica de Postgres, no una verificación oportunista.

### 3. (Opcional pero recomendado) Limpieza de duplicados existentes
Borrar las filas duplicadas con `records_updated=false` que tengan una contraparte `true` del mismo juez/par/día, para que el historial quede limpio. Solo afecta `tm_verdict` (no toca récords ya aplicados).

## Verificación

1. Firmar una nueva pelea desde `/time-master`. Confirmar que el récord visible del peleador en el selector cambia inmediatamente sin recargar la página.
2. Consultar `tm_verdict` y comprobar que aparece **una sola fila** por pelea.
3. Forzar una doble llamada (doble tap rápido en "Confirmar"): el RPC debe devolver `duplicate=true` en la segunda llamada y los récords no deben incrementarse dos veces.

## Fuera de alcance

- Cambios visuales del Time Master más allá del refresh del selector.
- Rediseño del flujo de firmar/declarar resultado.
- Lógica de scoring por round.
