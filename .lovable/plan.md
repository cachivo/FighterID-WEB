

# Plan: Mejorar UX de Formularios de Peleador

## Resumen
Corregir tres problemas de usabilidad identificados en los formularios de registro y edición de peleadores.

---

## Cambios Requeridos

### 1. Mejorar Visibilidad del Enlace de Recuperación de Contraseña

**Archivos a modificar:**
- `src/pages/Auth.tsx`
- `src/pages/license/LicenseAuth.tsx`

**Cambios:**
- Mejorar el contraste del enlace "¿Olvidaste tu contraseña?"
- Agregar un icono de ayuda junto al enlace
- Hacer el enlace más prominente con mejor styling

---

### 2. Estandarizar Categorías de Peso

Crear constantes unificadas con formato: **"Nombre Español (peso lbs)"**

**Nueva definición a usar en todos los formularios:**
```
Peso Paja (115 lbs)
Peso Mosca (125 lbs)
Peso Gallo (135 lbs)
Peso Pluma (145 lbs)
Peso Ligero (155 lbs)
Peso Welter (170 lbs)
Peso Medio (185 lbs)
Peso Semipesado (205 lbs)
Peso Pesado (265 lbs)
Peso Superpesado (+265 lbs)
```

**Archivos a modificar:**
- `src/components/admin/AdminFighterForm.tsx`
- `src/pages/license/LicenseOnboarding.tsx`
- `src/components/FighterProfileForm.tsx` (agregar Strawweight faltante)

---

### 3. Calculadora Automática de Alcance

**Lógica:** El alcance promedio es aproximadamente igual a la altura (ratio 1:1), con variación de +/- 5%. Usaremos `alcance = altura * 1.0` como valor sugerido.

**Implementación:**
- Cuando el usuario ingresa la altura, auto-calcular el alcance sugerido
- Mostrar mensaje: "Alcance estimado basado en tu altura. Puedes ajustarlo si conoces tu medida exacta."
- Permitir edición manual del valor
- Agregar tooltip explicando que el alcance no requiere medición física profesional

**Archivos a modificar:**
- `src/components/admin/AdminFighterForm.tsx`
- `src/pages/license/LicenseOnboarding.tsx`
- `src/components/FighterProfileForm.tsx`

---

## Flujo de Usuario Mejorado

```text
┌─────────────────────────────────────────────────────────┐
│              Formulario de Perfil de Peleador           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Categoría de Peso *                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ▼ Peso Ligero (155 lbs)                         │   │
│  └─────────────────────────────────────────────────┘   │
│  ℹ️ Selecciona según tu peso de competencia             │
│                                                         │
│  ────────────────────────────────────────────────────  │
│                                                         │
│  Altura (cm)        Peso (kg)         Alcance (cm)     │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐    │
│  │   175     │     │   70.5    │     │   175     │    │
│  └───────────┘     └───────────┘     └───────────┘    │
│                                      ↑                  │
│                           Auto-calculado desde altura   │
│  ℹ️ El alcance se estima automáticamente. Ajústalo     │
│     si conoces tu medida exacta.                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Auth.tsx` | Mejorar visibilidad del enlace de recuperación |
| `src/pages/license/LicenseAuth.tsx` | Mejorar visibilidad del enlace de recuperación |
| `src/components/admin/AdminFighterForm.tsx` | Categorías en español + calculadora de alcance |
| `src/pages/license/LicenseOnboarding.tsx` | Categorías en español + calculadora de alcance |
| `src/components/FighterProfileForm.tsx` | Agregar Peso Paja + calculadora de alcance |

---

## Detalles Técnicos

### Constantes de Categorías de Peso
Se creará un archivo centralizado o se actualizarán las constantes en cada archivo para mantener consistencia:

```typescript
const WEIGHT_CLASSES = [
  { value: 'Peso Paja', label: 'Peso Paja (115 lbs)', lbs: 115 },
  { value: 'Peso Mosca', label: 'Peso Mosca (125 lbs)', lbs: 125 },
  { value: 'Peso Gallo', label: 'Peso Gallo (135 lbs)', lbs: 135 },
  { value: 'Peso Pluma', label: 'Peso Pluma (145 lbs)', lbs: 145 },
  { value: 'Peso Ligero', label: 'Peso Ligero (155 lbs)', lbs: 155 },
  { value: 'Peso Welter', label: 'Peso Welter (170 lbs)', lbs: 170 },
  { value: 'Peso Medio', label: 'Peso Medio (185 lbs)', lbs: 185 },
  { value: 'Peso Semipesado', label: 'Peso Semipesado (205 lbs)', lbs: 205 },
  { value: 'Peso Pesado', label: 'Peso Pesado (265 lbs)', lbs: 265 },
  { value: 'Peso Superpesado', label: 'Peso Superpesado (+265 lbs)', lbs: 266 },
];
```

### Función de Cálculo de Alcance
```typescript
const calculateReach = (heightCm: number): number => {
  // El alcance promedio es aproximadamente igual a la altura
  return Math.round(heightCm);
};
```

### UX del Alcance
- Si el usuario no ha ingresado alcance y cambia la altura, auto-llenar el alcance
- Si el usuario ya modificó el alcance manualmente, no sobrescribir
- Mostrar indicador visual de "valor estimado" vs "valor manual"

