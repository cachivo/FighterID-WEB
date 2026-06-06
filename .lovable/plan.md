# Historial de récord en el perfil del peleador

Objetivo: que en el perfil de cada peleador se vea un historial cronológico de cada vez que su récord cambió, con fecha/hora, juez firmante y su correo, para garantizar trazabilidad.

## Fuente de datos

Ya existe `public.tm_verdict` con todo lo necesario:
`signed_at`, `judge_user_id`, `red_fighter_id`, `blue_fighter_id`, `winner_fighter_id`, `result_type`, `round_number`, `records_updated`.

El correo del juez vive en `auth.users.email`. Para no exponer toda esa tabla, se accede vía vista + RPC.

## Cambios

### 1. Vista `fighter_record_history` (migración)
Vista (`security_invoker=on`) que, para un peleador dado, devuelve:
- `signed_at` (fecha/hora del veredicto)
- `result_type` (ko, tko, decision_*, draw, dq, no_contest)
- `outcome_for_fighter` calculado: `win` | `loss` | `draw` | `no_contest` según si es ganador, perdedor o empate
- `round_number`, `round_config`
- `opponent_id`, `opponent_name` (join a `fighter_profiles`)
- `judge_user_id`, `judge_email` (join a `auth.users`)
- `verdict_id`
Filtra `records_updated = true` (solo veredictos que sí movieron el récord).

### 2. RPC `get_fighter_record_history(p_fighter_id uuid)`
SECURITY DEFINER, devuelve filas de la vista para un peleador. Permite controlar acceso sin abrir `auth.users` al cliente.
- Cualquier usuario autenticado puede consultar el historial de cualquier peleador (es el caso de transparencia que pediste).
- Si prefieres restringirlo a admin/dueño del perfil, lo indicamos y ajustamos.

### 3. Componente `FighterRecordHistory.tsx`
Tabla/lista cronológica (más reciente primero) con:
- Fecha + hora local
- Resultado para este peleador (Victoria / Derrota / Empate / No Contest) con badge de color
- Tipo de finalización (KO, TKO, Decisión, etc.) y round
- Oponente (enlace al perfil del oponente)
- Juez: nombre/correo + ícono `ShieldCheck`
- Tooltip con `verdict_id` para auditoría

Estados: loading skeleton, vacío ("Sin cambios registrados"), error.

### 4. Integración en `FighterProfile.tsx`
Nueva sección "Historial de récord" debajo del bloque de récord, colapsable. En la versión móvil va en pestaña dedicada si ya hay tabs; si no, como `Card` plegable.

## Verificación

1. Después de firmar una pelea en Time Master, abrir el perfil del peleador y confirmar que aparece la nueva entrada con la fecha exacta y el correo del juez.
2. Confirmar que entradas viejas con `records_updated=false` (firmadas sin actualizar récord) NO aparecen.
3. Probar con peleador sin peleas: muestra estado vacío.
4. Probar como usuario no autenticado: el RPC niega acceso (si decidimos restringirlo) o devuelve los datos sin el correo (si abrimos transparencia parcial).

## Pregunta abierta

¿El correo del juez debe ser visible para **todo el público** del perfil (transparencia total) o solo para **admins y el propio peleador**? El default propuesto en esta plan es: visible para cualquier usuario autenticado. Si quieres más restrictivo, lo cambiamos antes de implementar.

## Fuera de alcance

- Cambios manuales de récord hechos por admin (no pasan por `tm_verdict`). Si los necesitas auditables, sería otra tabla `fighter_record_audit` con trigger sobre `fighter_profiles`.
- Edición/borrado de veredictos.
- Notificaciones al peleador cuando cambia su récord.
