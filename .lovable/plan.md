

# Plan: Implementar Aprobación Selectiva (Opción B)

## Estado Actual vs Deseado

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    ESTADO ACTUAL                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Usuario cambia CUALQUIER campo                                     │
│              ↓                                                       │
│   status = 'PENDING' (siempre)                                      │
│              ↓                                                       │
│   Admin debe aprobar TODO manualmente                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ESTADO DESEADO (Opción B)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Usuario cambia campos                                              │
│              ↓                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ ¿Solo campos SEGUROS?                                        │   │
│   │                                                              │   │
│   │   SÍ → AUTO-APROBAR                                          │   │
│   │        (aplicar inmediatamente)                              │   │
│   │                                                              │   │
│   │   NO → PENDING                                               │   │
│   │        (requiere revisión admin)                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Clasificación de Campos

### Campos SEGUROS (Auto-aprobación)
| Campo | Razón |
|-------|-------|
| `nickname` | Cosmético, no afecta elegibilidad |
| `bio` | Texto descriptivo personal |
| `fighting_style` | Preferencia de estilo |
| `stance` | Guardia (Orthodox/Southpaw) |
| `gym_name` | Información de afiliación |
| `boxrec_url` | Link externo |
| `tapology_url` | Link externo |
| `height_cm` | Físico, verificable en pesaje |
| `reach_cm` | Físico, verificable en pesaje |
| `martial_arts` | Artes que practica (experiencia) |
| `medical_conditions` | El usuario conoce su información |
| `medical_allergies` | El usuario conoce su información |
| `emergency_contact_*` | Contacto personal del usuario |

### Campos SENSIBLES (Requieren aprobación)
| Campo | Razón |
|-------|-------|
| `first_name`, `last_name` | Identidad oficial en licencia |
| `record_wins`, `record_losses`, `record_draws` | Afecta ranking y matchmaking |
| `weight_class` | Determina categoría de pelea |
| `weight_kg` | Afecta elegibilidad de categoría |
| `level` | Amateur vs Profesional (regulaciones distintas) |
| `discipline` | Tipo de licencia (MMA vs Boxeo) |
| `gender` | Elegibilidad de competencia |
| `country` | Regulaciones por país |
| `document_type`, `document_number` | Documentos de identidad |
| `birthdate` | Edad mínima para competir |

---

## Archivos a Modificar

### 1. Crear constantes de clasificación de campos
**Archivo: `src/lib/constants/fieldApprovalRules.ts`**

```typescript
// Campos que se auto-aprueban (el usuario puede cambiar libremente)
export const AUTO_APPROVE_FIELDS = [
  'nickname', 'bio', 'fighting_style', 'stance', 'gym_name',
  'boxrec_url', 'tapology_url', 'height_cm', 'reach_cm',
  'martial_arts', 'medical_conditions', 'medical_allergies',
  'emergency_contact_name', 'emergency_contact_phone', 
  'emergency_contact_relation', 'insurance_company', 'insurance_policy'
] as const;

// Campos que requieren aprobación administrativa
export const REQUIRES_APPROVAL_FIELDS = [
  'first_name', 'last_name', 'record_wins', 'record_losses', 
  'record_draws', 'weight_class', 'weight_kg', 'level', 
  'discipline', 'gender', 'country', 'document_type', 
  'document_number', 'birthdate', 'birthplace', 'blood_type'
] as const;

// Función helper para clasificar cambios
export function classifyChanges(changes: Record<string, any>) {
  const autoApprove: Record<string, any> = {};
  const requiresApproval: Record<string, any> = {};
  
  Object.entries(changes).forEach(([field, value]) => {
    if (AUTO_APPROVE_FIELDS.includes(field as any)) {
      autoApprove[field] = value;
    } else {
      requiresApproval[field] = value;
    }
  });
  
  return { autoApprove, requiresApproval };
}
```

### 2. Actualizar hook de solicitudes
**Archivo: `src/hooks/useProfileChangeRequests.ts`**

Modificar `createChangeRequest` para:
1. Clasificar los cambios usando `classifyChanges()`
2. Auto-aplicar campos seguros inmediatamente
3. Solo crear solicitud PENDING si hay campos sensibles

### 3. Actualizar UI de solicitud
**Archivo: `src/pages/ProfileChangeRequest.tsx`**

Modificar para:
1. Mostrar qué campos se aplicarán inmediatamente
2. Mostrar qué campos requieren aprobación
3. Actualizar el mensaje de alerta para reflejar el flujo híbrido

---

## Flujo de Usuario Actualizado

```text
┌─────────────────────────────────────────────────────────────────────┐
│              NUEVO FLUJO DE SOLICITUD DE CAMBIOS                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Usuario modifica su perfil                                          │
│              ↓                                                       │
│  [Resumen de Cambios]                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  ✓ APLICACIÓN INMEDIATA (sin aprobación):                    │   │
│  │    • Apodo: "El Tigre" → "El León"                           │   │
│  │    • Bio: "Peleador amateur..." → "Campeón regional..."      │   │
│  │    • Gimnasio: "Team Alpha" → "Team Beta"                    │   │
│  │                                                              │   │
│  │  ⏳ REQUIERE APROBACIÓN ADMINISTRATIVA:                       │   │
│  │    • Categoría de peso: "Ligero" → "Welter"                  │   │
│  │    • Récord: 5-2-0 → 6-2-0                                   │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Confirmar Cambios]                                                │
│              ↓                                                       │
│  • Campos seguros: Aplicados inmediatamente ✓                       │
│  • Campos sensibles: Enviados para revisión admin                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Resumen de Impacto

| Archivo | Acción |
|---------|--------|
| `src/lib/constants/fieldApprovalRules.ts` | **CREAR** - Clasificación de campos |
| `src/hooks/useProfileChangeRequests.ts` | Modificar lógica de `createChangeRequest` |
| `src/pages/ProfileChangeRequest.tsx` | Actualizar UI para mostrar clasificación |

**Tiempo estimado:** ~15 minutos

---

## Beneficios

- **UX mejorada**: Cambios cosméticos son instantáneos
- **Menos carga admin**: Solo revisan lo que realmente importa
- **Seguridad mantenida**: Datos críticos siguen protegidos
- **Transparencia**: Usuario sabe qué se aplica inmediatamente vs qué espera

