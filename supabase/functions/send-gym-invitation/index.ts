import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { sendEmailWithFallback, EmailTemplates, getEmailFrom } from "../_shared/email-config.ts";

import { buildCorsHeaders } from "../_shared/cors.ts";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// corsHeaders is now computed per-request via buildCorsHeaders(req)

interface GymInvitationRequest {
  gymId: string;
  email: string;
  coachName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado - falta token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader } },
      }
    );

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "No autorizado - usuario inválido" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify admin
    const { data: isAdmin } = await supabaseClient.rpc('is_admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Solo administradores pueden enviar invitaciones" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { gymId, email, coachName }: GymInvitationRequest = await req.json();

    if (!gymId || !email) {
      return new Response(
        JSON.stringify({ error: "gymId y email son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify gym exists
    const { data: gym, error: gymError } = await supabaseClient
      .from("gyms")
      .select("id, nombre")
      .eq("id", gymId)
      .single();

    if (gymError || !gym) {
      return new Response(
        JSON.stringify({ error: "Gimnasio no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const inviteToken = crypto.randomUUID();
    const siteUrl = Deno.env.get("SITE_URL") || "https://fighterid.lovable.app";
    const registrationLink = `${siteUrl}/auth?role=gym&invite_gym=${inviteToken}`;

    console.log("[GYM-INVITATION] Creating invitation for:", email, "gym:", gym.nombre);

    // Check for existing invitation
    const { data: existing } = await supabaseClient
      .from("gym_invitations")
      .select("*")
      .eq("gym_id", gymId)
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let activeInvitation: any;
    let linkToken = inviteToken;

    if (existing) {
      if (existing.status === 'accepted') {
        return new Response(
          JSON.stringify({ error: "Este email ya aceptó la invitación para este gimnasio.", accepted: true }),
          { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Refresh existing invitation
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      linkToken = crypto.randomUUID();

      const { data: updated, error: updateErr } = await supabaseClient
        .from("gym_invitations")
        .update({
          token: linkToken,
          status: "pending",
          expires_at: newExpiresAt,
          accepted_at: null,
          coach_name: coachName || existing.coach_name,
          invited_by: user.id,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateErr) {
        throw new Error(`Error actualizando invitación: ${updateErr.message}`);
      }
      activeInvitation = updated;
    } else {
      // Create new invitation
      const { data: invitation, error: dbError } = await supabaseClient
        .from("gym_invitations")
        .insert({
          gym_id: gymId,
          email,
          coach_name: coachName,
          token: inviteToken,
          invited_by: user.id,
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Error creando invitación: ${dbError.message}`);
      }
      activeInvitation = invitation;
      linkToken = inviteToken;
    }

    const finalLink = `${siteUrl}/auth?role=gym&invite_gym=${linkToken}`;
    const displayName = coachName || "Entrenador";

    // Send email
    const emailContent = `
      <h2>¡Hola ${displayName}!</h2>
      
      <p>Has sido invitado como <strong>Entrenador Principal</strong> del gimnasio <strong>${gym.nombre}</strong> en Fighter ID.</p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Gimnasio:</strong> ${gym.nombre}</p>
        <p style="margin: 5px 0 0 0;"><strong>Rol:</strong> Entrenador Principal (Owner)</p>
      </div>
      
      <p>Para acceder a tu panel de gimnasio, haz clic en el siguiente botón:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${finalLink}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Acceder a mi Gimnasio
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        O copia y pega este enlace en tu navegador:<br>
        <a href="${finalLink}" style="color: #667eea; word-break: break-all;">
          ${finalLink}
        </a>
      </p>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        <strong>Nota:</strong> Esta invitación expira en 7 días.
      </p>
    `;

    try {
      await sendEmailWithFallback(resend, {
        to: email,
        subject: `🏋️ Invitación — ${gym.nombre} en Fighter ID`,
        html: EmailTemplates.wrap(emailContent),
        from: getEmailFrom(),
      });
      console.log("[GYM-INVITATION] Email sent successfully to:", email);
    } catch (emailError: any) {
      console.error("[GYM-INVITATION] Failed to send email:", emailError);
      // Still return success since invitation was created
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation: activeInvitation,
        registrationLink: finalLink,
        duplicate: !!existing,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[GYM-INVITATION] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
