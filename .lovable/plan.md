
# Plan: Administracion de Rankings por Disciplina y Optimizacion Movil

## Resumen Ejecutivo

Este plan aborda tres areas criticas:
1. Crear paginas de administracion para rankings separados por disciplina
2. Resolver problemas de rendimiento en dispositivos moviles de gama baja
3. Corregir inconsistencias en la creacion de perfiles (paises con codigos vs nombres completos)

---

## Estructura de Rankings Propuesta

```text
┌────────────────────────────────────────────────────────────────────┐
│                    ADMINISTRACION DE RANKINGS                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────┐    ┌─────────────────────┐              │
│  │    MMA - UCC HN     │    │       BOXEO         │              │
│  ├─────────────────────┤    ├─────────────────────┤              │
│  │ • Ver peleadores    │    │ PRO: BDG Pro Boxing │              │
│  │ • Asignar ranking   │    │ • Ver peleadores    │              │
│  │ • Ajustar posicion  │    │ • Asignar ranking   │              │
│  │ • Filtrar por nivel │    │                     │              │
│  └─────────────────────┘    │ AMATEUR: HHF        │              │
│                             │ • Ver peleadores    │              │
│                             │ • Ranking separado  │              │
│                             └─────────────────────┘              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Pagina de Administracion de Rankings

### 1.1 Crear nueva pagina `/admin/rankings`

**Archivo:** `src/pages/admin/RankingsManagement.tsx`

Funcionalidades:
- Tabs para cambiar entre disciplinas (MMA / Boxeo)
- Sub-tabs para ligas (UCC, BDG Pro, HHF Amateur)
- Tabla de peleadores ordenados por puntos
- Acciones:
  - Asignar peleador a ranking
  - Remover de ranking
  - Ajustar puntos manualmente (con auditoria)
  - Filtrar por nivel (Amateur/Pro)
  - Filtrar por categoria de peso

### 1.2 Agregar entrada en sidebar

**Archivo:** `src/components/AdminSidebar.tsx`

```typescript
// Agregar en adminItems
{ 
  title: 'Gestión de Rankings', 
  url: '/admin/rankings', 
  icon: Trophy 
},
```

### 1.3 Agregar ruta en App.tsx

```typescript
<Route path="/admin/rankings" element={<RankingsManagement />} />
```

---

## Fase 2: Optimizacion de Rendimiento Movil

### 2.1 Crear componente ErrorBoundary

**Archivo:** `src/components/ErrorBoundary.tsx`

Problema actual: No existe manejo de errores a nivel de componente. Cuando una seccion falla, toda la pagina crashea.

```typescript
// ErrorBoundary con UI amigable
- Captura errores de renderizado
- Muestra mensaje de error amigable
- Boton para reintentar
- Log de errores para debugging
```

### 2.2 Paginacion en Admin FightersProfiles

**Archivo:** `src/pages/admin/FightersProfiles.tsx`

Problemas actuales:
- Carga TODOS los peleadores (57+) de una vez
- Sin virtualizacion ni paginacion
- Causa crashes en dispositivos de gama baja

Solucion:
```typescript
// Agregar paginacion del lado del cliente
const [page, setPage] = useState(1);
const PAGE_SIZE = 20;

// Paginacion de resultados
const paginatedFighters = filteredFighters.slice(
  (page - 1) * PAGE_SIZE, 
  page * PAGE_SIZE
);
```

### 2.3 Lazy Loading de componentes admin

**Archivo:** `src/App.tsx`

Agregar lazy loading para paginas admin pesadas:
```typescript
const FightersProfiles = lazy(() => import('./pages/admin/FightersProfiles'));
const RankingsManagement = lazy(() => import('./pages/admin/RankingsManagement'));
const PendingChangesHub = lazy(() => import('./pages/admin/PendingChangesHub'));
```

### 2.4 Optimizar carga de imagenes

**Archivo:** `src/pages/admin/FightersProfiles.tsx`

- Usar `loading="lazy"` nativo en imagenes
- Reducir tamano de grid a 10 items max antes de paginar
- Agregar skeleton mas ligero

---

## Fase 3: Correccion de Perfiles (Paises)

### 3.1 Archivos que usan 'HN' en lugar de 'Honduras'

| Archivo | Linea | Problema |
|---------|-------|----------|
| `LicenseOnboarding.tsx` | 30 | `country: 'HN'` |
| `AdminFighterForm.tsx` | 40 | `country: 'HN'` |
| `EventosPelea.tsx` | 96, 104 | `country: 'HN'` |
| `ProfileSetup.tsx` | 38 | `country: 'HN'` |

### 3.2 Correccion en cada archivo

**LicenseOnboarding.tsx:**
```typescript
// ANTES
country: 'HN',

