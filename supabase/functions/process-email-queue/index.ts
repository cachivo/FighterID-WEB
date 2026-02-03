import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import { sendEmailWithFallback, getEmailFrom } from "../_shared/email-config.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 100;
const RATE_LIMIT_DELAY = 600; // 600ms between emails

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sendEmailWithRetry(
  resend: Resend,
  emailData: any,
  maxRetries = 3
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendEmailWithFallback(resend, emailData);
    } catch (error: any) {
      if (error.statusCode === 429 && attempt < maxRetries) {
        const backoffDelay = 1000 * attempt;
        console.log(`[RETRY] Rate limit hit, waiting ${backoffDelay}ms (attempt ${attempt}/${maxRetries})`);
        await delay(backoffDelay);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log("[QUEUE] Processing email queue for date:", today);

    // 1. Get or create daily usage
    const { data: usageData } = await supabase
      .rpc('get_or_create_daily_usage', { target_date: today });
    
    const emailsSentToday = usageData?.emails_sent || 0;
    const remaining = DAILY_LIMIT - emailsSentToday;

    console.log(`[QUEUE] Daily usage: ${emailsSentToday}/${DAILY_LIMIT}, remaining: ${remaining}`);

    if (remaining <= 0) {
      console.log("[QUEUE] Daily quota exhausted, skipping");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Daily quota exhausted",
          emails_sent_today: emailsSentToday,
          processed: 0
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Get pending emails scheduled for today or earlier
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', today)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(remaining);

    if (fetchError) {
      throw new Error(`Error fetching queue: ${fetchError.message}`);
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("[QUEUE] No pending emails to process");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending emails",
          emails_sent_today: emailsSentToday,
          processed: 0
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[QUEUE] Processing ${pendingEmails.length} emails`);

    const results = { success: 0, failed: 0 };
    const emailFrom = getEmailFrom();

    // 3. Process each email
    for (let i = 0; i < pendingEmails.length; i++) {
      const email = pendingEmails[i];
      
      try {
        const result = await sendEmailWithRetry(resend, {
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_content,
          from: emailFrom,
        });

        const resendId = result?.data?.id || null;

        // Update queue item as sent
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            resend_id: resendId
          })
          .eq('id', email.id);

        // Also record in email_sends if campaign_id exists
        if (email.campaign_id) {
          await supabase.from('email_sends').insert({
            campaign_id: email.campaign_id,
            recipient_email: email.recipient_email,
            status: 'sent',
            resend_id: resendId
          });
        }

        results.success++;
        console.log(`[QUEUE] Sent ${i + 1}/${pendingEmails.length}: ${email.recipient_email}`);

      } catch (error: any) {
        results.failed++;
        const errorMessage = error.message || 'Unknown error';

        // Update queue item as failed
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: errorMessage
          })
          .eq('id', email.id);

        // Also record in email_sends if campaign_id exists
        if (email.campaign_id) {
          await supabase.from('email_sends').insert({
            campaign_id: email.campaign_id,
            recipient_email: email.recipient_email,
            status: 'failed',
            error_message: errorMessage
          });
        }

        console.error(`[QUEUE] Failed ${email.recipient_email}:`, errorMessage);
      }

      // Rate limiting delay
      if (i < pendingEmails.length - 1) {
        await delay(RATE_LIMIT_DELAY);
      }
    }

    // 4. Update daily usage counter
    if (results.success > 0) {
      await supabase.rpc('increment_daily_email_count', {
        target_date: today,
        increment_by: results.success
      });
    }

    console.log(`[QUEUE] Completed. Success: ${results.success}, Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.success + results.failed,
        sent: results.success,
        failed: results.failed,
        emails_sent_today: emailsSentToday + results.success
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[QUEUE] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
