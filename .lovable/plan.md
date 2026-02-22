

# Auditoria de Idioma y Coherencia del Sistema

## Problemas Encontrados

Se identificaron inconsistencias de idioma (texto en ingles dentro de la interfaz en espanol) y una etiqueta incorrecta en el flujo de licencias.

### 1. Texto en Ingles que debe traducirse al Espanol

| Archivo | Linea | Actual (Ingles) | Correccion (Espanol) |
|---------|-------|-----------------|----------------------|
| `src/components/FighterCard.tsx` | 128 | `Record` | `Record` (aceptable como termino deportivo) o `Palmarés` |
| `src/components/gym/GymDashboardHeader.tsx` | 24 | `OWNER: 'Main Coach'` | `OWNER: 'Entrenador Principal'` |
| `src/components/gym/GymStaffCard.tsx` | 14 | `OWNER: 'Main Coach'` | `OWNER: 'Entrenador Principal'` |
| `src/components/admin/FighterDetailModal.tsx` | 244 | `label="Stance"` | `label="Guardia"` |
| `src/pages/license/LicenseOnboarding.tsx` | 542 | `Label: "Stance"` | `Label: "Guardia"` |
| `src/pages/license/LicenseOnboarding.tsx` | 548 | `placeholder="Selecciona tu stance"` | `placeholder="Selecciona tu guardia"` |

### 2. Inconsistencia en la etiqueta "Guardia" / "Postura" / "Stance"

El mismo campo `stance` tiene 3 nombres diferentes segun el formulario:

| Archivo | Etiqueta Actual |
|---------|----------------|
| `AdminFighterForm.tsx` | "Guardia" (correcto) |
| `FighterEditModal.tsx` | "Postura" |
| `UserFighterProfileEditForm.tsx` | "Postura" |
| `ProfileChangeRequest.tsx` | "Guardia" (correcto) |
| `LicenseOnboarding.tsx` | "Stance" (ingles) |
| `FighterDetailModal.tsx` | "Stance" (ingles) |

**Decision:** Unificar todo a **"Guardia"** que es el termino correcto en espanol para deportes de combate.

### 3. Rol "HEAD_COACH" duplica "Entrenador Principal" con OWNER

Actualmente:
- `OWNER` = "Main Coach" (ingles)
- `HEAD_COACH` = "Entrenador Principal"

Esto causa que al corregir OWNER a espanol, ambos roles digan lo mismo. La correccion correcta:
- `OWNER` = "Propietario" o "Director"
- `HEAD_COACH` = "Entrenador Principal"
- `ASSISTANT_COACH` = "Asistente"

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/gym/GymDashboardHeader.tsx` | `OWNER: 'Main Coach'` a `OWNER: 'Director'` |
| `src/components/gym/GymStaffCard.tsx` | `OWNER: 'Main Coach'` a `OWNER: 'Director'` |
| `src/components/admin/FighterDetailModal.tsx` | `label="Stance"` a `label="Guardia"` |
| `src/pages/license/LicenseOnboarding.tsx` | Label "Stance" a "Guardia", placeholder a "Selecciona tu guardia" |
| `src/components/admin/FighterEditModal.tsx` | `Label: "Postura"` a `Label: "Guardia"` |
| `src/components/UserFighterProfileEditForm.tsx` | `FormLabel: "Postura"` a `FormLabel: "Guardia"`, placeholder a "Seleccionar guardia" |

## Flujo de Habilitacion de Licencias

El flujo de licencias esta completo y correcto en espanol:

1. `/license/auth` - Autenticacion (espanol)
2. `/license/onboarding` - Formulario de solicitud (espanol, excepto "Stance")
3. `/license/pending` - Estado de espera con pasos claros (espanol)
4. `/license/dashboard` - Panel activo con toda la info (espanol)
5. `/license/suspended` - Pagina de suspension (espanol)

No hay problemas funcionales en el flujo. Solo las correcciones de etiquetas mencionadas arriba.

## Total: 6 archivos, ~10 lineas de cambio
