

# Ajustar colores del Echo Stack para mayor visibilidad

## Cambio

Actualizar los 4 colores de las capas echo en `src/index.css` para que sean visibles sobre fondo negro.

### `src/index.css` (líneas 563-566)

| Capa | Actual | Nuevo |
|------|--------|-------|
| `.echo-1` | `hsl(0 0% 10%)` | `hsl(0 0% 18%)` |
| `.echo-2` | `hsl(0 0% 8%)` | `hsl(0 0% 22%)` |
| `.echo-3` | `hsl(0 0% 7%)` | `hsl(0 0% 26%)` |
| `.echo-4` | `hsl(0 0% 6%)` | `hsl(0 0% 30%)` |

Esto crea un gradiente más pronunciado (del más cercano al más lejano: oscuro → claro), haciendo que la profundidad tipográfica sea perceptible sin perder sutileza.

