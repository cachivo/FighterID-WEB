

# Plan: Actualizar Logo a Versión Transparente

## Problema
El logo actual (`fighter-id-logo-official.png`) tiene fondo oscuro sólido que se contrasta visualmente con el fondo de la página.

## Solución
Reemplazar con el nuevo logo que tiene fondo transparente (`FID_logo_white_transparent.png`).

## Cambio

| Acción | Detalle |
|--------|---------|
| Copiar archivo | `user-uploads://FID_logo_white_transparent.png` → `public/lovable-uploads/fighter-id-logo-official.png` |

## Archivos que usan este logo

Ya configurados para usar `/lovable-uploads/fighter-id-logo-official.png`:
- `src/components/Hero.tsx` (usuarios autenticados y no autenticados)

## Resultado Visual

```text
ANTES:
┌─────────────────────────────────┐
│ ████████████████████████████████│ ← Fondo oscuro del logo
│ ████  FID  FIGHTER ID  █████████│    visible contra la página
│ ████████████████████████████████│
└─────────────────────────────────┘

DESPUÉS:
┌─────────────────────────────────┐
│        FID                      │ ← Fondo transparente
│    FIGHTER ID                   │   se integra con la página
│                                 │
└─────────────────────────────────┘
```

## Beneficio
- Logo se integra naturalmente con cualquier fondo
- Apariencia más profesional y limpia
- Sin cambios de código necesarios

