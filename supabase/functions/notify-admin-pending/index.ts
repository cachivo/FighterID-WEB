import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { sendEmailWithFallback, EmailTemplates } from "../_shared/email-config.ts";

import { buildCorsHeaders } from "../_shared/cors.ts";
// corsHeaders is now computed per-request via buildCorsHeaders(req)

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { entity_type, entity_id, actor_name } = await req.json();

    console.log(`[NOTIFICATION] New pending ${entity_type}: ${entity_id}`);

    // Get all active admins
    const { data: admins, error: adminError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        app_user!inner(
          email,
          first_name,
          last_name
        )
      `)
      .eq('role', 'admin');

    if (adminError) {
      console.error('[ERROR] Failed to fetch admins:', adminError);
      throw adminError;
    }

    console.log(`[INFO] Found ${admins?.length || 0} admins to notify`);

    // Send email notifications to all admins
    const emailResults = [];
    for (const admin of admins || []) {
      try {
        const emailHtml = EmailTemplates.wrap(`
          <h2 style="color: #1a1a1a; margin-bottom: 16px;">Hola ${admin.app_user.first_name},</h2>
          <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 20px;">
            <strong>${actor_name}</strong> ha enviado una nueva <strong>${entity_type}</strong> que requiere tu revisión.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://fighter-id.org/admin/pending-changes" 
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
              Revisar Ahora →
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            <strong>Tipo:</strong> ${entity_type}<br>
            <strong>ID:</strong> ${entity_id}<br>
            <strong>Solicitante:</strong> ${actor_name}
          </p>
        `);

        await sendEmailWithFallback(resend, {
          to: admin.app_user.email,
          subject: `🔔 Nueva ${entity_type} pendiente de revisión`,
          html: emailHtml
        });

        console.log(`[SUCCESS] Email sent to ${admin.app_user.email}`);
        emailResults.push({ email: admin.app_user.email, status: 'sent' });
      } catch (emailError: any) {
        console.error(`[ERROR] Failed to send email to ${admin.app_user.email}:`, emailError);
        emailResults.push({ email: admin.app_user.email, status: 'failed', error: emailError.message });
      }
    }

    // Broadcast via Supabase Realtime
    await supabase
      .from('audit_log')
      .insert({
        entity_type: 'notification',
        entity_id: entity_id,
        action: 'ADMIN_NOTIFIED',
        metadata: {
          notification_type: entity_type,
          recipients: admins?.length || 0
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notified ${admins?.length || 0} admins`,
        entity_type,
        entity_id,
        email_results: emailResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[ERROR]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
