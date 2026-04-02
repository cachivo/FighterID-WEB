

# Auditoría del Sistema de Disciplinas — Hallazgos y Mejoras

## Estado Actual

El sistema separa MMA y Boxeo en paneles independientes (`/admin/mma/*`, `/admin/boxeo/*`) con `DisciplineContext`. Las 4 páginas principales (FightersProfiles, EventosPelea, GimnasiosAdmin, RankingsManagement) usan `useDisciplineContext()` para filtrar datos. El acceso se valida en `AdminDisciplineLayout`.

## Problemas Encontrados

### 1. Páginas sin filtrado por disciplina (CRÍTICO)

Estas páginas están dentro del panel de disciplina pero **no filtran por contexto**:

| Página | Problema |
|--------|----------|
| **FightApproval** | Muestra solicitudes de pelea de TODAS las disciplinas. Debería filtrar por `discipline` del contexto. |
| **Sanctions** | Muestra sanciones de todos los peleadores sin filtrar. Debería mostrar solo sanciones relacionadas a fighters/eventos de la disciplina activa. |
| **Betting** | Carga eventos de todas las disciplinas. Debería filtrar `bdg_event` por disciplina. |
| **DisciplineDashboard** | Usa el contexto pero `useRealTimeStats()` no filtra por disciplina — muestra stats globales en ambos paneles. |
| **OrganizationsManagement** | Muestra todas las organizaciones sin filtrar por disciplina del panel. |
| **ValidacionLicencias** | Lista licencias de todas las disciplinas. |
| **EntrenadoresAdmin** | Filtra por `useUserDisciplineAccess` pero NO por el contexto de disciplina del panel activo. |

### 2. Uso inconsistente del contexto

- Todas las páginas usan `useDisciplineContext()` (nullable) en vez de `useDiscipline()` (throws si no hay contexto). Dentro del panel de disciplina, el contexto **siempre existe**, por lo que deberían usar `useDiscipline()` directamente y eliminar los fallbacks `?? 'MMA'`.

### 3. Sidebar duplica URLs

- En `boxeoItems`, hay dos entradas para rankings con la **misma URL** `rankings`:
  ```
  { title: 'Rankings HHF Amateur', url: 'rankings', icon: Medal },
  { title: 'Rankings FEDEHBOX', url: 'rankings', icon: Trophy },
  ```
  Ambas van a la misma página. Debería ser una sola entrada o URLs distintas.

### 4. Filtrado client-side ineficiente

- FightersProfiles, EventosPelea y GimnasiosAdmin cargan **todos** los registros y filtran en el cliente con `useMemo`. Para datos que crecen, esto es ineficiente. Los hooks deberían aceptar `discipline` como parámetro de query.

### 5. `useRealTimeStats` no es discipline-aware

El dashboard de disciplina muestra exactamente las mismas estadísticas en MMA y Boxeo porque el hook no recibe filtro de disciplina.

## Plan de Mejoras

### Fase 1 — Completar filtrado (prioridad alta)

1. **FightApproval**: Importar `useDiscipline()`, filtrar `fightRequests` por `discipline`.
2. **Sanctions**: Agregar join con fighter_profiles para filtrar por disciplina, o agregar campo `discipline` a la tabla de sanciones.
3. **Betting**: Filtrar eventos por `discipline` del contexto.
4. **OrganizationsManagement**: Filtrar organizaciones por `discipline` del contexto.
5. **ValidacionLicencias**: Filtrar licencias por `discipline`.
6. **EntrenadoresAdmin**: Reemplazar filtrado por `useUserDisciplineAccess` con `useDiscipline()` del contexto.
7. **DisciplineDashboard**: Modificar `useRealTimeStats` para aceptar parámetro `discipline` y filtrar las queries.

### Fase 2 — Consistencia del código

8. **Migrar `useDisciplineContext()` → `useDiscipline()`** en las 5 páginas que ya lo usan. Eliminar nullchecks innecesarios y fallbacks `?? 'MMA'`.

### Fase 3 — Optimización

9. **Mover filtrado al servidor**: Modificar `useAdminFighters`, `useEvents`, `useGyms` para aceptar `discipline` como parámetro y agregar `.eq('discipline', discipline)` a las queries de Supabase.

### Fase 4 — Sidebar fix

10. **Deduplicar rankings en sidebar de Boxeo**: Combinar en una sola entrada "Rankings Boxeo" o crear sub-rutas distintas por organización.

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/FightApproval.tsx` | Agregar filtrado por disciplina |
| `src/pages/admin/Sanctions.tsx` | Agregar filtrado por disciplina |
| `src/pages/admin/Betting.tsx` | Filtrar eventos por disciplina |
| `src/pages/admin/OrganizationsManagement.tsx` | Filtrar orgs por disciplina |
| `src/pages/admin/ValidacionLicencias.tsx` | Filtrar licencias por disciplina |
| `src/pages/admin/EntrenadoresAdmin.tsx` | Usar contexto de disciplina |
| `src/pages/admin/DisciplineDashboard.tsx` | Pasar discipline a stats hook |
| `src/hooks/useRealTimeStats.tsx` | Agregar param discipline |
| `src/pages/admin/FightersProfiles.tsx` | `useDisciplineContext` → `useDiscipline` |
| `src/pages/admin/EventosPelea.tsx` | Idem |
| `src/pages/admin/GimnasiosAdmin.tsx` | Idem |
| `src/pages/admin/RankingsManagement.tsx` | Idem |
| `src/components/AdminDisciplineSidebar.tsx` | Deduplicar rankings boxeo |

