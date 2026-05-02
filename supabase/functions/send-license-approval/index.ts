import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import { sendEmailWithFallback, EmailTemplates, getEmailFrom } from "../_shared/email-config.ts";

import { buildCorsHeaders } from "../_shared/cors.ts";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// corsHeaders is now computed per-request via buildCorsHeaders(req)

interface LicenseApprovalRequest {
  license_id: string;
  fighter_email: string;
  fighter_name: string;
  license_number: string;
  license_level: string;
  expires_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[LICENSE APPROVAL] Request received");

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("No authorization header");
    }

    // Create client with user's auth context for RLS/auth.uid() to work
    const supabaseWithAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Verify JWT and get claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseWithAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("[LICENSE APPROVAL] JWT validation failed:", claimsError);
      throw new Error("Unauthorized");
    }

    const userId = claimsData.claims.sub;
    console.log("[LICENSE APPROVAL] Authenticated user:", userId);

    // Check admin status using unified role system (now auth.uid() will work)
    const { data: isAdminResult, error: adminError } = await supabaseWithAuth.rpc('is_admin');
    
    if (adminError || !isAdminResult) {
      console.error("[LICENSE APPROVAL] Admin check failed:", adminError, "Result:", isAdminResult);
      throw new Error("Only admins can trigger license approval notifications");
    }
    
    // Use service role client for sending emails (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: LicenseApprovalRequest = await req.json();
    console.log("[LICENSE APPROVAL] Sending notification for license:", requestData.license_number);

    // Validate required fields
    if (!requestData.fighter_email || !requestData.fighter_name || !requestData.license_number) {
      throw new Error("Missing required fields: fighter_email, fighter_name, or license_number");
    }

    // Format expiration date
    const expiresDate = new Date(requestData.expires_at);
    const formattedExpires = expiresDate.toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate QR verification URL
    const verificationUrl = `${Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '') || 'https://fighter-id.org'}/verify-license?id=${requestData.license_id}`;

    const emailContent = `
      <h2>¡Felicidades ${requestData.fighter_name}!</h2>
      
      <p>Tu licencia de peleador ha sido <strong style="color: #28a745;">APROBADA</strong> exitosamente.</p>
      
      <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 15px 0; color: #155724;">Detalles de tu Licencia</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 500;">Número de Licencia:</td>
            <td style="padding: 8px 0;"><strong>${requestData.license_number}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 500;">Nivel:</td>
            <td style="padding: 8px 0;">${requestData.license_level || 'AMATEUR'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 500;">Fecha de Expiración:</td>
            <td style="padding: 8px 0;">${formattedExpires}</td>
          </tr>
        </table>
      </div>
      
      <p>Tu licencia digital ya está disponible en tu perfil. Puedes acceder a ella en cualquier momento desde tu panel de Fighter ID.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://fighter-id.org/fighter-license" class="button">
          Ver Mi Licencia Digital
        </a>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0;">📱 Código QR de Verificación</h3>
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
          Tu licencia incluye un código QR único para verificación instantánea. Cualquier promotor o juez puede escanear este código para verificar la autenticidad de tu licencia.
        </p>
        <p style="margin: 0; font-size: 14px;">
          <a href="${verificationUrl}" style="color: #0066cc;">Enlace de verificación</a>
        </p>
      </div>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
          <li>Mantén tu certificación médica actualizada</li>
          <li>Completa los tests de dopaje requeridos</li>
          <li>Renueva tu licencia antes de la fecha de expiración</li>
          <li>Reporta cualquier cambio en tu información de contacto</li>
        </ul>
      </div>
      
      <p>Si tienes alguna pregunta sobre tu licencia, no dudes en contactar con el equipo de Fighter ID.</p>
    `;

    const emailResult = await sendEmailWithFallback(resend, {
      to: requestData.fighter_email,
      subject: `✅ Licencia Aprobada - ${requestData.license_number}`,
      html: EmailTemplates.wrap(emailContent),
      from: getEmailFrom(),
    });

    console.log("[LICENSE APPROVAL] Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "License approval notification sent successfully",
        email_id: emailResult.data?.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[LICENSE APPROVAL] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: error.message.includes("Unauthorized") ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
