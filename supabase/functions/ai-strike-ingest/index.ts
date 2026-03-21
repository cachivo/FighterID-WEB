import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Helpers ──────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function computeFighterStats(events: any[], fighter: string) {
  const fe = events.filter((e: any) => e.fighter === fighter);
  const attempted = fe.filter((e: any) => e.event_type === 'strike_attempted').length;
  const connected = fe.filter((e: any) => e.event_type === 'strike_connected').length;

  const breakdown: Record<string, { attempted: number; connected: number }> = {};
  for (const e of fe) {
    const st = e.strike_type || 'other';
    if (!breakdown[st]) breakdown[st] = { attempted: 0, connected: 0 };
    if (e.event_type === 'strike_attempted') breakdown[st].attempted++;
    if (e.event_type === 'strike_connected') breakdown[st].connected++;
  }

  return {
    total_attempted: attempted,
    total_connected: connected,
    accuracy: attempted > 0 ? Math.round((connected / attempted) * 10000) / 100 : 0,
    strike_breakdown: breakdown,
    total_events: fe.length,
  };
}

async function validateFightExists(supabase: any, fightId: string) {
  const { data, error } = await supabase
    .from('fights')
    .select('id')
    .eq('id', fightId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// ── Main ─────────────────────────────────────────────────

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

    // ═══════════════════════════════════════════
    // POST /start — Crear sesión, devolver fighters
    // ═══════════════════════════════════════════
    if (path === 'start' && req.method === 'POST') {
      const body = await req.json();
      const { fight_id, device_id, cameras } = body;

      if (!fight_id) return json({ error: 'fight_id is required' }, 400);

      // 1. Validar pelea y obtener fighters
      const { data: fight, error: fightErr } = await supabase
        .from('fights')
        .select(`
          id,
          fighter_a:fighter_profiles!fights_fighter_a_id_fkey(id, name),
          fighter_b:fighter_profiles!fights_fighter_b_id_fkey(id, name)
        `)
        .eq('id', fight_id)
        .maybeSingle();

      if (fightErr) {
        console.error('Error fetching fight:', fightErr);
        return json({ error: fightErr.message }, 500);
      }

      if (!fight) {
        return json({ error: 'fight_id inválido — la pelea no existe' }, 400);
      }

      // 2. Crear sesión de inferencia
      const { data: session, error: sessErr } = await supabase
        .from('ai_inference_sessions')
        .insert({
          fight_id,
          device_id: device_id || 'unknown',
          status: 'running',
          source_url: 'unknown',
          model_version: 'unknown',
          metadata: { cameras: cameras || [] },
        })
        .select()
        .single();

      if (sessErr) {
        console.error('Error creating session:', sessErr);
        return json({ error: sessErr.message }, 500);
      }

      // 3. Upsert fight_telemetry_sessions (bridge) — multi-device safe
      await supabase
        .from('fight_telemetry_sessions')
        .upsert({
          fight_id,
          device_id: device_id || 'unknown',
          status: 'connected',
          last_heartbeat: new Date().toISOString(),
          vision_connected: true,
          session_token: session.id,
        }, { onConflict: 'fight_id,device_id' });

      // 4. Broadcast realtime
      const channel = supabase.channel('fight_sync');
      await channel.send({
        type: 'broadcast',
        event: 'fight_active',
        payload: { fight_id, status: 'ACTIVE', session_id: session.id },
      });
      supabase.removeChannel(channel);

      // 5. Responder
      return json({
        session_id: session.id,
        fight_id,
        fighters: {
          red: {
            id: fight.fighter_a?.id || null,
            name: fight.fighter_a?.name || 'Fighter A',
          },
          blue: {
            id: fight.fighter_b?.id || null,
            name: fight.fighter_b?.name || 'Fighter B',
          },
        },
      });
    }

    // ═══════════════════════════════════════════
    // POST /heartbeat — Actualizar heartbeat
    // ═══════════════════════════════════════════
    if (path === 'heartbeat' && req.method === 'POST') {
      const body = await req.json();
      const fightId = body.fight_id || body.fightId;
      const deviceId = body.device_id || body.deviceId || 'unknown';

      if (!fightId) return json({ error: 'fight_id is required' }, 400);

      const exists = await validateFightExists(supabase, fightId);
      if (!exists) return json({ error: 'fight_id inválido' }, 400);

      const { data, error } = await supabase
        .from('fight_telemetry_sessions')
        .upsert({
          fight_id: fightId,
          device_id: deviceId,
          status: 'connected',
          last_heartbeat: new Date().toISOString(),
          vision_connected: true,
        }, { onConflict: 'fight_id' })
        .select('id')
        .single();

      if (error) {
        console.error('Error upserting heartbeat:', error);
        return json({ error: error.message }, 500);
      }

      return json({ success: true, session_id: data.id });
    }

    // ═══════════════════════════════════════════
    // POST /event — Registrar golpe (con validación)
    // ═══════════════════════════════════════════
    if (path === 'event' && req.method === 'POST') {
      const body = await req.json();

      const fightId = body.fight_id || body.fightId;
      const sessionId = body.session_id || null;
      const fighterId = body.fighter_id || null;
      const fighter = body.fighter || null;
      const eventType = body.type || body.event || 'strike_attempted';
      const confidence = body.confidence ?? 0.5;
      const rawTimestamp = body.timestamp || body.timestamp_ms || Date.now();
      const roundNumber = body.round || body.round_number || 1;
      const strikeType = body.strike_type || null;
      const modelVersion = body.model_version || 'unknown';

      if (!fightId) return json({ error: 'fight_id is required' }, 400);

      const exists = await validateFightExists(supabase, fightId);
      if (!exists) {
        return json({ error: 'fight_id inválido — la pelea no existe' }, 400);
      }

      if (confidence < 0 || confidence > 1) {
        return json({ error: 'confidence must be between 0 and 1' }, 400);
      }

      const fighterLabel = fighter || (fighterId ? 'A' : 'A');

      // Cast timestamp to integer to prevent bigint insertion errors
      const timestampMs = Math.round(Number(rawTimestamp));

      const { data, error } = await supabase
        .from('ai_strike_events')
        .insert({
          fight_id: fightId,
          round_number: roundNumber,
          timestamp_ms: timestampMs,
          fighter: fighterLabel,
          event_type: eventType === 'strike' ? 'strike_connected' : eventType,
          strike_type: strikeType,
          confidence,
          model_version: modelVersion,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting strike event:', error);
        return json({ error: error.message }, 500);
      }

      return json({ success: true, id: data.id });
    }

    // ═══════════════════════════════════════════
    // POST /stop — Detener sesión
    // ═══════════════════════════════════════════
    if (path === 'stop' && req.method === 'POST') {
      const body = await req.json();
      const sessionId = body.session_id || body.sessionId;

      if (!sessionId) return json({ error: 'session_id is required' }, 400);

      const updateData: any = {
        status: 'stopped',
        stopped_at: new Date().toISOString(),
      };

      if (body.stats) {
        updateData.total_frames_processed = body.stats.total_frames;
        updateData.avg_fps = body.stats.avg_fps;
        updateData.avg_latency_ms = body.stats.avg_latency_ms;
      }

      const { error } = await supabase
        .from('ai_inference_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        console.error('Error stopping session:', error);
        return json({ error: error.message }, 500);
      }

      // Also mark telemetry session as disconnected
      if (body.fight_id) {
        await supabase
          .from('fight_telemetry_sessions')
          .update({ status: 'disconnected', vision_connected: false })
          .eq('fight_id', body.fight_id);
      }

      return json({ success: true });
    }

    // ═══════════════════════════════════════════
    // POST /end — Finalizar pelea, calcular stats
    // ═══════════════════════════════════════════
    if (path === 'end' && req.method === 'POST') {
      const body = await req.json();
      const fightId = body.fight_id || body.fightId;

      if (!fightId) return json({ error: 'fight_id is required' }, 400);

      const exists = await validateFightExists(supabase, fightId);
      if (!exists) return json({ error: 'fight_id inválido' }, 400);

      const { data: allEvents, error: evErr } = await supabase
        .from('ai_strike_events')
        .select('*')
        .eq('fight_id', fightId)
        .order('timestamp_ms', { ascending: true });

      if (evErr) return json({ error: evErr.message }, 500);

      const events = allEvents || [];
      const fighterAStats = computeFighterStats(events, 'A');
      const fighterBStats = computeFighterStats(events, 'B');
      const modelVersion = body.model_version || (events.length > 0 ? events[0].model_version : 'unknown');

      let durationSeconds: number | null = null;
      if (events.length >= 2) {
        durationSeconds = Math.round((events[events.length - 1].timestamp_ms - events[0].timestamp_ms) / 1000);
      }

      const { data: resultData, error: resultErr } = await supabase
        .from('ai_fight_results')
        .upsert({
          fight_id: fightId,
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

      if (resultErr) return json({ error: resultErr.message }, 500);

      await supabase
        .from('fights')
        .update({
          ai_result: {
            result_id: resultData.id,
            model_version: modelVersion,
            fighter_a: fighterAStats,
            fighter_b: fighterBStats,
            total_events: events.length,
            computed_at: new Date().toISOString(),
          },
        })
        .eq('id', fightId);

      // Mark telemetry session as disconnected
      await supabase
        .from('fight_telemetry_sessions')
        .update({ status: 'disconnected', vision_connected: false })
        .eq('fight_id', fightId);

      return json({
        success: true,
        resultId: resultData.id,
        stats: { fighter_a: fighterAStats, fighter_b: fighterBStats },
      });
    }

    // ═══════════════════════════════════════════
    // POST /log
    // ═══════════════════════════════════════════
    if (path === 'log' && req.method === 'POST') {
      const entry = await req.json();
      await supabase.from('ai_inference_logs').insert({
        session_id: entry.sessionId || entry.session_id || null,
        fight_id: entry.fightId || entry.fight_id || null,
        level: entry.level,
        message: entry.message,
        metadata: entry.metadata || {},
      });
      return json({ success: true });
    }

    // ═══════════════════════════════════════════
    // GET /health
    // ═══════════════════════════════════════════
    if (path === 'health' && req.method === 'GET') {
      return json({ status: 'ok', version: '3.1', timestamp: new Date().toISOString() });
    }

    // ═══════════════════════════════════════════
    // GET /metrics
    // ═══════════════════════════════════════════
    if (path === 'metrics' && req.method === 'GET') {
      const { data: sessions, error } = await supabase
        .from('ai_inference_sessions')
        .select('*')
        .eq('status', 'running')
        .order('started_at', { ascending: false });

      if (error) return json({ error: error.message }, 500);
      return json({ active_sessions: sessions?.length || 0, sessions: sessions || [] });
    }

    // 404
    return json({
      error: 'Not found',
      availableEndpoints: [
        'POST /start     — Iniciar sesión (valida fight_id, devuelve fighters)',
        'POST /heartbeat — Heartbeat del motor (upsert telemetry)',
        'POST /event     — Registrar golpe (valida fight_id)',
        'POST /stop      — Detener sesión',
        'POST /end       — Finalizar pelea y calcular stats',
        'POST /log       — Registrar log',
        'GET  /health    — Health check',
        'GET  /metrics   — Sesiones activas',
      ],
    }, 404);

  } catch (error) {
    console.error('Unhandled error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
