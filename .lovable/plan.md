

# Plan: Remoción Automática de Fondo para Fotos de Peleadores

## Problema Identificado

Las fotos de perfil de los peleadores tienen fondos negros/oscuros que aparecen en la cartelera del evento, afectando la presentación visual. Esto ocurre porque:
- Las fotos de perfil (`avatar_url`) se suben sin procesamiento de fondo
- Cuando no hay imagen específica del evento (`fighter_a_event_image_url`), se usa la foto de perfil
- El CSS `mix-blend-lighten` no funciona bien con fondos oscuros

## Solución Propuesta

Implementar un servicio de remoción de fondo usando la **API de Lovable (Nano banana)** que puede editar imágenes mediante IA. Este proceso se aplicará automáticamente al subir fotos de peleadores.

---

## Arquitectura de la Solución

```text
┌─────────────────────────────────────────────────────────────────────┐
│ FLUJO DE SUBIDA DE IMAGEN DE PELEADOR                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Usuario sube foto ──► 2. Mostrar preview ──► 3. Click "Guardar"│
│                                                                     │
│  4. ¿Remover fondo?                                                 │
│     ├── Checkbox activado ──► 5. Llamar Edge Function               │
│     │                              │                                │
│     │                              ▼                                │
│     │                         Lovable AI API                        │
│     │                    (google/gemini-2.5-flash-image)            │
│     │                              │                                │
│     │                              ▼                                │
│     │                    6. Imagen sin fondo (PNG)                  │
│     │                              │                                │
│     └── Checkbox desactivado ──────┼────────────────────────────────│
│                                    │                                │
│                                    ▼                                │
│                         7. Subir a Supabase Storage                 │
│                         8. Actualizar avatar_url                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cambios Técnicos

### 1. Nueva Edge Function: `remove-image-background`

Crear función que use la API de Lovable para remover fondos:

```typescript
// supabase/functions/remove-image-background/index.ts

Deno.serve(async (req) => {
  const { imageBase64 } = await req.json();
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Remove the background from this image completely. Keep only the person/subject. Make the background fully transparent. Output as PNG."
          },
          {
            type: "image_url",
            image_url: { url: imageBase64 }
          }
        ]
      }],
      modalities: ["image", "text"]
    })
  });
  
  const data = await response.json();
  const processedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  return new Response(JSON.stringify({ processedImage }));
});
```

### 2. Nuevo Utilitario: `src/lib/backgroundRemovalAI.ts`

Función para llamar a la Edge Function:

```typescript
export async function removeBackgroundAI(file: File): Promise<Blob> {
  // Convertir archivo a base64
  const base64 = await fileToBase64(file);
  
  // Llamar edge function
  const { data, error } = await supabase.functions.invoke('remove-image-background', {
    body: { imageBase64: base64 }
  });
  
  if (error) throw error;
  
  // Convertir respuesta a Blob
  return base64ToBlob(data.processedImage);
}
```

### 3. Modificar: `src/lib/photoUtils.ts`

Agregar opción de remover fondo antes de subir:

```typescript
export async function uploadFighterAvatar(
  file: File, 
  userId: string,
  fighterProfileId: string,
  currentAvatarUrl?: string,
  removeBackground: boolean = false  // ← Nuevo parámetro
): Promise<string | null> {
  
  let processedFile = file;
  
  // Remover fondo si se solicita
  if (removeBackground && file.type.startsWith('image/')) {
    toast.info('Removiendo fondo con IA...');
    const { removeBackgroundAI } = await import('./backgroundRemovalAI');
    const noBgBlob = await removeBackgroundAI(file);
    processedFile = new File([noBgBlob], 'avatar.png', { type: 'image/png' });
    toast.success('Fondo removido correctamente');
  }
  
  // Continuar con el flujo normal...
}
```

### 4. Actualizar UI de Subida de Fotos

Agregar checkbox/toggle en los formularios de edición:

**Archivo:** `src/components/admin/FighterEditModal.tsx`

```tsx
<div className="flex items-center space-x-2">
  <Switch
    id="remove-bg"
    checked={removeBackground}
    onCheckedChange={setRemoveBackground}
  />
  <Label htmlFor="remove-bg" className="flex items-center gap-2">
    <Wand2 className="w-4 h-4" />
    Remover fondo automáticamente (IA)
  </Label>
</div>
```

**Archivo:** `src/components/UserFighterProfileEditForm.tsx`
- Mismo toggle para usuarios normales

**Archivo:** `src/components/admin/AdminFighterForm.tsx`
- Toggle al crear nuevo peleador

### 5. Actualizar Formulario de Peleas (EventosPelea.tsx)

Para imágenes específicas del evento:

```tsx
<div className="space-y-2">
  <Label>Imagen Cartelera (Esquina Roja)</Label>
  <Input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    onChange={handleImageA}
  />
  <div className="flex items-center gap-2 text-sm">
    <Switch checked={removeBackgroundA} onCheckedChange={setRemoveBackgroundA} />
    <span>Remover fondo automáticamente</span>
  </div>
</div>
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/functions/remove-image-background/index.ts` | Crear | Edge Function para IA de remoción de fondo |
| `src/lib/backgroundRemovalAI.ts` | Crear | Utilitario para llamar la edge function |
| `src/lib/photoUtils.ts` | Modificar | Agregar parámetro `removeBackground` |
| `src/components/admin/FighterEditModal.tsx` | Modificar | Agregar toggle de remover fondo |
| `src/components/admin/AdminFighterForm.tsx` | Modificar | Agregar toggle de remover fondo |
| `src/components/UserFighterProfileEditForm.tsx` | Modificar | Agregar toggle de remover fondo |
| `src/pages/admin/EventosPelea.tsx` | Modificar | Agregar toggle para imágenes de cartelera |

---

## Experiencia de Usuario

1. **Admin edita peleador:**
   - Sube nueva foto
   - Ve toggle "Remover fondo automáticamente (IA)"
   - Si activa el toggle, la foto se procesa antes de guardar
   - Mensaje: "Removiendo fondo..." → "¡Listo! Fondo removido"

2. **Peleador edita su perfil:**
   - Mismo flujo con toggle opcional

3. **Creación de pelea:**
   - Al subir imagen de cartelera
   - Toggle para remover fondo
   - Útil si el administrador recibe fotos con fondo

---

## Consideraciones Técnicas

1. **Límite de tamaño:** Máximo 5MB por imagen para procesar
2. **Tiempo de procesamiento:** 3-8 segundos dependiendo del tamaño
3. **Formato de salida:** Siempre PNG para preservar transparencia
4. **Fallback:** Si falla la IA, usar imagen original y notificar al usuario
5. **Costo:** La API de Lovable tiene límites, pero es gratuita para uso moderado

---

## Validaciones

1. Solo procesar imágenes (no otros tipos de archivo)
2. Validar tamaño antes de enviar a la IA
3. Mostrar preview del resultado antes de confirmar (opcional futuro)
4. Timeout de 30 segundos para la llamada a la IA

