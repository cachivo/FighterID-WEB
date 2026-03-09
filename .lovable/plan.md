

# Plan: Optimización Mobile del Panel de Administración

## Problema Principal

El módulo **Eventos de Pelea** (`EventosPelea.tsx`) usa una tabla HTML de 7 columnas (Nombre, Disciplina, Estado, Visibilidad, Fecha, Sede, Acciones) que desborda horizontalmente en móvil, creando la barra de scroll que reportas. La columna de "Acciones" sola tiene 4 botones + 1 Select, ocupando ~400px.

Este mismo problema existe en **7 páginas admin más** que usan `<Table>`:

| Página | Columnas | Severidad |
|--------|----------|-----------|
| **EventosPelea.tsx** | 7 cols + Acciones con 5 elementos | ALTA |
| **Betting.tsx** | Tabla de mercados con múltiples cols | ALTA |
| **Comunidad.tsx** | 2 tablas (testimonios + partners) | MEDIA |
| **AliadosEstrategicos.tsx** | Tabla de aliados | MEDIA |
| **OrganizationsManagement.tsx** | Tabla de organizaciones | MEDIA |
| **RankingsManagement.tsx** | Ya tiene `overflow-x-auto` | BAJA (ya parcheado) |
| **Configuracion.tsx** | Tabla de configuración | BAJA |
| **EmailCampaignDetail.tsx** | Tabla de destinatarios | BAJA |

## Solución

### 1. `EventosPelea.tsx` - Reemplazar tabla por tarjetas en móvil (PRIORIDAD)

Reemplazar la `<Table>` de eventos (líneas 1133-1281) por un layout de tarjetas (`Card`) que funcione en móvil:

```text
┌──────────────────────────────┐
│ 🏆 Batalla de Gimnasios #2   │
│ MMA · Borrador · Privado     │
│ 📅 15/03/2026 · 📍 Arena     │
│ ┌────┐┌────┐┌────┐┌────┐    │
│ │Brand││Pelead││Peleas││ ⋮ │    │
│ └────┘└────┘└────┘└────┘    │
│ Estado: [Borrador ▾]         │
└──────────────────────────────┘
```

- Cada evento será un `Card` con la info apilada verticalmente
- Botones de acción en una fila con `flex-wrap`
- Select de estado en su propia fila

### 2. Páginas con tablas secundarias - Agregar `overflow-x-auto`

Para las demás páginas que usan `<Table>`, envolver en `<div className="overflow-x-auto -mx-4 px-4">` para permitir scroll horizontal controlado sin romper el layout del contenedor padre:

- `Betting.tsx`
- `Comunidad.tsx` (2 tablas)
- `AliadosEstrategicos.tsx`
- `OrganizationsManagement.tsx`
- `Configuracion.tsx`
- `EmailCampaignDetail.tsx`

### 3. Headers responsivos

Varias páginas tienen headers con `flex justify-between` que se rompen en móvil cuando el título y el botón no caben en una línea:

- `EventosPelea.tsx` líneas 990-996: título + botón "Nuevo Evento"
- `FightersProfiles.tsx` líneas 158-169: título + botón "Invitar Peleador"

Cambiar a `flex flex-wrap gap-3` para que el botón baje en pantallas pequeñas.

### 4. Dialogs de pelea - Grids de 3 y 2 columnas

Los diálogos internos de `EventosPelea.tsx` usan:
- `grid-cols-3` (línea 1472) para Número/Tipo/Rounds
- `grid-cols-2` (líneas 1513, 1598, 1639) para Peleadores A/B e imágenes

En móvil estos se comprimen. Cambiar a `grid-cols-1 md:grid-cols-3` y `grid-cols-1 md:grid-cols-2`.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/EventosPelea.tsx` | Reemplazar tabla por cards, headers responsive, grids responsive en dialogs |
| `src/pages/admin/Betting.tsx` | Wrap tabla con `overflow-x-auto` |
| `src/pages/admin/Comunidad.tsx` | Wrap 2 tablas con `overflow-x-auto` |
| `src/pages/admin/AliadosEstrategicos.tsx` | Wrap tabla con `overflow-x-auto` |
| `src/pages/admin/OrganizationsManagement.tsx` | Wrap tabla con `overflow-x-auto` |
| `src/pages/admin/Configuracion.tsx` | Wrap tabla con `overflow-x-auto` |
| `src/pages/admin/EmailCampaignDetail.tsx` | Wrap tabla con `overflow-x-auto` |
| `src/pages/admin/FightersProfiles.tsx` | Header responsive con `flex-wrap` |

**8 archivos. Sin migraciones SQL.**

