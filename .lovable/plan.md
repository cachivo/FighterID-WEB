

# Plan: Apodos en Ranking + Fix Bug 110%

## Problema 1: Apodos Faltantes en el Ranking

### Ubicacion
`src/components/sections/Ranking.tsx` - Lineas 223-225

### Estado Actual
```tsx
<h4 className="text-xs xs:text-sm sm:text-base font-bold text-white...">
  {ranking.fighter.first_name} {ranking.fighter.last_name}
</h4>
```

### Solucion
Agregar el apodo debajo del nombre, consistente con el patron de `FighterCard.tsx`:

```tsx
<h4 className="text-xs xs:text-sm sm:text-base font-bold text-white...">
  {ranking.fighter.first_name} {ranking.fighter.last_name}
</h4>
{ranking.fighter.nickname && (
  <span className="text-[9px] xs:text-[10px] sm:text-xs text-purple-neon-primary/80 font-medium truncate">
    "{ranking.fighter.nickname}"
  </span>
)}
```

### Optimizacion Movil
- Texto ultra compacto: `text-[9px]` en movil
- `truncate` para apodos largos
- Comillas para diferenciar visualmente

---

## Problema 2: Bug del 110% en Progreso de Perfil

### Causa Raiz
En `useProfileCompletion.tsx`, los puntos se asignan asi:

| Campo | Puntos |
|-------|--------|
| Avatar | 15 |
| Fecha nacimiento | 10 |
| Genero | 10 |
| Telefono | 10 |
| Tipo sangre | 10 |
| Contacto emergencia | 10 |
| Altura | 5 |
| Peso | 5 |
| Alcance | 5 |
| Bio | 10 |
| Artes marciales | 10 |
| **Subtotal** | **100** |
| BoxRec (solo Boxeo) | **+10** |
| **Total Boxeo** | **110** |

Para boxeadores con perfil completo, el score llega a **110%** porque BoxRec suma 10 puntos adicionales sin ajustar el total.

### Solucion
Limitar el score a un maximo de 100 antes de retornarlo:

```tsx
// Al final del calculo, ANTES de determinar level
const cappedScore = Math.min(score, 100);
```

Y usar `cappedScore` en lugar de `score` para el resto de la logica.

### Ubicacion
`src/hooks/useProfileCompletion.tsx` - Linea 164 (antes de determinar level)

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/sections/Ranking.tsx` | Agregar nickname debajo del nombre |
| `src/hooks/useProfileCompletion.tsx` | Capear score a maximo 100 |

---

## Compatibilidad Movil

**Ranking con apodos:**
- Texto responsivo `text-[9px] xs:text-[10px] sm:text-xs`
- `truncate` para prevenir overflow
- Sin cambios en estructura de layout

**Widget de progreso:**
- Solo cambio logico en hook
- Sin impacto visual mas alla de corregir el 110%

---

## Resultado Esperado

**Antes:**
```
#1 Randy Tercero           18 pts
   Peso Mosca (125 lbs)
```

**Despues:**
```
#1 Randy Tercero           18 pts
   "El Torito"
   Peso Mosca (125 lbs)
```

**Progreso:**
- Antes: `110% Completado`
- Despues: `100% Completado`

