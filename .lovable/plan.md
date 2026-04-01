

# Tests Unitarios con Vitest — Hooks Críticos

## Setup necesario

No existe configuración de testing. Se requiere setup completo.

### 1. Instalar dependencias dev

`@testing-library/jest-dom`, `@testing-library/react`, `jsdom`, `vitest` en devDependencies.

### 2. Crear `vitest.config.ts`

Configuración estándar con `jsdom`, globals, alias `@/`, y setup file.

### 3. Crear `src/test/setup.ts`

Import de `@testing-library/jest-dom` y mock de `matchMedia`.

### 4. Actualizar `tsconfig.app.json`

Agregar `"vitest/globals"` a `compilerOptions.types`.

### 5. Agregar script `"test"` en `package.json`

`"test": "vitest run"`

---

## Tests a crear

### A. `src/hooks/__tests__/useFighterHistory.test.ts`

Testea la lógica pura de `calculateRecord` sin necesidad de renderizar el hook completo. Se extrae la lógica de cálculo y se testea directamente:

- Record vacío cuando no hay peleas
- Cuenta wins correctamente (fighter es `winner_id`)
- Cuenta losses (hay `winner_id` pero no es el fighter)
- Cuenta draws (no hay `winner_id`)
- Filtra por `AMATEUR` vs `PROFESSIONAL`
- Calcula `winPercentage` correctamente (Math.round)
- Record mixto: 3W-1L-1D = 60% win rate

Este hook tiene la lógica más testeable porque `calculateRecord` es pura.

### B. `src/hooks/__tests__/useFights.test.ts`

Testea `useFights` con mock de Supabase:

- Estado inicial: `loading: true`, `fights: []`
- Carga peleas correctamente después de fetch
- Filtra por `eventId` cuando se proporciona
- Maneja errores de Supabase

### C. `src/hooks/__tests__/useFightTelemetry.test.ts`

Testea la lógica de agregación `strikesByCorner` (extraída como utilidad pura):

- Acumula strikes por corner (red/blue) y tipo
- Maneja eventos sin `fighter_corner` como "blue" (fallback)
- Eventos sin `strike_type` se agrupan como "other"
- Lista vacía retorna `{ red: {}, blue: {} }`

---

## Estrategia de mocking

Se creará un mock compartido para Supabase en `src/test/mocks/supabase.ts` que intercepta `.from().select().eq()` etc. con respuestas controladas. Para los tests de lógica pura (calculateRecord, strikesByCorner), no se necesita mock — se testea la función directamente.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `package.json` | Agregar devDependencies de testing + script |
| `vitest.config.ts` | Nuevo — configuración Vitest |
| `src/test/setup.ts` | Nuevo — setup de testing |
| `tsconfig.app.json` | Agregar `vitest/globals` a types |
| `src/hooks/__tests__/useFighterHistory.test.ts` | Nuevo — tests de calculateRecord |
| `src/hooks/__tests__/useFights.test.ts` | Nuevo — tests de useFights |
| `src/hooks/__tests__/useFightTelemetry.test.ts` | Nuevo — tests de strikesByCorner |

