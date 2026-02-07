

# Auditoría Completa: Estructura de Edición y Creación de Perfiles

## Resumen Ejecutivo

Se identificaron **5 problemas críticos** que causan:
- Fotos no guardadas al crear perfiles
- Información incompleta 
- Boxeadores profesionales que no aparecen en ranking

---

## Hallazgos Críticos

### 1. Formulario de CREACIÓN sin capacidad de subir fotos

**Archivo afectado**: `src/components/admin/AdminFighterForm.tsx`

**Problema**: El formulario de creación (`mode='create'`) NO incluye el componente `FileUpload`. Solo el modal de edición (`FighterEditModal.tsx`) permite subir fotos.

**Evidencia**:
- AdminFighterForm.tsx: 0 referencias a FileUpload
- FighterEditModal.tsx: FileUpload presente en línea 480

**Impacto**: Todo perfil creado desde cero queda SIN foto.

**Solución**: Agregar componente FileUpload al formulario de creación.

---

### 2. Selector de Ligas NO filtra por disciplina del peleador

**Archivo afectado**: `src/components/admin/AdminFighterForm.tsx` (líneas 440-451)

**Problema**: El selector de liga muestra TODAS las organizaciones sin filtrar por la disciplina seleccionada.

```text
Código actual (línea 445):
{organizations?.map((org) => ...)}  // Muestra TODAS

Debería ser:
{organizations?.filter(org => org.discipline === formData.discipline)...}
```

**Escenario de fallo**:
1. Admin crea boxeador profesional (discipline: Boxeo, level: Profesional)
2. Selector muestra: UCC_MMA, BDG_PRO, HHF_AMATEUR
3. Admin puede seleccionar HHF_AMATEUR que solo permite "Amateur"
4. Inscripción falla silenciosamente o no se realiza

**Datos actuales** (boxeadores Pro/Semi sin ranking):

| Peleador | Nivel | Ranking | Foto |
|----------|-------|---------|------|
| Miguel Alberto Gonzales | Profesional | 0 ligas | No |
| Jorge Luis Munguía | Profesional | 0 ligas | No |
| Mateo Starozze | Semi-profesional | 0 ligas | Sí |

---

### 3. No existe trigger de auto-inscripción por disciplina

**Triggers actuales en fighter_profiles**:

| Trigger | Función | Propósito |
|---------|---------|-----------|
| audit_fighter_profile_trigger | audit_fighter_profile_changes | Auditoría |
| set_fighter_license_trigger | set_fighter_license | Auto-licencia |
| sync_profile_to_rankings_trigger | sync_fighter_profile_to_rankings | Sync level/weight |
| trigger_update_completion | update_profile_completion | Completitud |

**Falta**: Un trigger que auto-inscriba según disciplina + nivel:
- Boxeo + Profesional/Semi → BDG_PRO
- Boxeo + Amateur → HHF_AMATEUR  
- MMA + cualquier nivel → UCC_MMA

---

### 4. Récords no sincronizados en creación

**Problema**: Al crear un perfil, los récords específicos por disciplina (`boxeo_record_*`, `mma_record_*`) inician en 0 y no se populan desde los campos legacy.

**Evidencia**:

| Peleador | boxeo_record_wins | boxeo_record_losses | record_wins (legacy) |
|----------|-------------------|---------------------|----------------------|
| Miguel Alberto | 0 | 0 | 0 |
| Jorge Luis | 0 | 0 | 0 |

---

### 5. Organizaciones de Boxeo disponibles pero desconectadas

**Organizaciones activas**:

| Código | Nombre | Niveles Permitidos |
|--------|--------|-------------------|
| BDG_PRO | BDG Pro Boxing | Profesional, Semi-profesional |
| HHF_AMATEUR | Honduras Hood Fights | Amateur |
| UCC_MMA | UCC Honduras | Profesional, Semi-profesional, Amateur |

El selector de niveles SÍ filtra correctamente según la organización seleccionada, pero el selector de organizaciones no filtra por disciplina.

---

## Plan de Correcciones

### Fase 1: Corrección de UI (Código Frontend)

**1.1 Agregar FileUpload a AdminFighterForm.tsx**

Ubicación sugerida: Tab "Personal", junto a los datos básicos

