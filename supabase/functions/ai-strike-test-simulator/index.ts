import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { buildCorsHeaders } from "../_shared/cors.ts";
// corsHeaders is now computed per-request via buildCorsHeaders(req)

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, fight_id, round_number, fighter, event_type } = await req.json();

    console.log('Test simulator request:', { action, fight_id, round_number, fighter, event_type });

    // Simular un golpe
    if (action === 'simulate_strike') {
      const strikeTypes = ['jab', 'cross', 'hook', 'uppercut', 'kick', 'elbow', 'knee'];
      const randomStrikeType = strikeTypes[Math.floor(Math.random() * strikeTypes.length)];
      const confidence = 0.75 + Math.random() * 0.24; // Between 0.75 and 0.99
      
      const event = {
        fight_id,
        round_number: round_number || 1,
        fighter: fighter || 'A',
        event_type: event_type || 'strike_connected',
        strike_type: randomStrikeType,
        confidence,
        timestamp_ms: Date.now(),
        model_version: 'test-simulator-v1.0',
        metadata: {
          simulated: true,
          test_mode: true,
          timestamp: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('ai_strike_events')
        .insert(event)
        .select()
        .single();

      if (error) {
        console.error('Error inserting strike event:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to insert event', details: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Strike event created:', data);

      return new Response(
        JSON.stringify({ 
          success: true, 
          event: data,
          message: `Golpe ${event_type} simulado para peleador ${fighter}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simular una sesión de IA
    if (action === 'start_session') {
      const session = {
        fight_id,
        source_url: 'test://simulation',
        status: 'running',
        model_version: 'test-simulator-v1.0',
        metadata: {
          simulated: true,
          test_mode: true,
          started_at: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('ai_inference_sessions')
        .insert(session)
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create session', details: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          session: data,
          message: 'Sesión de IA simulada iniciada'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simular una ráfaga de golpes (para pruebas rápidas)
    if (action === 'simulate_burst') {
      const count = 10; // 10 golpes de prueba
      const events = [];

      for (let i = 0; i < count; i++) {
        const strikeTypes = ['jab', 'cross', 'hook', 'uppercut', 'kick'];
        const fighters = ['A', 'B'];
        const eventTypes = ['strike_attempted', 'strike_connected'];
        
        const event = {
          fight_id,
          round_number: round_number || 1,
          fighter: fighters[Math.floor(Math.random() * fighters.length)],
          event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          strike_type: strikeTypes[Math.floor(Math.random() * strikeTypes.length)],
          confidence: 0.7 + Math.random() * 0.29,
          timestamp_ms: Date.now() + (i * 1000), // Espaciados por 1 segundo
          model_version: 'test-simulator-v1.0',
          metadata: {
            simulated: true,
            test_mode: true,
            burst_index: i
          }
        };
        events.push(event);
      }

      const { data, error } = await supabase
        .from('ai_strike_events')
        .insert(events)
        .select();

      if (error) {
        console.error('Error inserting burst events:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to insert burst events', details: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          count: data.length,
          message: `${data.length} golpes simulados creados`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: simulate_strike, start_session, or simulate_burst' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in test simulator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
