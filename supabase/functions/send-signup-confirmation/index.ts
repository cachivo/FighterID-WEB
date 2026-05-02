import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { sendEmailWithFallback, getEmailFrom } from "../_shared/email-config.ts";

import { buildCorsHeaders } from "../_shared/cors.ts";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// corsHeaders is now computed per-request via buildCorsHeaders(req)

// Mobile-first signup confirmation email - CTA visible without scroll
function getSignupEmailHTML(confirmationLink: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirma tu cuenta en Fighter ID</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .email-container { background-color: #1a1a1a !important; }
      .email-footer { background-color: #2d2d2d !important; }
      .email-footer p { color: #9ca3af !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f5f5f5;">
  <!-- Preheader text for inbox preview -->
  <span style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Toca el botón para activar tu Fighter ID - Solo toma 1 segundo
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
                ¡Activa tu cuenta!
              </p>
              
              <!-- BIG BUTTON - First visible element -->
              <a href="${confirmationLink}" style="display: block; width: 100%; max-width: 280px; margin: 0 auto 16px; padding: 20px 24px; background: #dc2626; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; text-align: center; border: 3px solid #dc2626; box-sizing: border-box;">
                CONFIRMAR MI CUENTA
              </a>
              
              <!-- Immediate fallback link -->
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ¿No funciona? <a href="${confirmationLink}" style="color: #dc2626; font-weight: 600; text-decoration: underline;">Toca aquí</a>
              </p>
            </td>
          </tr>
          
          <!-- Secondary Info - Minimal -->
          <tr>
            <td class="email-footer" style="padding: 16px 20px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-align: center;">
                ⏱️ Este enlace expira en <strong>24 horas</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Si no creaste esta cuenta, ignora este correo.<br>
                Tu email: ${email}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Mobile-first recovery email - CTA visible without scroll
function getRecoveryEmailHTML(resetLink: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablece tu contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f5f5f5;">
  <!-- Preheader -->
  <span style="display: none; max-height: 0; overflow: hidden;">
    Toca el botón para crear tu nueva contraseña
  </span>
  
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" style="width: 100%; max-width: 400px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 20px; text-align: center; background: linear-gradient(135deg, #1a1a1a, #2d2d2d); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 700;">Fighter ID</h1>
            </td>
          </tr>
          
          <!-- CTA FIRST -->
          <tr>
            <td style="padding: 28px 20px 20px; text-align: center;">
              <p style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #1a1a1a;">
                Nueva contraseña
              </p>
              
              <a href="${resetLink}" style="display: block; width: 100%; max-width: 280px; margin: 0 auto 16px; padding: 20px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; text-align: center; border: 3px solid #2563eb;">
                RESTABLECER CONTRASEÑA
              </a>
              
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ¿No funciona? <a href="${resetLink}" style="color: #2563eb; font-weight: 600; text-decoration: underline;">Toca aquí</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 20px; background: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">
                ⏱️ Válido por <strong>1 hora</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Si no solicitaste esto, ignora el correo.<br>
                ${email}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SIGNUP] ===== FUNCTION INVOKED =====");
    console.log("[DEBUG] Request method:", req.method);
    console.log("[DEBUG] Request URL:", req.url);
    
    // This function is called by Supabase Auth Hook
    // Parse the webhook payload from Supabase
    const payload = await req.json();
    
    console.log("[SIGNUP] Confirmation email webhook received:", {
      user_id: payload.user?.id,
      email: payload.user?.email?.replace(/(?<=.{2}).(?=.*@)/g, '*'),
      email_action_type: payload.email_data?.email_action_type,
      timestamp: new Date().toISOString()
    });
    
    console.log("[DEBUG] Full email_action_type value:", payload.email_data?.email_action_type);

    // Extract user and email data
    const user = payload.user;
    const emailData = payload.email_data;

    if (!user || !emailData) {
      console.error("[SIGNUP] Missing user or email_data in webhook payload");
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!supabaseUrl) {
      console.error("[SIGNUP] Missing SUPABASE_URL environment variable");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing SUPABASE_URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!resendApiKey) {
      console.error("[SIGNUP] Missing RESEND_API_KEY environment variable");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing RESEND_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build confirmation link - use redirect_to from emailData if provided
    const tokenHash = emailData.token_hash;
    const emailActionType = emailData.email_action_type;
    
    // Use the redirect_to from email data, or fallback to license/auth
    // This ensures the link works regardless of which domain the user came from
    let redirectTo = emailData.redirect_to;
    
    // If no redirect_to provided, build a default one
    if (!redirectTo) {
      // Try to use SITE_URL, fallback to the Lovable app URL
      const siteBase = Deno.env.get("SITE_URL") || "https://fighterid.lovable.app";
      // Direct to onboarding after email confirmation for better UX
      redirectTo = `${siteBase.replace(/\/$/, "")}/license/onboarding`;
    }

    const confirmationLink = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=${emailActionType}&redirect_to=${encodeURIComponent(redirectTo)}`;

    console.log("[SIGNUP] Sending confirmation email:", {
      to: user.email.replace(/(?<=.{2}).(?=.*@)/g, '*'),
      redirectTo
    });

    // Determine subject and template based on action type
    const isRecovery = String(emailActionType || '').toLowerCase().includes('recovery');
    const subject = isRecovery
      ? 'Restablece tu contraseña en Fighter ID'
      : 'Confirma tu cuenta en Fighter ID';
    const html = isRecovery
      ? getRecoveryEmailHTML(confirmationLink, user.email)
      : getSignupEmailHTML(confirmationLink, user.email);

    // Send email using shared email service with retry logic
    await sendEmailWithFallback(resend, {
      to: user.email,
      subject,
      html,
      from: getEmailFrom(),
    });

    console.log("[SIGNUP] ✓ Email sent successfully:", {
      to: user.email.replace(/(?<=.{2}).(?=.*@)/g, '*'),
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[SIGNUP] Unexpected error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