```text
<Card>
  <CardHeader>
    <CardTitle>Foto de Perfil</CardTitle>
  </CardHeader>
  <CardContent>
    <FileUpload
      accept="image/*"
      onFileSelect={(file) => handleChange('_avatarFile', file)}
      maxSize={5 * 1024 * 1024}
    />
  </CardContent>
</Card>
```

**1.2 Filtrar organizaciones por disciplina en AdminFighterForm.tsx**

Cambio en línea 445:

```text
// Antes:
{organizations?.map((org) => ...)}

// Después:
{organizations
  ?.filter(org => !formData.discipline || org.discipline === formData.discipline)
  .map((org) => ...)}
```

**1.3 Procesar archivo de avatar en handleSubmit**

Agregar lógica similar a FighterEditModal para subir la foto después de crear el perfil.

---

### Fase 2: Automatización Backend (Migración SQL)

**2.1 Trigger de auto-inscripción por disciplina**

```sql
CREATE OR REPLACE FUNCTION auto_enroll_fighter_by_discipline()
RETURNS TRIGGER AS $$
DECLARE
  v_org_code TEXT;
BEGIN
  -- Determinar organización según disciplina y nivel
  IF NEW.discipline = 'Boxeo' THEN
    IF NEW.level IN ('Profesional', 'Semi-profesional') THEN
      v_org_code := 'BDG_PRO';
    ELSIF NEW.level = 'Amateur' THEN
      v_org_code := 'HHF_AMATEUR';
    END IF;
  ELSIF NEW.discipline = 'MMA' THEN
    v_org_code := 'UCC_MMA';
  END IF;

  -- Inscribir si determinamos organización
  IF v_org_code IS NOT NULL THEN
    PERFORM enroll_fighter_in_ranking(
      NEW.id, 
      v_org_code, 
      NEW.level, 
      NEW.weight_class
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_enroll_on_create
AFTER INSERT ON fighter_profiles
FOR EACH ROW
WHEN (NEW.discipline IS NOT NULL AND NEW.level IS NOT NULL)
EXECUTE FUNCTION auto_enroll_fighter_by_discipline();
```

---

### Fase 3: Corrección de Datos Existentes (SQL Manual)

**3.1 Inscribir boxeadores profesionales existentes en BDG_PRO**

```sql
-- Boxeadores profesionales sin ranking
INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
SELECT 
  fp.id,
  (SELECT id FROM ranking_organizations WHERE code = 'BDG_PRO'),
  fp.level,
  fp.weight_class,
  (COALESCE(fp.boxeo_record_wins, 0) * 3) + 
  (COALESCE(fp.boxeo_record_draws, 0) * 1) - 
  (COALESCE(fp.boxeo_record_losses, 0) * 1),
  true
FROM fighter_profiles fp
WHERE fp.discipline = 'Boxeo'
  AND fp.level IN ('Profesional', 'Semi-profesional')
  AND fp.active = true
  AND NOT EXISTS (
    SELECT 1 FROM fighter_rankings fr 
    WHERE fr.fighter_id = fp.id AND fr.is_active = true
  );
```

---

## Arquitectura Corregida

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Flujo de Creación de Perfil                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AdminFighterForm                                               │
│  ┌─────────────────┐                                            │
│  │ 1. Datos básicos│                                            │
│  │ 2. Foto         │ ← [NUEVO] FileUpload                       │
│  │ 3. Disciplina   │                                            │
│  │ 4. Liga inicial │ ← [FIX] Filtrar por disciplina             │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │ handleSubmit()  │                                            │
│  │ 1. Create profile                                            │
│  │ 2. Upload avatar│ ← [NUEVO]                                  │
│  │ 3. Enroll league│                                            │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │ DB Trigger      │                                            │
│  │ auto_enroll     │ ← [NUEVO] Backup si no se selecciona liga  │
│  └─────────────────┘                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prioridad de Implementación

| # | Tarea | Impacto | Esfuerzo |
|---|-------|---------|----------|
| 1 | Filtrar organizaciones por disciplina | Alto | Bajo |
| 2 | Agregar FileUpload a creación | Alto | Medio |
| 3 | SQL: Inscribir boxeadores existentes | Alto | Bajo |
| 4 | Trigger de auto-inscripción | Medio | Medio |

---

## Acciones Inmediatas Requeridas

1. **Aprobar este plan** para implementar las correcciones de código
2. **Ejecutar SQL manual** para inscribir los 3 boxeadores profesionales en BDG_PRO
3. **Verificar** que los perfiles aparezcan en el ranking después de la corrección

