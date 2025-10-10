import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Professional signup confirmation email template
function getSignupEmailHTML(confirmationLink: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirma tu cuenta en Fighter ID</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                🥊 Fighter ID
              </h1>
              <p style="margin: 10px 0 0; color: #e0e0e0; font-size: 14px;">
                Sistema de Licencias Deportivas
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">
                ¡Bienvenido a Fighter ID!
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Gracias por registrarte en Fighter ID. Estás a un paso de acceder a tu cuenta.
              </p>
              
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Para activar tu cuenta, confirma tu correo electrónico haciendo clic en el botón de abajo:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${confirmationLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                      Confirmar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative link -->
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                O copia y pega este enlace en tu navegador:
              </p>
              <p style="margin: 0 0 30px; padding: 12px; background-color: #f9fafb; border-radius: 4px; word-break: break-all; font-size: 13px; color: #4b5563;">
                ${confirmationLink}
              </p>
              
              <!-- Info box -->
              <div style="padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>⏱️ Este enlace es válido por 24 horas.</strong><br>
                  Después de ese tiempo, tendrás que solicitar un nuevo correo de confirmación.
                </p>
              </div>
              
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
              </p>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                <strong>Tu correo:</strong> ${email}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; text-align: center;">
                ¿Necesitas ayuda? Contáctanos en <a href="mailto:soporte@fighter-id.org" style="color: #dc2626; text-decoration: none;">soporte@fighter-id.org</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © 2025 Fighter ID. Todos los derechos reservados.
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function is called by Supabase Auth Hook
    // Parse the webhook payload from Supabase
    const payload = await req.json();
    
    console.log("[SIGNUP] Confirmation email webhook received:", {
      user_id: payload.user?.id,
      email: payload.user?.email?.replace(/(?<=.{2}).(?=.*@)/g, '*'),
      email_action_type: payload.email_data?.email_action_type,
      timestamp: new Date().toISOString()
    });

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
    const siteBase = (Deno.env.get("SITE_URL") || "https://fighter-id.org").replace(/\/$/, "");
    
    // Respect redirect_to from emailData, fallback to /auth
    const redirectTo = emailData.redirect_to || `${siteBase}/auth`;

    const confirmationLink = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=${emailActionType}&redirect_to=${encodeURIComponent(redirectTo)}`;

    console.log("[SIGNUP] Sending confirmation email:", {
      to: user.email.replace(/(?<=.{2}).(?=.*@)/g, '*'),
      redirectTo
    });

    // Send email with Resend
    const emailResult = await resend.emails.send({
      from: Deno.env.get("RESEND_FROM") || "Fighter ID <send@fighter-id.org>",
      to: [user.email],
      subject: "Confirma tu cuenta en Fighter ID",
      html: getSignupEmailHTML(confirmationLink, user.email),
    });

    if (emailResult.error) {
      console.error("[SIGNUP] Error sending email:", emailResult.error);
      throw new Error("Error al enviar el correo de confirmación");
    }

    console.log("[SIGNUP] Email sent successfully:", {
      email: user.email.replace(/(?<=.{2}).(?=.*@)/g, '*'),
      emailId: emailResult.data?.id,
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
