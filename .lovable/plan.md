

# Plan: Mejorar UI del Hero - Separar Información de Evento y Estadísticas

## Problema Actual

```text
┌─────────────────────────────────────────────────────────────────┐
│                      DISEÑO ACTUAL (Confuso)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   🔴 EN VIVO: UCC 83 - BREAK    ⚡ 127 Peleadores              │
│                                                                 │
│   ┌──────────────┐  ┌────────────────────┐                     │
│   │ Ver Feed     │  │ Explorar Peleadores │                    │
│   └──────────────┘  └────────────────────┘                     │
│                                                                 │
│   Problema: Usuario puede pensar que 127 son los               │
│   peleadores del evento UCC 83                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Propuesta de Solución

Reemplazar el contador de peleadores con información adicional del evento:

```text
┌─────────────────────────────────────────────────────────────────┐
│                      DISEÑO PROPUESTO                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   🔴 EN VIVO: UCC 83 - BREAK    🥊 MMA                         │
│                                                                 │
│   ┌──────────────┐  ┌────────────────────┐                     │
│   │ Ver Feed     │  │ Explorar Peleadores │                    │
│   └──────────────┘  └────────────────────┘                     │
│                                                                 │
│   Nuevo: Muestra la disciplina del evento en lugar             │
│   del total de peleadores de la plataforma                     │
└─────────────────────────────────────────────────────────────────┘
```

### Variantes según el Estado del Evento

| Estado | Información Mostrada |
|--------|---------------------|
| **Evento EN VIVO** | `🔴 EN VIVO: [NOMBRE] - [VENUE]` + `🥊 [DISCIPLINA]` |
| **Próximo Evento** | `📅 [NOMBRE] - [FECHA]` + `📍 [VENUE]` (si existe) |
| **Sin Eventos** | `PRÓXIMOS EVENTOS PRONTO` (sin badge adicional) |

---

## Cambios a Implementar

### Archivo: `src/components/Hero.tsx`

**Ubicación**: Líneas 106-110

**Antes (actual)**:
```tsx
{/* Dynamic fighter count */}
<div className="flex items-center gap-1.5 text-[10px] sm:text-xs bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
  <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  <span>{stats?.totalFighters || 0} Peleadores</span>
</div>
```

**Después (propuesto)**:
```tsx
{/* Event additional info - discipline or venue */}
{stats?.liveEvents?.[0]?.discipline && (
  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
    <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
    <span>{stats.liveEvents[0].discipline.toUpperCase()}</span>
  </div>
)}
{!stats?.liveEvents?.length && stats?.nextEvent?.venue && (
  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
    <span>{stats.nextEvent.venue.toUpperCase()}</span>
  </div>
)}
```

---

## Sección Técnica

### Datos Disponibles del Evento

Del hook `useRealTimeStats`, tenemos acceso a:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `liveEvents[0].name` | string | Nombre del evento |
| `liveEvents[0].venue` | string | Lugar del evento |
| `liveEvents[0].discipline` | string | MMA, Boxing, etc. |
| `nextEvent.start_time` | timestamp | Fecha/hora del próximo |
| `nextEvent.venue` | string | Lugar del próximo evento |

### Nuevo Import Necesario

```tsx
import { Calendar, Zap, Shield, Trophy, MapPin } from 'lucide-react';
```

### Lógica Condicional

```text
SI hay evento en vivo:
  → Mostrar: "EN VIVO: [nombre] - [venue]" + badge con disciplina

SI NO hay evento en vivo PERO hay próximo evento:
  → Mostrar: "[nombre] - [fecha]" + badge con venue (si existe)

SI NO hay ningún evento:
  → Mostrar: "PRÓXIMOS EVENTOS PRONTO" (sin badge adicional)
```

---

## Resultado Visual Esperado

### Evento EN VIVO
```
🔴 EN VIVO: UCC 83 - BREAK    🏆 MMA
```

### Próximo Evento
```
📅 BATALLA DE GUERREROS - 15 FEB    📍 ARENA NACIONAL
```

### Sin Eventos
```
PRÓXIMOS EVENTOS PRONTO
```

