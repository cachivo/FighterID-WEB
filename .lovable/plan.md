
# Plan: Corregir Menús de Selección en Página de Peleadores

## Problema Identificado

En la página `/fighters`, los menús de filtro muestran solo el valor seleccionado sin contexto de qué categoría se está filtrando:

```text
ESTADO ACTUAL (Confuso):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🔍 Todos     │ │ 🔍 Todas     │ │ 🔍 Todos     │ │ 🔍 Todos     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
    ¿División?      ¿Disciplina?     ¿Estilo?        ¿Tipo?

ESTADO ESPERADO (Claro):
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ División: Todos  │ │ Disciplina: Todas│ │ Estilo: Todos    │ │ Tipo: Todos      │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Código Problemático (líneas 346-382 de Fighters.tsx)

```typescript
// El array de filtros no tiene labels descriptivos
{[
  { value: selectedWeightClass, options: WEIGHT_CLASSES, placeholder: "División" },
  { value: selectedDiscipline, options: DISCIPLINES, placeholder: "Disciplina" },
  // ...
].map((filter) => (
  <Select value={filter.value}>
    <SelectTrigger>
      <SelectValue placeholder={filter.placeholder} />  // ❌ Solo muestra "Todos"
    </SelectTrigger>
  </Select>
))}
```

El `<SelectValue>` de Radix UI muestra el **valor seleccionado** (ej: "Todos"), no el placeholder. El placeholder solo aparece cuando NO hay valor.

---

## Solución Propuesta

### Cambio 1: Agregar Labels Descriptivos a Cada Select

Modificar el array de filtros para incluir un `label` y mostrar "Label: Valor" en el trigger:

```typescript
// ANTES
{ value: selectedWeightClass, placeholder: "División", ... }

// DESPUÉS  
{ value: selectedWeightClass, label: "División", displayValue: getDisplayValue(selectedWeightClass, "División"), ... }
```

### Cambio 2: Crear Función Helper para Formatear Valores

```typescript
const getDisplayValue = (value: string, label: string): string => {
  if (value === 'Todos' || value === 'Todas' || value === 'all') {
    return `${label}: Todos`;
  }
  return value;
};
```

### Cambio 3: Modificar el SelectTrigger para Mostrar Label + Valor

```tsx
<SelectTrigger>
  <span className="flex items-center gap-2 truncate">
    <filter.icon className="h-4 w-4 text-muted-foreground shrink-0" />
    <span className="truncate">
      <span className="text-muted-foreground">{filter.label}:</span>{' '}
      <span className="font-medium">{filter.displayValue}</span>
    </span>
  </span>
</SelectTrigger>
```

---

## Archivo a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Fighters.tsx` | Reestructurar array de filtros, agregar función helper, actualizar JSX del SelectTrigger |

---

## Implementación Detallada

### Paso 1: Agregar Función Helper (línea ~60)

```typescript
// Helper para mostrar valores descriptivos en los selectores
const getFilterDisplayValue = (value: string, defaultLabel: string): string => {
  if (value === 'Todos' || value === 'Todas' || value === 'all') {
    return 'Todos';
  }
  // Para opciones especiales de completitud
  if (value === 'verified') return 'Verificados';
  if (value === 'diamond') return 'Completos';
  // Para ordenamiento
  if (value === 'name') return 'Nombre';
  if (value === 'wins') return 'Victorias';
  if (value === 'completion') return 'Completitud';
  return value;
};
```

### Paso 2: Reestructurar Array de Filtros (líneas 346-362)

```typescript
const filters = [
  { 
    label: "División",
    value: selectedWeightClass, 
    onChange: setSelectedWeightClass, 
    options: WEIGHT_CLASSES,
  },
  { 
    label: "Disciplina",
    value: selectedDiscipline, 
    onChange: setSelectedDiscipline, 
    options: DISCIPLINES,
  },
  { 
    label: "Estilo",
    value: selectedFightingStyle, 
    onChange: setSelectedFightingStyle, 
    options: FIGHTING_STYLES,
  },
  { 
    label: "Nivel",
    value: selectedRecordType, 
    onChange: setSelectedRecordType, 
    options: RECORD_TYPES,
  },
  { 
    label: "Perfil",
    value: completionFilter, 
    onChange: setCompletionFilter, 
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'verified', label: 'Verificados (70%+)' },
      { value: 'diamond', label: 'Completos' }
    ],
  },
  { 
    label: "Ordenar",
    value: sortBy, 
    onChange: setSortBy, 
    options: [
      { value: 'name', label: 'Nombre' },
      { value: 'wins', label: 'Victorias' },
      { value: 'completion', label: 'Completitud' }
    ],
  }
];
```

### Paso 3: Actualizar JSX del Select (líneas 364-382)

```tsx
{filters.map((filter, index) => (
  <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
    <Select value={filter.value} onValueChange={filter.onChange}>
      <SelectTrigger className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card transition-all duration-300 min-h-[44px]">
        <span className="flex items-center gap-1.5 truncate text-sm">
          <span className="text-muted-foreground font-medium">{filter.label}:</span>
          <span className="text-foreground">
            {getFilterDisplayValue(filter.value, filter.label)}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {filter.options.map((option: any) => (
          <SelectItem 
            key={typeof option === 'string' ? option : option.value} 
            value={typeof option === 'string' ? option : option.value}
          >
            {typeof option === 'string' ? option : option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
))}
```

---

## Resultado Visual Esperado

```text
ANTES (Usuario confundido):
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 🔍Todos │ │ 🔍Todas │ │ 🔍Todos │ │ 🔍Todos │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

DESPUÉS (Claro y descriptivo):
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ División: Todos   │ │ Disciplina: Todas │ │ Estilo: Todos     │
└───────────────────┘ └───────────────────┘ └───────────────────┘

┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ Nivel: Todos      │ │ Perfil: Todos     │ │ Ordenar: Nombre   │
└───────────────────┘ └───────────────────┘ └───────────────────┘
```

---

## Optimizaciones Móviles Incluidas

1. **Touch targets**: Mantener `min-h-[44px]` en todos los SelectTrigger
2. **Texto truncado**: Usar `truncate` para evitar overflow en pantallas pequeñas
3. **Responsive grid**: El grid ya usa `grid-cols-1 md:grid-cols-6`

---

## Archivos Afectados

| Archivo | Tipo de Cambio |
|---------|----------------|
| `src/pages/Fighters.tsx` | Refactorizar filtros, agregar labels descriptivos |
