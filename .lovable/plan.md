

# Cambio de Color del Apodo en el Ranking

## Cambio Requerido

Cambiar el color del apodo/nickname de púrpura a blanco para que coincida con el nombre del peleador.

## Archivo a Modificar

`src/components/sections/Ranking.tsx` - Línea 247

## Detalle del Cambio

**Antes:**
```tsx
<span className="text-[9px] xs:text-[10px] sm:text-xs text-purple-neon-primary/80 font-medium truncate block mb-0.5">
```

**Después:**
```tsx
<span className="text-[9px] xs:text-[10px] sm:text-xs text-white/90 font-medium truncate block mb-0.5">
```

El color cambia de `text-purple-neon-primary/80` a `text-white/90` para mantener armonía cromática con el nombre del peleador, usando una ligera opacidad para diferenciarlo sutilmente del nombre principal.

## Resultado Visual

```
#1 Randy Tercero          18 pts
   "El Torito"            ← Ahora en blanco
   Peso Mosca (125 lbs)
```

