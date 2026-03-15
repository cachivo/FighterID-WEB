import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Interface para eventos del microservicio Python
interface StrikeEvent {
  fightId: string;
  round: number;
  timestamp_ms: number;
  fighter: 'A' | 'B';
  event: 'strike_attempted' | 'strike_connected';
  strike_type: 'jab' | 'cross' | 'hook' | 'uppercut' | 'low_kick' | 'high_kick' | 'body_kick' | 'knee' | 'elbow' | 'other';
  confidence: number;
  model_version: string;
}

interface SessionStart {
  fightId: string;
  source: string;
  fighters: { A: string; B: string };
  model_version: string;
}

interface SessionStop {
  sessionId: string;
  stats?: {
    total_frames: number;
    avg_fps: number;
    avg_latency_ms: number;
  };
}

interface LogEntry {
  sessionId?: string;
  fightId?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: any;
}

interface FightEndRequest {
  fightId: string;
  model_version?: string;
}

// Helper: calcular stats de un peleador desde eventos
function computeFighterStats(events: any[], fighter: string) {
  const fighterEvents = events.filter((e: any) => e.fighter === fighter);
  const attempted = fighterEvents.filter((e: any) => e.event_type === 'strike_attempted').length;
  const connected = fighterEvents.filter((e: any) => e.event_type === 'strike_connected').length;

  const strikeTypes: Record<string, { attempted: number; connected: number }> = {};
  for (const e of fighterEvents) {
    const st = e.strike_type || 'other';
    if (!strikeTypes[st]) strikeTypes[st] = { attempted: 0, connected: 0 };
    if (e.event_type === 'strike_attempted') strikeTypes[st].attempted++;
    if (e.event_type === 'strike_connected') strikeTypes[st].connected++;
  }

  return {
    total_attempted: attempted,
    total_connected: connected,
    accuracy: attempted > 0 ? Math.round((connected / attempted) * 10000) / 100 : 0,
    strike_breakdown: strikeTypes,
    total_events: fighterEvents.length,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // ==========================================
    // POST /ai-strike-ingest/event
    // ==========================================
    if (path === 'event' && req.method === 'POST') {
      const event: StrikeEvent = await req.json();
      
      if (!event.fightId || !event.round || !event.fighter || !event.event || !event.model_version) {
        return new Response(
          JSON.stringify({ error: 'Invalid event format' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (event.confidence < 0 || event.confidence > 1) {
        return new Response(
          JSON.stringify({ error: 'Confidence must be between 0 and 1' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('ai_strike_events')
        .insert({
          fight_id: event.fightId,
          round_number: event.round,
          timestamp_ms: event.timestamp_ms,
          fighter: event.fighter,
          event_type: event.event,
          strike_type: event.strike_type || null,
          confidence: event.confidence,
          model_version: event.model_version,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting strike event:', error);
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, id: data.id }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // POST /ai-strike-ingest/session/start
    // ==========================================
    if (path === 'start' && req.method === 'POST') {
      const session: SessionStart = await req.json();
      
      if (!session.fightId || !session.source || !session.model_version) {
        return new Response(
          JSON.stringify({ error: 'Invalid session start format' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('ai_inference_sessions')
        .insert({
          fight_id: session.fightId,
          source_url: session.source,
          model_version: session.model_version,
          status: 'running',
          metadata: { fighters: session.fighters },
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting session:', error);
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, sessionId: data.id }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // POST /ai-strike-ingest/session/stop
    // ==========================================
    if (path === 'stop' && req.method === 'POST') {
      const stopData: SessionStop = await req.json();
      
      if (!stopData.sessionId) {
        return new Response(
          JSON.stringify({ error: 'Session ID required' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateData: any = {
        status: 'stopped',
        stopped_at: new Date().toISOString(),
      };

      if (stopData.stats) {
        updateData.total_frames_processed = stopData.stats.total_frames;
        updateData.avg_fps = stopData.stats.avg_fps;
        updateData.avg_latency_ms = stopData.stats.avg_latency_ms;
      }

      const { data, error } = await supabase
        .from('ai_inference_sessions')
        .update(updateData)
        .eq('id', stopData.sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error stopping session:', error);
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // POST /ai-strike-ingest/end - Finalizar pelea y calcular stats
    // ==========================================
    if (path === 'end' && req.method === 'POST') {
      const body: FightEndRequest = await req.json();

      if (!body.fightId) {
        return new Response(
          JSON.stringify({ error: 'fightId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Obtener todos los eventos de la pelea
      const { data: allEvents, error: eventsError } = await supabase
        .from('ai_strike_events')
        .select('*')
        .eq('fight_id', body.fightId)
        .order('timestamp_ms', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events for fight end:', eventsError);
        return new Response(
          JSON.stringify({ error: eventsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const events = allEvents || [];
      const fighterAStats = computeFighterStats(events, 'A');
      const fighterBStats = computeFighterStats(events, 'B');

      // Determinar model_version
      const modelVersion = body.model_version || (events.length > 0 ? events[0].model_version : 'unknown');

      // Calcular duración aproximada
      let durationSeconds: number | null = null;
      if (events.length >= 2) {
        const firstMs = events[0].timestamp_ms;
        const lastMs = events[events.length - 1].timestamp_ms;
        durationSeconds = Math.round((lastMs - firstMs) / 1000);
      }

      // Guardar en ai_fight_results (upsert por fight_id único)
      const { data: resultData, error: resultError } = await supabase
        .from('ai_fight_results')
        .upsert({
          fight_id: body.fightId,
          model_version: modelVersion,
          fighter_a_stats: fighterAStats,
          fighter_b_stats: fighterBStats,
          total_events: events.length,
          duration_seconds: durationSeconds,
          metadata: {
            rounds_detected: [...new Set(events.map((e: any) => e.round_number))].sort(),
            computed_at: new Date().toISOString(),
          },
        }, { onConflict: 'fight_id' })
        .select()
        .single();

      if (resultError) {
        console.error('Error saving ai_fight_results:', resultError);
        return new Response(
          JSON.stringify({ error: resultError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Actualizar fights.ai_result
      const aiResultSummary = {
        result_id: resultData.id,
        model_version: modelVersion,
        fighter_a: fighterAStats,
        fighter_b: fighterBStats,
        total_events: events.length,
        computed_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('fights')
        .update({ ai_result: aiResultSummary })
        .eq('id', body.fightId);

      if (updateError) {
        console.error('Error updating fights.ai_result:', updateError);
        // No fallar — el resultado ya se guardó
      }

      console.log('Fight ended, results computed:', resultData.id);
      return new Response(
        JSON.stringify({ success: true, resultId: resultData.id, stats: { fighter_a: fighterAStats, fighter_b: fighterBStats } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // POST /ai-strike-ingest/log
    // ==========================================
    if (path === 'log' && req.method === 'POST') {
      const logEntry: LogEntry = await req.json();
      
      await supabase
        .from('ai_inference_logs')
        .insert({
          session_id: logEntry.sessionId || null,
          fight_id: logEntry.fightId || null,
          level: logEntry.level,
          message: logEntry.message,
          metadata: logEntry.metadata || {},
        });

      return new Response(
        JSON.stringify({ success: true }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET /ai-strike-ingest/health
    // ==========================================
    if (path === 'health' && req.method === 'GET') {
      return new Response(
        JSON.stringify({ status: 'ok', version: '2.1', timestamp: new Date().toISOString() }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET /ai-strike-ingest/metrics
    // ==========================================
    if (path === 'metrics' && req.method === 'GET') {
      const { data: sessions, error } = await supabase
        .from('ai_inference_sessions')
        .select('*')
        .eq('status', 'running')
        .order('started_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ active_sessions: sessions?.length || 0, sessions: sessions || [] }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ruta no encontrada
    return new Response(
      JSON.stringify({ 
        error: 'Not found', 
        availableEndpoints: [
          'POST /event - Recibir evento de golpe',
          'POST /start - Iniciar sesión de inferencia',
          'POST /stop - Detener sesión',
          'POST /end - Finalizar pelea y calcular stats',
          'POST /log - Registrar log',
          'GET /health - Health check',
          'GET /metrics - Métricas de sesiones activas',
        ]
      }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
