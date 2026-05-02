// Shared CORS helper with origin allowlist.
// Returns echoed origin only when it matches the allowlist; otherwise blocks.
//
// Use buildCorsHeaders(req) in browser-facing edge functions.
// Server-to-server / webhook functions (cron, external IA engine) should NOT
// use this helper and may keep `Access-Control-Allow-Origin: *` — those cases
// are documented in SECURITY_FIGHTER_DATA.md.

export const ALLOWED_ORIGINS: ReadonlyArray<string> = [
  "https://fighter-id.org",
  "https://www.fighter-id.org",
  "https://fighterid.lovable.app",
  "https://id-preview--c4add1c8-f68d-4715-9b10-5a9613b9085b.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
];

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = isAllowedOrigin(origin);
  return {
    ...BASE_HEADERS,
    // Echo only allowed origins. For disallowed origins we still return headers
    // but with the first canonical origin so the response is consistent; the
    // browser will reject because origin doesn't match.
    "Access-Control-Allow-Origin": allowed && origin ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Credentials": allowed ? "true" : "false",
  };
}

/** Convenience: 403 preflight response when origin is not allowed. */
export function preflightDenied(): Response {
  return new Response("Origin not allowed", { status: 403 });
}
