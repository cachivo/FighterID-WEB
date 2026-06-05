# Time Master — nombres bajo el cronómetro + auditoría móvil

## Problema visible
En el screenshot adjunto, con los nombres a los costados del cronómetro circular, las cajas "Roja" y "Azul" se aplastan verticalmente (texto rotado/cortado contra el borde de la tarjeta). En móviles 360–390 px no hay espacio horizontal para tres columnas.

## Cambio principal: nombres debajo del timer

`src/components/time-master/TimerDisplay.tsx`
- Quitar el layout horizontal `Roja | timer | Azul`.
- Nuevo orden vertical único:
  1. Badge de fase (CONFIGURAR / PELEANDO / DESCANSO…)
  2. Round X / Y en grande (info principal)
  3. Círculo del cronómetro centrado (ancho = `min(container - 32px, 360px)`, mínimo 200 px)
  4. Fila con dos tarjetas de peleadores **debajo** del círculo: `grid-cols-2 gap-3`, cada una con esquina (Roja/Azul) y nombre completo en 2 líneas máximo (`line-clamp-2`, sin `truncate`, respetando regla de no truncar nombres).
- Ajustar `ResizeObserver` para que el tamaño del círculo dependa solo del ancho del contenedor, no de reservar columnas laterales.
- Mantener fuente del tiempo escalada (`size * 0.22`) y colores semánticos existentes.

## Auditoría móvil del resto de `/time-master`

`src/pages/TimeMaster.tsx`
1. **Header (líneas 84–113):** la fila de badges/silencio + "SETUP" se envuelve mal con texto largo del cronómetro silencioso. Forzar `flex-wrap` ya existe; reducir tamaño del botón Sonido en móvil (`text-xs sm:text-sm`, padding compacto) y permitir que el badge de fase salte de línea sin desbordar.
2. **Card de juez (115–135):** OK, ya usa `break-words`. Sin cambios.
3. **Card de peleadores (138–167):** en móvil el grid `1fr_auto_1fr` colapsa a `grid-cols-1`, pero el "VS" queda como fila intermedia ocupando espacio. Cambiar a `md:grid-cols-[1fr_auto_1fr]` (ya lo es) y reducir padding del badge VS a `px-3 py-1` en móvil para compactar.
4. **Menú colapsable de opciones (nuevo bloque):** el chevron y label "Opciones de prueba y configuración" se ven OK en el screenshot. Verificar que en estado abierto el contenido (`MatchConfig`, `AlertTestPanel`, `AlertSettingsPanel`) no desborde — añadir `overflow-hidden` al `Card` y revisar paddings internos.
5. **Card de controles (208–263):** los botones `size="lg"` con `min-h-[48px]` se apilan en `flex-wrap` pero en 360 px caben solo 1–2 por fila y aparecen huecos. Cambiar a `grid grid-cols-1 sm:flex sm:flex-wrap sm:justify-center` para que en móvil los botones ocupen ancho completo (más ergonómico para juez con una mano).
6. **`RoundTracker`:** ya usa `ScrollArea` horizontal — OK. Verificar que en móvil la lista de rounds completados (badges + score + tiempo) no se corte; añadir `min-w-0` y `flex-wrap` si hace falta.
7. **Diálogos (`MatchResultDialog`, `RoundScoreDialog`, `RecordUpdateDialog`):** revisar que en 360 px no excedan viewport — confirmar uso de `max-w-[calc(100vw-2rem)]` y `max-h-[90dvh] overflow-y-auto`. Si falta, agregarlo.
8. **Altura raíz:** `TimeMasterLayout` y página deberían usar `min-h-dvh` no `min-h-screen` (mejor en móviles con barra dinámica). Revisar y migrar si aplica.

## Fuera de alcance
- Lógica de cronómetro, hooks, persistencia, sonidos.
- Cambios de copy o tokens de color.
- Funcionalidad de declarar resultado / firma del juez.

## Verificación
Tras editar, abriré el preview en 390×844 (vista móvil) y tomaré screenshot para confirmar:
- Nombres completos visibles bajo el timer en dos columnas.
- Sin scroll horizontal en ninguna sección.
- Botones de control accesibles (≥48px alto, ancho cómodo).
