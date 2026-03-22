

# Panel de Métricas en Tiempo Real — Vision Engine

## Objetivo

Agregar un panel compacto dentro de cada `FightCard` en `LiveEventsControl.tsx` que muestre las métricas del motor de visión en tiempo real: FPS, latencia, personas detectadas y estado de conexión.

## Cambios

### 1. Nuevo componente: `VisionMetricsPanel`

Archivo: `src/components/admin/VisionMetricsPanel.tsx`

Panel compacto que usa `useVisionEngineStatus(fightId)` y muestra:
- **Estado**: 🟢 Conectado / 🔴 Desconectado con `deviceId`
- **FPS**: Gauge visual con color (verde >20, amarillo >10, rojo <10)
- **Latencia**: Valor en ms con indicador de calidad
- **Personas detectadas**: Contador con icono
- **Último heartbeat**: Tiempo relativo ("hace 3s")

Layout: Una fila horizontal de 4 mini-cards dentro de un contenedor con borde `border-dashed` similar al panel de simulación en VisionDiagnostics.

### 2. Integrar en `LiveEventsControl.tsx`

Dentro del `FightCard`, después del `RoundControlPanel` (línea 185), montar `<VisionMetricsPanel fightId={fight.id} />`. Se muestra siempre — el componente mismo indica "Sin motor conectado" cuando no hay sesión activa.

### 3. Extender `useVisionEngineStatus` — agregar `latencyMs`

El hook ya devuelve `fps` y `personsDetected` del metadata. Falta extraer `latency_ms` del mismo objeto metadata y exponerlo como `latencyMs`.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/VisionMetricsPanel.tsx` | Nuevo componente |
| `src/pages/admin/LiveEventsControl.tsx` | Importar y montar el panel en FightCard |
| `src/hooks/useVisionEngineStatus.ts` | Agregar `latencyMs` al return |