// DESPUES
country: 'Honduras',
```

**AdminFighterForm.tsx:**
```typescript
// ANTES
country: 'HN',

// DESPUES  
import { COUNTRIES } from '@/lib/constants/disciplines';
// ...
country: 'Honduras',

// Cambiar Input por Select
<Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar pais" />
  </SelectTrigger>
  <SelectContent>
    {COUNTRIES.map((c) => (
      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

## Fase 4: Clasificacion Rapida de Peleadores

### 4.1 Agregar filtro por disciplina en admin

**Archivo:** `src/pages/admin/FightersProfiles.tsx`

```typescript
// Agregar estado
const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');

// Agregar filtro
<Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
  <SelectTrigger className="w-full md:w-40">
    <SelectValue placeholder="Disciplina" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Todas</SelectItem>
    <SelectItem value="MMA">MMA</SelectItem>
    <SelectItem value="Boxeo">Boxeo</SelectItem>
  </SelectContent>
</Select>

// Aplicar en filteredFighters
const matchesDiscipline = selectedDiscipline === 'all' || fighter.discipline === selectedDiscipline;
```

### 4.2 Acciones masivas para asignar ranking

- Checkbox de seleccion multiple
- Boton "Asignar a Ranking"
- Modal para seleccionar ranking destino

---

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/admin/RankingsManagement.tsx` | Pagina principal de gestion de rankings |
| `src/components/ErrorBoundary.tsx` | Componente para manejo graceful de errores |
| `src/components/admin/RankingTable.tsx` | Tabla de peleadores por ranking |
| `src/components/admin/FighterRankingCard.tsx` | Tarjeta compacta para listas de ranking |

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/AdminSidebar.tsx` | Agregar enlace a Rankings |
| `src/App.tsx` | Agregar ruta /admin/rankings, lazy loading |
| `src/pages/admin/FightersProfiles.tsx` | Paginacion, filtro disciplina, ErrorBoundary |
| `src/pages/license/LicenseOnboarding.tsx` | Cambiar 'HN' a 'Honduras' |
| `src/components/admin/AdminFighterForm.tsx` | Usar COUNTRIES, Select en lugar de Input |
| `src/pages/admin/EventosPelea.tsx` | Cambiar default 'HN' a 'Honduras' |
| `src/pages/profile/ProfileSetup.tsx` | Cambiar 'HN' a 'Honduras' |

---

## Seccion Tecnica: Optimizacion de Memoria

### Problema: Crashes en dispositivos de gama baja

**Causa raiz:**
1. Carga de todos los perfiles sin paginacion
2. Renderizado simultaneo de 50+ imagenes
3. No hay ErrorBoundary para atrapar errores
4. Re-renders innecesarios por falta de memoizacion

**Solucion tecnica:**

```typescript
// 1. Virtualizacion con react-window (opcional para fase 2)
// 2. Paginacion del lado del cliente
// 3. useMemo para filtros costosos
// 4. Skeleton loading mas ligero

const paginatedFighters = useMemo(() => {
  return filteredFighters.slice(
    (page - 1) * PAGE_SIZE, 
    page * PAGE_SIZE
  );
}, [filteredFighters, page]);
```

### ErrorBoundary Implementation

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3>Algo salio mal</h3>
          <Button onClick={() => window.location.reload()}>
            Recargar pagina
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}
```

---

## Metricas de Exito

| Metrica | Antes | Despues |
|---------|-------|---------|
| Tiempo de carga admin/fighters | ~3s (57 items) | <1s (20 items) |
| Crashes en movil | Reportados | Manejados gracefully |
| Paises con codigo 'HN' | 4 archivos | 0 archivos |
| Paginas admin con lazy loading | 7 | 15+ |
| Filtros de disciplina | No existe | MMA/Boxeo |

---

## Orden de Implementacion

1. **Fase 2.1**: ErrorBoundary (previene crashes)
2. **Fase 3**: Correccion de paises (consistencia de datos)
3. **Fase 2.2**: Paginacion en admin (rendimiento)
4. **Fase 4.1**: Filtro de disciplina (clasificacion)
5. **Fase 1**: Pagina de Rankings (funcionalidad nueva)
6. **Fase 2.3**: Lazy loading adicional (optimizacion final)

