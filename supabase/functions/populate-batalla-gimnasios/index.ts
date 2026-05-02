import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCorsHeaders } from "../_shared/cors.ts";

// corsHeaders is now computed per-request via buildCorsHeaders(req)

interface FighterData {
  name: string;
  age: number;
  birthDate?: string;
  weight: number;
  record: string;
  height: string;
  academy?: string;
  country: string;
  nickname?: string;
  fightNumber: number;
  fightType: string;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Iniciando población de datos de Batalla de Gimnasios #1...');

    // Crear el evento principal
    const { data: event, error: eventError } = await supabase
      .from('bdg_event')
      .insert({
        name: 'Batalla de Gimnasios #1',
        description: 'Primer evento de la serie Batalla de Gimnasios con 18 peleas emocionantes entre peleadores amateur y profesionales de Centroamérica.',
        discipline: 'MMA',
        venue: 'Arena Central - Honduras',
        state: 'draft',
        start_time: new Date('2025-03-15T19:00:00Z').toISOString(),
        end_time: new Date('2025-03-15T23:00:00Z').toISOString(),
        meta: {
          total_fights: 18,
          amateur_fights: 14,
          professional_fights: 4
        }
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      throw eventError;
    }

    console.log('Evento creado:', event.id);

    // Datos de los peleadores por pelea
    const fightersData: FighterData[] = [
      // Pelea #1 Amateur
      { name: 'FERNANDO GOMEZ', age: 23, weight: 155, record: '1-0-0', height: '1,73', academy: 'SCHUMMANS/COMAYAGUA', country: 'HN', fightNumber: 1, fightType: 'AMATEUR' },
      { name: 'WALLY SAMUEL GONZALEZ ESPINOZA', age: 22, weight: 155, record: '1-0-0', height: '1,78', academy: 'ALFA Y OMEGA MMA', country: 'NI', fightNumber: 1, fightType: 'AMATEUR' },
      
      // Pelea #2 Amateur
      { name: 'DAVID PEREZ MOLINA', age: 26, weight: 170, record: '1-0-0', height: '1,84', academy: 'SCHUMMANS/COMAYAGUA', country: 'CL', nickname: 'EL CHILENO PEREZ', fightNumber: 2, fightType: 'AMATEUR' },
      { name: 'RICHARD FERNANDO GONZALES', age: 30, weight: 170, record: '0-1-0', height: '1,84', academy: 'ALFA Y OMEGA MMA', country: 'NI', nickname: 'CADEJO', fightNumber: 2, fightType: 'AMATEUR' },
      
      // Pelea #3 Amateur
      { name: 'EVIL GARCIA', age: 30, weight: 155, record: 'DEBUT', height: '1,65', academy: 'SCHUMMANS/COMAYAGUA', country: 'HN', fightNumber: 3, fightType: 'AMATEUR' },
      { name: 'IVO JOSUE RUBIO BATRES', age: 31, weight: 155, record: 'DEBUT', height: '1,70', academy: 'LUNATICOS TEAM', country: 'HN', fightNumber: 3, fightType: 'AMATEUR' },
      
      // Pelea #4 Amateur
      { name: 'BRAD FERNANDO FLORES HERNANDEZ', age: 24, weight: 260, record: 'DEBUT', height: '1,95', academy: 'BUSHIDO MMA', country: 'HN', fightNumber: 4, fightType: 'AMATEUR' },
      { name: 'DENNIS SANTIAGO SAMAEL MARTINEZ GONZALES', age: 34, weight: 260, record: 'DEBUT', height: '1,75', academy: 'LUNATICOS TEAM', country: 'HN', nickname: 'TORETE', fightNumber: 4, fightType: 'AMATEUR' },
      
      // Pelea #5 Amateur
      { name: 'RANDY ISAIAS TERCERO RIVERA', age: 20, weight: 145, record: '1-2-0', height: '1,70', academy: 'ALFA Y OMEGA MMA', country: 'NI', nickname: 'EL COLOCHO', fightNumber: 5, fightType: 'AMATEUR' },
      { name: 'ADRIAN JOSUE RAMIREZ ELVIR', age: 21, weight: 145, record: 'DEBUT', height: '1,73', academy: 'DREAM TEAM', country: 'HN', nickname: 'THE PUNISHER', fightNumber: 5, fightType: 'AMATEUR' },
      
      // Pelea #6 Amateur
      { name: 'ESTUARDO SOLORZANO', age: 25, weight: 155, record: 'DEBUT', height: '1,73', academy: 'PERICKA MMA BROTHERHOOD', country: 'GT', fightNumber: 6, fightType: 'AMATEUR' },
      { name: 'ERICK TZOCK', age: 31, weight: 155, record: '1-0-0', height: '1,79', academy: 'KAHURA', country: 'HN', nickname: 'SUPER 20D', fightNumber: 6, fightType: 'AMATEUR' },
      
      // Pelea #7 Amateur  
      { name: 'KATTERINE PORTT', age: 21, weight: 115, record: 'DEBUT', height: '1,59', academy: 'PERICKA MMA BROTHERHOOD', country: 'GT', fightNumber: 7, fightType: 'AMATEUR' },
      { name: 'SOFIA RAMIREZ', age: 24, weight: 130, record: 'DEBUT', height: '1,61', academy: 'DREAM TEAM', country: 'HN', fightNumber: 7, fightType: 'AMATEUR' },
      
      // Pelea #8 Amateur
      { name: 'MANUEL BULNES', age: 20, weight: 125, record: 'DEBUT', height: '1,63', academy: 'SCHUMMANS/COMAYAGUA', country: 'HN', fightNumber: 8, fightType: 'AMATEUR' },
      { name: 'ALBERTO CALDERON', age: 24, weight: 125, record: '0-1-0', height: '1,67', academy: 'LUNATICOS TEAM', country: 'HN', nickname: 'INDESTRUCTIBLE', fightNumber: 8, fightType: 'AMATEUR' },
      
      // Pelea #9 Amateur
      { name: 'GREYDI OSCARINA LOPEZ', age: 19, weight: 115, record: '2-2-0', height: '1,58', academy: 'GOLD GIM ESTELI', country: 'NI', fightNumber: 9, fightType: 'AMATEUR' },
      { name: 'KENYI SOSA GIMENEZ', age: 20, weight: 115, record: '0-1-0', height: '1,56', academy: 'TEAM VARGAS', country: 'CR', fightNumber: 9, fightType: 'AMATEUR' },
      
      // Pelea #10 Amateur
      { name: 'ISABEL URQUIA', age: 26, weight: 125, record: '1-0-0', height: '1,65', academy: 'TEMPLO DEL TIGRE', country: 'GT', nickname: 'LA VERDUGO', fightNumber: 10, fightType: 'AMATEUR' },
      { name: 'IRIS NINEL MARTINEZ', age: 33, weight: 125, record: '0-4-0', height: '1,63', academy: 'LUDUS CERBERUS', country: 'HN', nickname: 'LA MUERTE', fightNumber: 10, fightType: 'AMATEUR' },
      
      // Pelea #11 Amateur
      { name: 'THOMAS GODFREY', age: 21, weight: 170, record: '6-4-0', height: '1,83', academy: 'WAR TRAINING CENTER ORANGE WALK', country: 'BZ', fightNumber: 11, fightType: 'AMATEUR' },
      { name: 'BRAYAN DAVID GIMENEZ YANEZ', age: 30, weight: 170, record: '2-1-0', height: '1,80', academy: 'XFIT MMA', country: 'HN', fightNumber: 11, fightType: 'AMATEUR' },
      
      // Pelea #12 Amateur
      { name: 'FRANSISCO RAFAEL NAVARRO ESCOTO', age: 28, weight: 155, record: '3-3-0', height: '1,70', academy: 'XFIT MMA', country: 'HN', nickname: 'MOTIÑO', fightNumber: 12, fightType: 'AMATEUR' },
      { name: 'JOSE BERNARDO TURCIOS', age: 25, weight: 155, record: '4-1-0', height: '1,72', academy: 'LUDUS CERBERUS', country: 'HN', nickname: 'NACHO', fightNumber: 12, fightType: 'AMATEUR' },
      
      // Pelea #13 Amateur
      { name: 'ROGER GABRIEL CASTAÑEDA', age: 21, weight: 145, record: '3-0-0', height: '1,71', academy: 'CDK', country: 'GT', nickname: 'COBRA', fightNumber: 13, fightType: 'AMATEUR' },
      { name: 'JOSUE ALEXANDER ROCHA PEÑA', age: 24, weight: 145, record: '5-2-0', height: '1,78', academy: 'LUNATICOS TEAM', country: 'HN', nickname: 'ROCK STAR', fightNumber: 13, fightType: 'AMATEUR' },
      
      // Pelea #14 Amateur
      { name: 'JALEN PEREZ', age: 19, weight: 125, record: '8-1-1', height: '1,83', academy: 'WAR TRAINING CENTER ORANGE WALK', country: 'BZ', nickname: 'BELIZEAN PRODIGY', fightNumber: 14, fightType: 'AMATEUR' },
      { name: 'ERICK NEFTALY LOPEZ RAMIREZ', age: 27, weight: 125, record: '4-5-0', height: '1,65', academy: 'LUDUS CERBERUS', country: 'HN', fightNumber: 14, fightType: 'AMATEUR' },
      
      // Pelea #15 Profesional
      { name: 'JUAN CAMPOS', age: 38, weight: 145, record: '10-19-0', height: '1,68', academy: 'THE PONY WARRIOR', country: 'VE', nickname: 'THE PONY', fightNumber: 15, fightType: 'PROFESSIONAL' },
      { name: 'ERICK ROGELIO RUANO BARRERA', age: 37, weight: 145, record: '17-10-0', height: '1,68', academy: 'PERICKA MMA BROTHERHOOD', country: 'GT', nickname: 'PERIKA', fightNumber: 15, fightType: 'PROFESSIONAL' },
      
      // Pelea #16 Profesional
      { name: 'EDGAR DE JESUS DOMINGUEZ POOL', age: 24, weight: 135, record: '2-1-0', height: '1,70', academy: 'KUNG DO LAMA', country: 'MX', nickname: 'IRON BABY', fightNumber: 16, fightType: 'PROFESSIONAL' },
      { name: 'BRANDON SSYVHONNY NAGERA', age: 24, weight: 135, record: '2-3-0', height: '1,70', academy: 'PERICKA MMA BROTHERHOOD', country: 'GT', nickname: 'SAITAMA', fightNumber: 16, fightType: 'PROFESSIONAL' },
      
      // Pelea #17 Profesional
      { name: 'CIRON SOTO ALFRED', age: 36, weight: 205, record: 'DEBUT', height: '1,73', academy: 'LUNATICOS TEAM', country: 'HN', nickname: 'MISQUITO GUERRERO', fightNumber: 17, fightType: 'PROFESSIONAL' },
      { name: 'JESUS SAMUEL CHAVARRIA CASTILLO', age: 26, weight: 205, record: '4-0-0', height: '1,80', academy: 'SCHUMMANS/SIGUATEPEQUE', country: 'HN', nickname: 'KRATOS', fightNumber: 17, fightType: 'PROFESSIONAL' },
      
      // Pelea #18 Profesional  
      { name: 'CESAR BONILLA', age: 39, weight: 205, record: '2-3-0', height: '1,75', academy: 'SILVERBACK/10TH PLANET', country: 'CA', nickname: 'THE HULK', fightNumber: 18, fightType: 'PROFESSIONAL' },
      { name: 'WALTER ARTURO LUNA PAZ', age: 39, weight: 205, record: '21-16-1', height: '1,76', academy: 'LUNATICOS TEAM', country: 'HN', nickname: 'THE SHOW TIME', fightNumber: 18, fightType: 'PROFESSIONAL' }
    ];

    console.log(`Procesando ${fightersData.length} peleadores...`);

    // Agrupar peleadores por peleas
    const fightGroups: { [key: number]: FighterData[] } = {};
    fightersData.forEach(fighter => {
      if (!fightGroups[fighter.fightNumber]) {
        fightGroups[fighter.fightNumber] = [];
      }
      fightGroups[fighter.fightNumber].push(fighter);
    });

    // Procesar cada pelea
    for (const fightNumber of Object.keys(fightGroups).map(Number).sort()) {
      const fighters = fightGroups[fightNumber];
      console.log(`Procesando pelea #${fightNumber} con ${fighters.length} peleadores...`);

      if (fighters.length !== 2) {
        console.error(`Pelea #${fightNumber} no tiene exactamente 2 peleadores`);
        continue;
      }

      const [fighterA, fighterB] = fighters;

      // Crear o encontrar peleadores
      const fighterIds: string[] = [];

      for (const fighter of [fighterA, fighterB]) {
        console.log(`Creando peleador: ${fighter.name}`);
        
        // Separar nombre completo
        const nameParts = fighter.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;

        // Llamar a la función de importación
        const { data: fighterId, error: fighterError } = await supabase.rpc('import_fighter_data', {
          p_first_name: firstName,
          p_last_name: lastName,
          p_age: fighter.age,
          p_weight_lbs: fighter.weight,
          p_record: fighter.record,
          p_height_text: fighter.height,
          p_country: fighter.country,
          p_nickname: fighter.nickname || null,
          p_academy: fighter.academy || null
        });

        if (fighterError) {
          console.error(`Error creando peleador ${fighter.name}:`, fighterError);
          throw fighterError;
        }

        fighterIds.push(fighterId);
        console.log(`Peleador creado: ${fighter.name} (${fighterId})`);
      }

      // Crear la pelea
      const { error: fightError } = await supabase
        .from('fights')
        .insert({
          event_id: event.id,
          fight_number: fightNumber,
          fight_type: fighterA.fightType,
          fighter_a_id: fighterIds[0],
          fighter_b_id: fighterIds[1],
          weight_class: getWeightClass(fighterA.weight),
          scheduled_time: new Date(`2025-03-15T${19 + Math.floor(fightNumber / 5)}:${(fightNumber % 5) * 12}:00Z`).toISOString()
        });

      if (fightError) {
        console.error(`Error creando pelea #${fightNumber}:`, fightError);
        throw fightError;
      }

      console.log(`Pelea #${fightNumber} creada exitosamente`);
    }

    // Actualizar estado del evento
    await supabase
      .from('bdg_event')
      .update({ state: 'live' })
      .eq('id', event.id);

    console.log('¡Población de datos completada exitosamente!');

    return new Response(JSON.stringify({
      success: true,
      message: 'Evento y peleadores creados exitosamente',
      event_id: event.id,
      fighters_created: fightersData.length,
      fights_created: Object.keys(fightGroups).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error en populate-batalla-gimnasios:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function getWeightClass(weightLbs: number): string {
  if (weightLbs <= 115) return 'Strawweight';
  if (weightLbs <= 125) return 'Flyweight';
  if (weightLbs <= 135) return 'Bantamweight';  
  if (weightLbs <= 145) return 'Featherweight';
  if (weightLbs <= 155) return 'Lightweight';
  if (weightLbs <= 170) return 'Welterweight';
  if (weightLbs <= 185) return 'Middleweight';
  if (weightLbs <= 205) return 'Light Heavyweight';
  return 'Heavyweight';
}