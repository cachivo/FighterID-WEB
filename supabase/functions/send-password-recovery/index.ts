import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import { sendEmailWithFallback, getEmailFrom } from "../_shared/email-config.ts";

import { buildCorsHeaders } from "../_shared/cors.ts";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// corsHeaders is now computed per-request via buildCorsHeaders(req)

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, { attempts: number; resetAt: number }>();

interface RecoveryRequest {
  email: string;
  redirectTo?: string;
}

// Intelligent rate limiting
function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitStore.set(key, { attempts: 1, resetAt: now + 5 * 60 * 1000 }); // 5 minutes
    return { allowed: true };
  }

  if (record.attempts >= 3) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.attempts++;
  return { allowed: true };
}

// Mobile-first recovery email - CTA visible without scroll
function getRecoveryEmailHTML(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera tu acceso a Fighter ID</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .email-container { background-color: #1a1a1a !important; }
      .email-footer { background-color: #2d2d2d !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f5f5f5;">
  <!-- Preheader for inbox preview -->
  <span style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Toca el botón para crear tu nueva contraseña - Solo toma 1 segundo
  </span>
  
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" class="email-container" style="width: 100%; max-width: 400px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Compact Header -->
          <tr>
            <td style="padding: 20px 20px 16px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">
                🥊 Fighter ID
              </h1>
            </td>
          </tr>
          
          <!-- CTA FIRST - Primary Action -->
          <tr>
            <td style="padding: 28px 20px 20px; text-align: center;">
              <p style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #1a1a1a;">
                ¿Olvidaste tu contraseña?
              </p>
              
              <!-- BIG BUTTON - First visible element -->
              <a href="${resetLink}" style="display: block; width: 100%; max-width: 280px; margin: 0 auto 16px; padding: 20px 24px; background: #dc2626; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; text-align: center; border: 3px solid #dc2626; box-sizing: border-box;">
                RESTABLECER CONTRASEÑA
              </a>
              
              <!-- Immediate fallback link -->
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ¿No funciona? <a href="${resetLink}" style="color: #dc2626; font-weight: 600; text-decoration: underline;">Toca aquí</a>
              </p>
            </td>
          </tr>
          
          <!-- Secondary Info - Minimal -->
          <tr>
            <td class="email-footer" style="padding: 16px 20px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-align: center;">
                ⏱️ Este enlace expira en <strong>1 hora</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Si no solicitaste este cambio, ignora este correo.<br>
                Tu contraseña no será modificada.
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Help footer outside card -->
        <p style="margin: 20px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
          ¿Problemas? <a href="mailto:soporte@fighter-id.org" style="color: #6b7280;">soporte@fighter-id.org</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: RecoveryRequest = await req.json();
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.log("[RECOVERY] Invalid email format:", { email, ip: clientIp });
      // Always return success to prevent user enumeration
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting by IP + email combination
    const rateLimitKey = `${clientIp}:${email.toLowerCase()}`;
    const rateLimitCheck = checkRateLimit(rateLimitKey);

    if (!rateLimitCheck.allowed) {
      console.log("[RECOVERY] Rate limit exceeded:", { email, ip: clientIp, retryAfter: rateLimitCheck.retryAfter });
      return new Response(
        JSON.stringify({ 
          error: "Demasiados intentos. Por favor, espera antes de intentar nuevamente.",
          retryAfter: rateLimitCheck.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": rateLimitCheck.retryAfter?.toString() || "300"
          } 
        }
      );
    }

    console.log("[RECOVERY] Request received:", { 
      email: email.replace(/(?<=.{2}).(?=.*@)/g, '*'), 
      ip: clientIp,
      timestamp: new Date().toISOString()
    });

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate password recovery link directly
    // Always force redirect to production SITE_URL + the requested path (avoid preview domains)
    const siteBase = (Deno.env.get("SITE_URL") || "https://fighter-id.org").replace(/\/$/, "");
    let finalRedirect = `${siteBase}/auth/reset-password`;
    try {
      if (redirectTo) {
        const u = new URL(redirectTo);
        finalRedirect = `${siteBase}${u.pathname}${u.search}`;
      }
    } catch {}
    
    console.log("[RECOVERY] Generating link with redirect:", {
      receivedRedirectTo: redirectTo,
      finalRedirect,
      siteUrl: siteBase
    });
    
    const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: finalRedirect
      }
    });

    // If user doesn't exist, Supabase returns an error
    // But we still return success to prevent user enumeration
    if (recoveryError || !recoveryData) {
      console.log("[RECOVERY] Recovery link generation failed:", { 
        email: email.replace(/(?<=.{2}).(?=.*@)/g, '*'),
        error: recoveryError?.message || "No data returned"
      });
      
      // Add artificial delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Always return success to prevent user enumeration
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetLink = recoveryData.properties.action_link;

    // Send email using shared email service with retry logic
    await sendEmailWithFallback(resend, {
      to: email,
      subject: "Recupera tu acceso a Fighter ID",
      html: getRecoveryEmailHTML(resetLink),
      from: getEmailFrom(),
    });

    console.log("[RECOVERY] ✓ Email sent successfully:", { 
      email: email.replace(/(?<=.{2}).(?=.*@)/g, '*'),
      timestamp: new Date().toISOString()
    });

    // Always return generic success message
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[RECOVERY] Unexpected error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Generic error response to prevent information leakage
    return new Response(
      JSON.stringify({ 
        error: "Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
