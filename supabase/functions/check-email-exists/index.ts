import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders } from "../_shared/cors.ts";
// corsHeaders is now computed per-request via buildCorsHeaders(req)

// Simple in-memory rate limiting (per cold-start instance)
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("cf-connecting-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use raw SQL via admin client to check auth.users efficiently
    const { data, error } = await supabaseAdmin.rpc("check_email_exists_fn", {
      p_email: email.toLowerCase().trim(),
    });

    if (error) {
      // Fallback: try signInWithOtp dry-run approach won't work either
      // Use admin listUsers with a small page - iterate if needed
      console.warn("RPC fallback, trying admin API:", error.message);
      
      // Admin API approach - filter by email
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 50,
      });

      if (listError) {
        console.error("Admin listUsers error:", listError);
        return new Response(
          JSON.stringify({ exists: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();
      const exists = listData.users.some(
        (u) => u.email?.toLowerCase() === normalizedEmail
      );

      return new Response(
        JSON.stringify({ exists }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ exists: !!data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
