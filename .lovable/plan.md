

# Fix: Nombres de gimnasios mostrándose verticalmente (1 letra por línea)

## Causa raíz

El `CardHeader` tiene un layout `flex` horizontal con 3 elementos compitiendo por espacio:
1. Logo (48px fijo)
2. Nombre (`flex-1 min-w-0`)
3. Badges (Sin Main Coach + contadores) — estos badges ocupan ~200px, dejando casi 0px para el nombre

Con `break-words`, el nombre rompe en cada carácter porque no tiene espacio horizontal.

## Solución

Reestructurar el `CardHeader` para que los badges NO estén en la misma fila que el nombre:

```
┌─────────────────────────────┐
│ [Logo] Nombre del Gimnasio  │
│         Ciudad, País        │
│ [Sin Main Coach] [⚔4] [👥0] │
└─────────────────────────────┘
```

- Mover los badges debajo del bloque nombre/ciudad
- El nombre ocupa todo el ancho disponible (menos el logo)
- Los badges van en una fila separada con `flex-wrap`

## Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/AdminGymCard.tsx` | Reestructurar CardHeader: badges debajo del nombre en vez de al lado |

**1 archivo.**

