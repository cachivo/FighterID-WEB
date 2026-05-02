## Pase 2 — Corrección de hallazgos Críticos y Altos

Objetivo: cerrar los 1 crítico + 25 altos detectados por `bug_hunter.py` sin romper funcionalidades. Cambios quirúrgicos, reversibles, con verificación post-cambio.

---

### 1. Crítico — `.env` rastreado en git

- Crear `scripts/untrack-env.sh` documentando el comando que el usuario debe correr local: `git rm --cached .env && git commit -m "chore: untrack .env"`.
- Confirmar que `.env` ya esté listado en `.gitignore` (añadirlo si falta).
- Rotar la clave: la `SUPABASE_PUBLISHABLE_KEY` actual es la **anon/publishable**, segura para frontend (ya se usa con prefijo `VITE_`). No requiere rotación. Documentarlo en `SECURITY_FIGHTER_DATA.md` para evitar falsa alarma futura.
- Acción real: **mantener `.env` (Lovable lo regenera)** + añadir nota en `.gitignore` y en README sobre por qué la anon key es pública.

### 2. Alto — CORS wildcard en 17 edge functions

Estrategia: helper compartido `supabase/functions/_shared/cors.ts` que devuelve cabeceras CORS basadas en una **allowlist** de orígenes:

```
https://fighter-id.org
https://fighterid.lovable.app
https://id-preview--c4add1c8-f68d-4715-9b10-5a9613b9085b.lovable.app
http://localhost:5173, http://localhost:8080  (dev)
```

Comportamiento:
- Lee `Origin` del request, lo compara con la allowlist, devuelve ese origen exacto en `Access-Control-Allow-Origin` (no `*`).
- Si el origen no está permitido → responde 403 en preflight.
- **Excepciones que deben mantener `*`** (webhooks/integraciones server-to-server sin origin de browser):
  - `ai-strike-ingest` (motor IA externo)
  - `bet-delay-processor` (cron)
  - `finalize-fight-auto` (cron/trigger)
  - `process-email-queue` (cron)
  - `vision-start-session` `/telemetry` endpoint (motor IA externo)
  
  Estas mantienen `*` pero se documentan como intencionales en `SECURITY_FIGHTER_DATA.md` y se ignoran en el security memory.

Edge functions a refactorizar al helper (12):
`admin-ai-assistant`, `check-email-exists`, `delete-user`, `fetch-link-metadata`, `fetch-sports-news`, `notify-admin-pending`, `populate-batalla-gimnasios`, `publish-news-to-social`, `receive-contact`, `remove-image-background`, `send-fighter-invitation`, `send-gym-invitation`, `send-license-approval`, `send-mass-email`, `send-password-recovery`, `send-signup-confirmation`, `ai-strike-test-simulator`.

Patrón aplicado a cada función:
```ts
import { buildCorsHeaders } from "../_shared/cors.ts";
const corsHeaders = buildCorsHeaders(req);
if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
```

### 3. Alto — React/TS patches del dry-run (6 archivos)

Aplicar manualmente con tipos correctos (no `unknown`):
- `src/components/EventImporter.tsx` — tipar `useState` con interfaz local del payload importado.
- `src/components/FighterIDModal.tsx` — tipar `useState` con `FighterProfile | null`.
- `src/pages/EventDetail.tsx` — tipar `useState` con tipo del evento de `useEvents`.
- `src/system/events/event.logger.ts` — anotar return `Promise<void>` y envolver en try/catch silencioso.
- `src/system/rag/retrieval.service.ts` — anotar return `Promise<void>` y propagar errores tipados.
- `src/system/session/session.service.ts` — anotar return `Promise<void>` con manejo idempotente.

### 4. Verificación

- Re-ejecutar `python3 scripts/bug_hunter.py` y confirmar:
  - Críticos: 0
  - Altos de seguridad CORS: solo los 5 webhooks documentados como intencionales.
- Ejecutar `bunx vitest run` (tests existentes no deben regresionar).
- Probar smoke vía `supabase--curl_edge_functions` en una función refactorizada (`receive-contact` con `OPTIONS`).
- Actualizar security memory con la decisión sobre los 5 webhooks que mantienen `*`.

### 5. Documentación

- Actualizar `CHANGELOG.md` con sección "Security hardening — CORS allowlist + dry-run patches applied".
- Actualizar `SECURITY_FIGHTER_DATA.md` con:
  - Allowlist de orígenes
  - Lista de funciones server-to-server que conservan `*` y por qué
  - Aclaración: anon key (publishable) es pública por diseño.
- Regenerar `bug_report.md` post-fix.

### Detalles técnicos

```text
supabase/functions/
├── _shared/
│   └── cors.ts          ← NUEVO helper allowlist
├── admin-ai-assistant/  ← refactor
├── ...                  ← 16 más refactor
└── ai-strike-ingest/    ← se mantiene * (documentado)
```

`_shared/cors.ts` (interfaz):
```ts
export const ALLOWED_ORIGINS = [...];
export function buildCorsHeaders(req: Request): Record<string,string>;
export function isAllowedOrigin(origin: string | null): boolean;
```

### No tocar en este pase

- 493 medianos (TypeScript `any`, useEffect deps menores) → próximo pase.
- 269 a11y (alt, aria) → pase dedicado de accesibilidad.
- Logic (78) → revisar caso por caso, no en bulk.
