
## 1. Cerrar sesión en el header (desktop + mobile)

**`src/components/landing/LandingHeader.tsx`**
- Reemplazar el botón "Mi cuenta" (desktop) por un `DropdownMenu` (shadcn) cuando hay `user`:
  - Trigger: "Mi cuenta" con chevron
  - Items: "Ir a mi cuenta" → `/dashboard`, "Mi perfil" → `/profile/hub`, separador, "Cerrar sesión" → `signOut()` + `navigate('/')`
- En el Sheet móvil agregar, debajo del botón "Mi cuenta", un botón secundario "Cerrar sesión" (visible solo si `user`) con `signOut()`.
- Usar `signOut` desde `useAuth()` (ya existe).

## 2. Protagonismo de ARENA

**Nav highlight (`LandingHeader.tsx`)**
- Mantener Time Master accesible pero degradado a item normal.
- Nuevo item destacado en `NAV`: `{ label: 'ARENA Live', href: '/arena', highlight: true }` con ícono `Radio` (lucide) en crimson; tanto desktop como Sheet móvil.
- El botón móvil crimson dedicado actual (Timer) pasa a apuntar a `/arena` con ícono `Radio`. Time Master sigue accesible vía el menú móvil.

**Bloque hero secundario en `src/pages/Index.tsx`**
- Nuevo componente `src/components/landing/ArenaSpotlight.tsx`:
  - Inserción inmediatamente después de `<MemoHero />` y antes del CTA/QuickStats.
  - Layout editorial: bloque a ancho `max-w-[1200px]`, fondo `#111111`, borde hairline, sin sombras.
  - Contenido: kicker mono "Centro de competencia en vivo", título display "ARENA", subtítulo corto, dos CTA (crimson "Entrar a ARENA" → `/arena`, ghost "Ver eventos SPARC" → `/sparc`). Indicador "● EN VIVO" si hay un `sparc_events.state = 'live'` (consulta opcional, ligera, dentro de un `useQuery` con `staleTime` alto). Si no hay live, mostrar próximo evento o copy estático.
  - Mobile-first (grid-cols-1, CTA full-width).

## 3. Rankings: SPARC primero

**`src/pages/Index.tsx`**
- Reordenar `SectionPanel`s dentro del bloque `#rankings`:
  1. **SPARC Rankings** (nuevo, eager) — `SectionPanel title="Rankings SPARC" subtitle="Sparring Performance Assessment & Ranking Circuit"`. Contenido: componente compacto extraído de `SparcRankings`.
  2. MMA UCC (sigue eager — única ranking eager según memoria "Landing Low-End Mobile" — se reemplaza por SPARC; UCC pasa a `LazyMount`).
  3. Boxeo (FEDEHBOX + HHF amateur) dentro de `LazyMount` (sin cambios).
- **Crear `src/components/sections/SparcRanking.tsx`** (componente reutilizable, compact mode):
  - Props: `discipline?: 'MMA'|'BOXING'` (default 'MMA'), `compact?: boolean`, `limit?: number` (default 5 en compact).
  - Query directa a `sparc_rankings` ordenada por `points desc`. Join opcional con `fighter_profiles` para nombre/avatar (vía vista si existe, si no consulta separada por IDs).
  - Refactorizar `src/pages/sparc/SparcRankings.tsx` para consumirlo en modo no-compact.
- Respeta regla "solo 1 ranking eager" → SPARC ocupa ese slot.

## 4. Workflow check (auditoría — entregable: reporte en chat + fixes solo si triviales)

### A. Onboarding multi-módulo
Verificar end-to-end:
- `ensureAppUser` se invoca correctamente en `LicenseOnboarding`, `GymOnboarding`, `TrainerOnboarding`, `JudgeOnboarding` sin sobreescribir `first_name/last_name/phone`.
- `useUserModules` devuelve estado correcto cuando un mismo email tiene `fighter_profile` + `gym_staff` + `judges`.
- `user_roles` se agrega aditivamente (no DELETE de otros roles).
- `ProfileHub` muestra las 4 tarjetas independientes y enruta bien.
- `PostAuthRouter` no fuerza un módulo único.
- `useJudges.createJudge` y `useOfficials.createOfficial` enlazan `user_id = app_user.id` por email match.

Para cada hallazgo: nota corta + recomendación. Fixes mínimos in-PR solo si son triviales (≤5 líneas); riesgos mayores se reportan como tareas separadas.

### B. SPARC/ARENA → Ranking
Trazar:
- `sparc_events` creado → `SparcLiveFight` → registro de votos/rondas → trigger `trg_fight_result_inserted` → puntos en `sparc_rankings` (fighters/gyms/coaches).
- Recuperación de sesión (`recoverSession` en `SparcHub`) y `useSparcRecoveryWorker`.
- Idempotencia del cálculo de puntos (memoria "Automated Fight Lifecycle").
- Whitelist `EVENT_TYPES` cubre los eventos emitidos durante un fight (verificar que no se intenten loggear tipos no listados).

Entregable: tabla "paso → archivo:línea → status (OK / ⚠️ / ❌) → nota".

## Out of scope
- Sin migraciones DB.
- Sin redesign de `SparcRankings.tsx` más allá de extraer el componente compacto.
- Sin cambios en RLS, edge functions o flujos de auth fuera de exponer `signOut` en el header.

## Archivos tocados
- `src/components/landing/LandingHeader.tsx` (logout dropdown + ARENA nav)
- `src/components/landing/ArenaSpotlight.tsx` (nuevo)
- `src/components/sections/SparcRanking.tsx` (nuevo, compact)
- `src/pages/Index.tsx` (insertar ArenaSpotlight + reordenar rankings)
- `src/pages/sparc/SparcRankings.tsx` (consumir nuevo componente)
- Auditoría: solo lectura + reporte; fixes triviales si aparecen.
