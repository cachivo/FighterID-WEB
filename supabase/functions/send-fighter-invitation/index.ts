import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { sendEmailWithFallback, EmailTemplates, getEmailFrom } from "../_shared/email-config.ts";

import { buildCorsHeaders } from "../_shared/cors.ts";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// corsHeaders is now computed per-request via buildCorsHeaders(req)

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  weightClass?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticación primero
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado - falta token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Crear cliente de Supabase con el JWT del usuario
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Obtener usuario autenticado
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error("Error de autenticación:", authError);
      return new Response(
        JSON.stringify({ error: "No autorizado - usuario inválido" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verificar que sea admin usando RPC function
    console.log('Verificando admin para user:', user.id);
    const { data: isAdmin, error: isAdminError } = await supabaseClient.rpc('is_admin');
    
    if (isAdminError) {
      console.error('Error en is_admin RPC:', isAdminError);
      return new Response(
        JSON.stringify({ error: "Error verificando permisos de administrador" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('isAdmin resultado:', isAdmin);
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Solo administradores pueden enviar invitaciones" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, firstName, lastName, phone, weightClass }: InvitationRequest = await req.json();

    // Generar token único
    const inviteToken = crypto.randomUUID();
    const registrationLink = `${Deno.env.get("SITE_URL") || "https://fighter-id.org"}/license/auth?mode=signup&invite=${inviteToken}`;

    console.log("[INVITATION] Creating invitation for:", email);
    console.info("[INVITATION] Generated link:", registrationLink);

    // Insertar invitación en la base de datos
    const { data: invitation, error: dbError } = await supabaseClient
      .from("fighter_invitations")
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        weight_class: weightClass,
        token: inviteToken,
        invited_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[INVITATION] Error creating invitation:", dbError);
      // Manejar invitación duplicada (email ya tiene una invitación)
      if ((dbError as any).code === '23505') {
        // Buscar invitación existente más reciente para este email
        const { data: existing, error: fetchErr } = await supabaseClient
          .from('fighter_invitations')
          .select('*')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchErr || !existing) {
          console.error("[INVITATION] Failed to fetch existing invitation:", fetchErr);
          return new Response(
            JSON.stringify({ error: "Ya existe una invitación para este email, pero no se pudo recuperar." }),
            { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const now = new Date();
        const exp = existing.expires_at ? new Date(existing.expires_at) : null;
        const isExpired = !exp || exp.getTime() < now.getTime() || existing.status === 'expired';

        let activeInvitation = existing as any;
        let linkToken = existing.token as string;

        if (isExpired || existing.status === 'cancelled') {
          // Renovar token y fecha de expiración; resetear a pendiente
          linkToken = crypto.randomUUID();
          const newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

          const { data: updated, error: updateErr } = await supabaseClient
            .from('fighter_invitations')
            .update({
              token: linkToken,
              status: 'pending',
              expires_at: newExpiresAt,
              accepted_at: null,
              first_name: firstName,
              last_name: lastName,
              phone,
              weight_class: weightClass,
              invited_by: user.id,
            })
            .eq('id', existing.id)
            .select('*')
            .single();

          if (updateErr) {
            console.error("[INVITATION] Failed to refresh existing invitation:", updateErr);
            return new Response(
              JSON.stringify({ error: "No se pudo actualizar la invitación existente." }),
              { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
          activeInvitation = updated!;
        } else if (existing.status === 'accepted') {
          return new Response(
            JSON.stringify({ 
              error: "El usuario ya aceptó la invitación previamente.",
              invitation: existing,
              accepted: true
            }),
            { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const finalRegistrationLink = `${Deno.env.get("SITE_URL") || "https://fighter-id.org"}/license/auth?mode=signup&invite=${linkToken}`;
        console.info("[INVITATION] Resending with link:", finalRegistrationLink);

        // Reenviar correo con el enlace activo (reutilizado o renovado)
        try {
          const emailResult = await sendEmailWithFallback(resend, {
            to: email,
            subject: "🥊 Invitación para registrarte en Fighter ID",
            html: EmailTemplates.wrap(`
          <h2>¡Hola ${firstName} ${lastName}!</h2>
          <p>Ya tienes una invitación activa. Te reenviamos tu enlace para completar el registro:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${finalRegistrationLink}" class="button">
              Completar Registro
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            O copia y pega este enlace en tu navegador:<br>
            <a href="${finalRegistrationLink}" style="color: #0066cc; word-break: break-all;">
              ${finalRegistrationLink}
            </a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            <strong>Nota:</strong> Esta invitación expira en 7 días.
          </p>
        `),
            from: getEmailFrom(),
          });
          console.log("[INVITATION] Email re-sent successfully:", emailResult);
        } catch (emailError: any) {
          console.error("[INVITATION] Failed to re-send invitation email:", emailError);
          // Continuamos para retornar el link aunque falle el correo
        }

        return new Response(
          JSON.stringify({
            success: true,
            invitation: activeInvitation,
            registrationLink: finalRegistrationLink,
            duplicate: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      throw new Error(`Error creando invitación: ${dbError.message}`);
    }

    console.log("[INVITATION] Invitation created:", invitation.id);

    // Send invitation email using centralized email config
    const emailContent = `
      <h2>¡Hola ${firstName} ${lastName}!</h2>
      
      <p>Has sido invitado a unirte a Fighter ID, el sistema oficial de gestión de licencias para peleadores.</p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Detalles de tu invitación:</strong></p>
        <ul style="margin: 10px 0;">
          ${weightClass ? `<li>Categoría de Peso: <strong>${weightClass}</strong></li>` : ''}
          ${phone ? `<li>Teléfono de contacto: ${phone}</li>` : ''}
        </ul>
      </div>
      
      <p>Para completar tu registro y activar tu licencia, haz clic en el siguiente botón:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${registrationLink}" class="button">
          Completar Registro
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        O copia y pega este enlace en tu navegador:<br>
        <a href="${registrationLink}" style="color: #0066cc; word-break: break-all;">
          ${registrationLink}
        </a>
      </p>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        <strong>Nota:</strong> Esta invitación expirará en 7 días.
      </p>
    `;

    try {
      const emailResult = await sendEmailWithFallback(resend, {
        to: email,
        subject: "🥊 Invitación para registrarte en Fighter ID",
        html: EmailTemplates.wrap(emailContent),
        from: getEmailFrom(),
      });

      console.log("[INVITATION] Email sent successfully:", emailResult);
    } catch (emailError: any) {
      console.error("[INVITATION] Failed to send invitation email:", emailError);
      throw new Error(`Failed to send invitation email: ${emailError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation,
        registrationLink,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error en send-fighter-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
