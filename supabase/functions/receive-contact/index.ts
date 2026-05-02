import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "npm:resend@2.0.0";

import { buildCorsHeaders } from "../_shared/cors.ts";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// corsHeaders is now computed per-request via buildCorsHeaders(req)

interface ContactRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactRequest = await req.json();

    console.log(`[CONTACT] Received from: ${email}`);

    // Validar datos
    if (!name || !email || !message) {
      throw new Error("Nombre, email y mensaje son requeridos");
    }

    // Guardar en base de datos
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: savedMessage, error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        subject: subject || 'Mensaje de contacto',
        message,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('[CONTACT] DB Error:', dbError);
      throw dbError;
    }

    console.log(`[CONTACT] Saved to DB with ID: ${savedMessage.id}`);

    // Enviar notificación a admin
    const emailResult = await resend.emails.send({
      from: "Fighter ID <notifications@fighter-id.org>",
      to: ["admin@fighter-id.org"],
      subject: `🔔 Nuevo mensaje de contacto: ${subject || 'Sin asunto'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e63946; border-bottom: 2px solid #e63946; padding-bottom: 10px;">
            Nuevo mensaje de contacto
          </h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>De:</strong> ${name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 5px 0;"><strong>Asunto:</strong> ${subject || 'Sin asunto'}</p>
          </div>
          <div style="background: white; padding: 20px; border-left: 4px solid #e63946; margin: 20px 0;">
            <h3 style="margin-top: 0;">Mensaje:</h3>
            <p style="white-space: pre-wrap; color: #333;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <em>Recibido el ${new Date().toLocaleString('es-ES')}</em><br>
            ID del mensaje: ${savedMessage.id}
          </p>
        </div>
      `,
    });

    console.log(`[CONTACT] Email sent:`, emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mensaje enviado exitosamente",
        id: savedMessage.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[CONTACT] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error al procesar el mensaje"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
