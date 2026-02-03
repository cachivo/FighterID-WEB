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

interface MassEmailRequest {
  subject: string;
  html_content: string;
  recipient_filter?: 'all' | 'fighters_only' | 'admins_only' | 'custom';
  custom_emails?: string[];
  test_mode?: boolean;
  test_email?: string;
  priority?: number; // 1-10, lower = higher priority
}

const DAILY_LIMIT = 100;
const RATE_LIMIT_DELAY = 600;

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

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[MASS EMAIL] Request received");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });
    
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[MASS EMAIL] Auth error:", userError);
      throw new Error("Unauthorized");
    }

    console.log("[MASS EMAIL] User authenticated:", user.id);

    const { data: isAdminResult, error: adminError } = await supabaseAuth.rpc('is_admin');

    if (adminError || !isAdminResult) {
      console.error("[MASS EMAIL] Admin check failed:", adminError);
      throw new Error("Only admins can send mass emails");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const requestData: MassEmailRequest = await req.json();
    
    console.log("[MASS EMAIL] Request data:", {
      subject: requestData.subject,
      filter: requestData.recipient_filter,
      test_mode: requestData.test_mode
    });

    if (!requestData.subject || !requestData.html_content) {
      throw new Error("Subject and html_content are required");
    }

    const priority = requestData.priority || 5;
    const today = new Date().toISOString().split('T')[0];

    // TEST MODE: Send immediately without queue
    if (requestData.test_mode && requestData.test_email) {
      console.log("[MASS EMAIL] Test mode - sending directly to:", requestData.test_email);
      
      const emailFrom = getEmailFrom();
      const result = await sendEmailWithRetry(resend, {
        to: requestData.test_email,
        subject: requestData.subject,
        html: requestData.html_content,
        from: emailFrom,
      });

      return new Response(
        JSON.stringify({
          success: true,
          test_mode: true,
          message: `Test email sent to ${requestData.test_email}`
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // PRODUCTION MODE: Use queue system
    let recipients: string[] = [];

    if (requestData.recipient_filter === 'custom' && requestData.custom_emails) {
      recipients = requestData.custom_emails;
      console.log("[MASS EMAIL] Custom recipients:", recipients.length);
    } else {
      let query = supabase.from('app_user').select('email');

      switch (requestData.recipient_filter) {
        case 'fighters_only':
          query = supabase
            .from('app_user')
            .select('email, fighter_profiles!inner(active)')
            .eq('fighter_profiles.active', true);
          break;
        
        case 'admins_only':
          query = query.eq('is_admin', true);
          break;
        
        case 'all':
        default:
          break;
      }

      const { data: users, error: usersError } = await query;

      if (usersError) {
        throw new Error(`Error fetching recipients: ${usersError.message}`);
      }

      recipients = users
        ?.map(u => u.email)
        .filter((email): email is string => !!email) || [];

      console.log("[MASS EMAIL] Recipients found:", recipients.length);
    }

    if (recipients.length === 0) {
      throw new Error("No recipients found");
    }

    // Create campaign record
    const { data: campaignRecord, error: campaignError } = await supabase
      .from('email_campaign_log')
      .insert({
        sent_by: user.id,
        subject: requestData.subject,
        html_content: requestData.html_content,
        recipient_filter: requestData.recipient_filter || 'all',
        total_sent: 0,
        total_failed: 0,
        test_mode: false
      })
      .select('id')
      .single();

    if (campaignError || !campaignRecord) {
      console.error("[MASS EMAIL] Error creating campaign record:", campaignError);
      throw new Error(`Error creating campaign record: ${campaignError?.message}`);
    }

    const campaignId = campaignRecord.id;
    console.log("[MASS EMAIL] Campaign record created:", campaignId);

    // Get current daily usage
    const { data: usageData } = await supabase
      .rpc('get_or_create_daily_usage', { target_date: today });
    
    const emailsSentToday = usageData?.emails_sent || 0;
    let availableToday = DAILY_LIMIT - emailsSentToday;

    console.log(`[MASS EMAIL] Daily quota: ${emailsSentToday}/${DAILY_LIMIT}, available: ${availableToday}`);

    // Distribute emails across days
    const emailFrom = getEmailFrom();
    const distribution: Record<string, number> = {};
    const queueItems: any[] = [];
    const immediateEmails: string[] = [];

    let currentDayOffset = 0;
    let slotsUsedToday = 0;

    for (const email of recipients) {
      if (availableToday > 0 && slotsUsedToday < availableToday) {
        // Send today immediately
        immediateEmails.push(email);
        slotsUsedToday++;
        distribution[today] = (distribution[today] || 0) + 1;
      } else {
        // Queue for future days
        if (slotsUsedToday >= availableToday) {
          currentDayOffset++;
          slotsUsedToday = 0;
          availableToday = DAILY_LIMIT;
        }
        
        const scheduledDate = addDays(new Date(), currentDayOffset);
        queueItems.push({
          recipient_email: email,
          subject: requestData.subject,
          html_content: requestData.html_content,
          campaign_id: campaignId,
          scheduled_for: scheduledDate,
          status: 'pending',
          priority: priority
        });
        
        distribution[scheduledDate] = (distribution[scheduledDate] || 0) + 1;
        slotsUsedToday++;
      }
    }

    // Insert queued items
    if (queueItems.length > 0) {
      const { error: queueError } = await supabase
        .from('email_queue')
        .insert(queueItems);

      if (queueError) {
        console.error("[MASS EMAIL] Error inserting queue items:", queueError);
      } else {
        console.log(`[MASS EMAIL] Queued ${queueItems.length} emails for future delivery`);
      }
    }

    // Send immediate emails
    const results = { success: 0, failed: 0, errors: [] as any[] };

    if (immediateEmails.length > 0) {
      console.log(`[MASS EMAIL] Sending ${immediateEmails.length} emails immediately`);

      for (let i = 0; i < immediateEmails.length; i++) {
        const email = immediateEmails[i];
        
        try {
          const result = await sendEmailWithRetry(resend, {
            to: email,
            subject: requestData.subject,
            html: requestData.html_content,
            from: emailFrom,
          });
          
          results.success++;
          
          const resendId = result?.data?.id || null;
          await supabase.from('email_sends').insert({
            campaign_id: campaignId,
            recipient_email: email,
            status: 'sent',
            resend_id: resendId
          });

        } catch (error: any) {
          results.failed++;
          const errorMessage = error.message || 'Unknown error';
          results.errors.push({ email, message: errorMessage });
          
          await supabase.from('email_sends').insert({
            campaign_id: campaignId,
            recipient_email: email,
            status: 'failed',
            error_message: errorMessage
          });
          
          console.error(`[ERROR] Failed to send to ${email}:`, errorMessage);
        }
        
        if (i < immediateEmails.length - 1) {
          await delay(RATE_LIMIT_DELAY);
        }
      }

      // Update daily counter
      if (results.success > 0) {
        await supabase.rpc('increment_daily_email_count', {
          target_date: today,
          increment_by: results.success
        });
      }
    }

    // Update campaign totals
    await supabase
      .from('email_campaign_log')
      .update({
        total_sent: results.success,
        total_failed: results.failed,
        metadata: {
          total_recipients: recipients.length,
          queued_count: queueItems.length,
          distribution: distribution,
          errors_sample: results.errors.slice(0, 10)
        }
      })
      .eq('id', campaignId);

    console.log("[MASS EMAIL] Completed:", {
      sent_today: results.success,
      failed_today: results.failed,
      queued: queueItems.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaignId,
        summary: {
          total_recipients: recipients.length,
          sent_today: results.success,
          failed_today: results.failed,
          queued_for_later: queueItems.length,
          distribution: distribution
        },
        message: queueItems.length > 0
          ? `${results.success} emails enviados hoy. ${queueItems.length} programados para los próximos días.`
          : `${results.success} emails enviados exitosamente.`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[MASS EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.message.includes("Unauthorized") ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
