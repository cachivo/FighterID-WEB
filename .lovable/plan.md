

# Corregir Ranking y Agregar Seccion de Gimnasios

## Problema actual

En las tarjetas de ranking, el nombre del gimnasio aparece comprimido entre la division y el record, truncandose a una sola letra (ej: "C.", "L."). Ademas, falta una seccion dedicada a gimnasios en la pagina principal.

## Cambios

### 1. Reestructurar tarjetas de ranking (archivo: `src/components/sections/Ranking.tsx`)

Cambiar de 3 lineas a 4 lineas por tarjeta:

```text
Linea 1: Nombre completo + badge campeon
Linea 2: Nickname (con min-height para uniformidad)
Linea 3: [Badge division] [Record W-L-D]
Linea 4: Icono edificio + Nombre del gimnasio (o "Independiente")
```

El gimnasio pasa a tener su propia linea debajo de la division, con un icono de edificio y texto en gris claro. Asi se ve completo sin truncarse.

### 2. Nueva seccion "Escuelas" en la pagina principal

Crear `src/components/sections/GymShowcase.tsx` - una seccion ligera que muestra los gimnasios con sus peleadores agrupados por escuela.

Caracteristicas:
- Query optimizado: un solo SELECT con JOIN a `fighter_profiles` para traer gym + conteo de peleadores
- Solo muestra gyms con al menos 1 peleador registrado
- Cada gym se muestra como una tarjeta compacta con: logo (o fallback con iniciales), nombre, ciudad, disciplinas, y cantidad de peleadores
- Al tocar un gym, navega a `/gimnasios/{slug}` para ver el detalle completo
- Scroll horizontal con snap para gama baja (sin grid pesado)
- Lazy-loaded con `React.lazy` + `Suspense`

### 3. Integrar en la pagina principal (archivo: `src/pages/Index.tsx`)

Agregar la seccion de gimnasios entre el Ranking y los Aliados Estrategicos:

```text
Header > Hero > CTA > QuickStats > LeagueSelector > Ranking > [GymShowcase] > Allies > Footer
```

### 4. Hook dedicado (archivo: `src/hooks/useGymsWithFighters.ts`)

Query liviano que trae gimnasios activos con conteo de peleadores, ordenados por cantidad de peleadores (los mas grandes primero). Usa `staleTime` largo para evitar re-fetches innecesarios en gama baja.

## Detalle tecnico

| Archivo | Accion |
|---------|--------|
| `src/components/sections/Ranking.tsx` | Modificar: mover gym a linea propia debajo de division |
| `src/components/sections/GymShowcase.tsx` | Crear: seccion de gimnasios con peleadores agrupados |
| `src/hooks/useGymsWithFighters.ts` | Crear: hook con query optimizado gyms + fighter count |
| `src/pages/Index.tsx` | Modificar: agregar GymShowcase lazy-loaded |

No hay cambios en base de datos. Toda la informacion ya existe en las tablas `gyms` y `fighter_profiles` (campo `gym_id`).

