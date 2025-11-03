import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Initialize Supabase client with service role key for full DB access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Language detection
function detectLanguage(text: string): 'es' | 'en' {
  const spanishKeywords = [
    'crear', 'buscar', 'actualizar', 'eliminar', 'torneo', 'peleador', 'licencia',
    'evento', 'pelea', 'resultado', 'ranking', 'estadística', 'ayuda', 'cómo',
    'dónde', 'cuándo', 'qué', 'por qué', 'sí', 'no', 'gracias'
  ];
  
  const lowerText = text.toLowerCase();
  const spanishCount = spanishKeywords.filter(word => lowerText.includes(word)).length;
  
  return spanishCount > 0 ? 'es' : 'en';
}

// System prompts for different languages
function getSystemPrompt(language: 'es' | 'en'): string {
  if (language === 'es') {
    return `Eres un asistente AI especializado en administración de eventos de combate y gestión de Fighter IDs para la plataforma Batalla Digital Gym.

CAPACIDADES PRINCIPALES:
- Gestión de Torneos: Crear, programar, actualizar eventos de combate
- Administración Fighter ID: Búsqueda, validación, actualización de peleadores
- Gestión de Licencias: Revisar, aprobar, suspender licencias
- Reportes y Estadísticas: Generar análisis y métricas del sistema
- **NUEVO: Análisis Demográfico y de Rendimiento Avanzado**

FUNCIONES DISPONIBLES:
- search_fighters: Buscar peleadores por criterios específicos
- get_fighter_details: Obtener información detallada de un peleador
- update_fighter_profile: Actualizar perfil de peleador
- validate_license: Validar estado de licencias
- create_tournament: Crear nuevo torneo
- get_system_stats: Obtener estadísticas del sistema
- **get_demographic_analysis**: Análisis demográfico completo (género, edades, distribución)
- **get_performance_analysis**: Análisis de récords (top ganadores, invictos, más derrotas)
- **get_geographic_analysis**: Análisis geográfico (distribución por país)
- **get_weight_class_analysis**: Análisis por categorías de peso
- **generate_comprehensive_report**: Reporte completo del sistema

CAPACIDADES ESPECIALES DE ANÁLISIS:
📊 **Demográfico**: género, edades (más joven/viejo/promedio), distribución por rangos de edad
🏆 **Rendimiento**: top 10 ganadores, peleadores invictos, récords, win rates promedio
🌍 **Geográfico**: distribución por país, top 5 nacionalidades
⚖️ **Categorías**: análisis por peso, categoría más popular

EJEMPLOS DE CONSULTAS QUE PUEDES RESPONDER:
- "¿Cuál es el peleador más joven del sistema?"
- "Muéstrame los 10 peleadores con más victorias"
- "¿Cuántos peleadores tenemos por país?"
- "¿Cuál es la categoría de peso más popular?"
- "Dame un reporte completo del sistema"
- "¿Cuántas mujeres vs hombres peleadores tenemos?"
- "Edad promedio de los peleadores"
- "¿Quiénes están invictos?"

INSTRUCCIONES:
1. Siempre responde en español cuando detectes que el usuario escribe en español
2. Usa terminología específica del combate (MMA, Boxeo, etc.)
3. Sé preciso y profesional en las respuestas administrativas
4. Para análisis demográficos y de rendimiento, usa las funciones especializadas
5. Presenta datos de forma clara con números y estadísticas específicas
6. Ofrece opciones claras cuando sea posible
7. Solicita confirmación para acciones importantes

Responde de manera profesional y útil, enfocándote en las necesidades administrativas del usuario.`;
  } else {
    return `You are an AI assistant specialized in combat event administration and Fighter ID management for the Batalla Digital Gym platform.

MAIN CAPABILITIES:
- Tournament Management: Create, schedule, update combat events
- Fighter ID Administration: Search, validate, update fighters
- License Management: Review, approve, suspend licenses
- Reports and Statistics: Generate analysis and system metrics
- Technical Support: Resolve administrative issues

AVAILABLE FUNCTIONS:
- search_fighters: Search fighters by specific criteria
- get_fighter_details: Get detailed fighter information
- update_fighter_profile: Update fighter profile
- validate_license: Validate license status
- create_tournament: Create new tournament
- get_system_stats: Get system statistics
- generate_report: Generate custom reports

INSTRUCTIONS:
1. Always respond in English when you detect English input
2. Use specific combat terminology (MMA, Boxing, etc.)
3. Be precise and professional in administrative responses
4. Offer clear options when possible
5. Request confirmation for important actions

Respond professionally and helpfully, focusing on the user's administrative needs.`;
  }
}

// Specialized functions for fighter and tournament management (Connected to Real DB)
async function searchFighters(criteria: any) {
  try {
    console.log('[AI] Searching fighters:', criteria);
    
    let query = supabase
      .from('fighter_profiles')
      .select('id, first_name, last_name, nickname, country, weight_class, record_wins, record_losses, record_draws, license_number, license_status');

    if (criteria.name) {
      query = query.or(`first_name.ilike.%${criteria.name}%,last_name.ilike.%${criteria.name}%,nickname.ilike.%${criteria.name}%`);
    }
    if (criteria.country) query = query.eq('country', criteria.country);
    if (criteria.weight_class) query = query.eq('weight_class', criteria.weight_class);
    if (criteria.status) query = query.eq('license_status', criteria.status);

    query = query.order('last_name', { ascending: true }).limit(50);
    const { data, error } = await query;

    if (error) throw error;
    return {
      success: true,
      count: data?.length || 0,
      fighters: data || [],
      message: `Se encontraron ${data?.length || 0} peleadores`
    };
  } catch (error) {
    console.error('[AI] searchFighters error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', fighters: [] };
  }
}

async function getFighterDetails(fighterId: string) {
  try {
    console.log('[AI] Getting fighter details:', fighterId);
    
    const { data, error } = await supabase
      .from('fighter_profiles')
      .select('*, fighter_licenses!inner(license_number, issued_at, expires_at, status, is_primary)')
      .eq('id', fighterId)
      .eq('fighter_licenses.is_primary', true)
      .single();

    if (error) throw error;
    if (!data) return { success: false, error: 'Peleador no encontrado', data: null };

    const fullName = `${data.first_name} ${data.last_name}`;
    const record = `${data.record_wins}-${data.record_losses}-${data.record_draws}`;

    return {
      success: true,
      data: {
        nombre: fullName,
        nickname: data.nickname || 'N/A',
        país: data.country,
        categoría: data.weight_class,
        récord: record,
        licencia: data.fighter_licenses?.[0]?.license_number || 'Sin licencia',
        estado_licencia: data.fighter_licenses?.[0]?.status || 'N/A'
      },
      message: `Detalles de ${fullName}`
    };
  } catch (error) {
    console.error('[AI] getFighterDetails error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', data: null };
  }
}

async function updateFighterProfile(fighterId: string, updates: any) {
  try {
    console.log('[AI] Updating fighter:', fighterId, updates);
    
    const allowedFields = ['nickname', 'weight_class', 'gym_name', 'bio'];
    const sanitizedUpdates: any = {};
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) sanitizedUpdates[key] = updates[key];
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return { success: false, error: 'No hay campos válidos para actualizar', allowedFields };
    }

    const { data, error } = await supabase
      .from('fighter_profiles')
      .update(sanitizedUpdates)
      .eq('id', fighterId)
      .select('id, first_name, last_name')
      .single();

    if (error) throw error;
    const fullName = `${data.first_name} ${data.last_name}`;

    return {
      success: true,
      updated_fields: Object.keys(sanitizedUpdates),
      message: `Perfil actualizado: ${fullName}`
    };
  } catch (error) {
    console.error('[AI] updateFighterProfile error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function validateLicense(licenseId: string) {
  try {
    console.log('[AI] Validating license:', licenseId);
    
    const { data, error } = await supabase
      .from('fighter_licenses')
      .select('*, fighter_profiles!inner(first_name, last_name, country)')
      .eq('license_number', licenseId)
      .single();

    if (error) throw error;
    if (!data) return { success: false, status: 'NOT_FOUND', message: 'Licencia no encontrada' };

    const isExpired = data.expires_at ? new Date(data.expires_at) < new Date() : false;
    const daysUntilExpiry = data.expires_at 
      ? Math.ceil((new Date(data.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    let statusMessage = '';
    if (data.status === 'ACTIVE') {
      statusMessage = isExpired ? 'EXPIRADA' : (daysUntilExpiry && daysUntilExpiry < 30 ? 'PRÓXIMA A EXPIRAR' : 'VÁLIDA');
    } else {
      statusMessage = data.status;
    }

    const fullName = `${data.fighter_profiles.first_name} ${data.fighter_profiles.last_name}`;

    return {
      success: true,
      status: statusMessage,
      data: {
        licencia: data.license_number,
        peleador: fullName,
        emitida: data.issued_at,
        expira: data.expires_at,
        días_restantes: daysUntilExpiry
      },
      message: `Licencia ${data.license_number}: ${statusMessage} - ${fullName}`
    };
  } catch (error) {
    console.error('[AI] validateLicense error:', error);
    return { success: false, status: 'ERROR', error: error instanceof Error ? error.message : 'Error' };
  }
}

async function createTournament(tournamentData: any) {
  try {
    console.log('[AI] Creating tournament:', tournamentData);
    
    const requiredFields = ['name', 'start_time', 'venue'];
    for (const field of requiredFields) {
      if (!tournamentData[field]) {
        return { success: false, error: `Campo requerido faltante: ${field}`, requiredFields };
      }
    }

    const eventData = {
      name: tournamentData.name,
      start_time: tournamentData.start_time,
      venue: tournamentData.venue,
      description: tournamentData.description || `Torneo creado por AI Assistant el ${new Date().toLocaleDateString('es-ES')}`,
      discipline: tournamentData.discipline || 'MMA',
      state: 'draft',
      published: false
    };

    const { data: event, error: eventError } = await supabase
      .from('bdg_event')
      .insert(eventData)
      .select()
      .single();

    if (eventError) throw eventError;

    return {
      success: true,
      tournamentId: event.id,
      data: event,
      message: `Torneo "${event.name}" creado para ${new Date(event.start_time).toLocaleDateString('es-ES')}`
    };
  } catch (error) {
    console.error('[AI] createTournament error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function getSystemStats() {
  try {
    console.log('[AI] Getting system stats');
    
    const [fightersResult, licensesResult, eventsResult, pendingLicensesResult, activeFightsResult] = await Promise.all([
      supabase.from('fighter_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('fighter_licenses').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('bdg_event').select('id', { count: 'exact', head: true }).gte('start_time', new Date().toISOString()),
      supabase.from('fighter_licenses').select('id', { count: 'exact', head: true }).eq('status', 'PENDING_REVIEW'),
      supabase.from('fights').select('id', { count: 'exact', head: true }).eq('status', 'live')
    ]);

    const { count: activeFighters } = await supabase
      .from('fighter_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('license_status', 'active');

    const stats = {
      totalPeleadores: fightersResult.count || 0,
      peleadoresActivos: activeFighters || 0,
      licenciasActivas: licensesResult.count || 0,
      licenciasPendientes: pendingLicensesResult.count || 0,
      eventosProximos: eventsResult.count || 0,
      peleasEnVivo: activeFightsResult.count || 0
    };

    return {
      success: true,
      data: stats,
      message: `Sistema: ${stats.totalPeleadores} peleadores, ${stats.licenciasPendientes} licencias pendientes`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[AI] getSystemStats error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', data: null };
  }
}

// NEW: Demographic Analysis
async function getDemographicAnalysis() {
  try {
    console.log('[AI] Getting demographic analysis');
    
    // Gender distribution
    const { data: allFighters, error: fightersError } = await supabase
      .from('fighter_profiles')
      .select('gender, birthdate');
    
    if (fightersError) throw fightersError;
    
    const genderCounts: Record<string, number> = {};
    const ages: number[] = [];
    
    allFighters.forEach(fighter => {
      // Gender counts
      if (fighter.gender) {
        genderCounts[fighter.gender] = (genderCounts[fighter.gender] || 0) + 1;
      }
      
      // Age calculation
      if (fighter.birthdate) {
        const age = new Date().getFullYear() - new Date(fighter.birthdate).getFullYear();
        if (age > 0 && age < 100) ages.push(age);
      }
    });
    
    const youngest = ages.length > 0 ? Math.min(...ages) : 0;
    const oldest = ages.length > 0 ? Math.max(...ages) : 0;
    const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
    
    // Age distribution
    const ageGroups = {
      '18-24': ages.filter(a => a >= 18 && a <= 24).length,
      '25-29': ages.filter(a => a >= 25 && a <= 29).length,
      '30-34': ages.filter(a => a >= 30 && a <= 34).length,
      '35+': ages.filter(a => a >= 35).length
    };
    
    return {
      success: true,
      data: {
        porGenero: genderCounts,
        edades: {
          masJoven: youngest,
          masViejo: oldest,
          promedio: Math.round(avgAge * 10) / 10,
          distribucion: ageGroups
        }
      }
    };
  } catch (error) {
    console.error('[AI] getDemographicAnalysis error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', data: null };
  }
}

// NEW: Performance Analysis
async function getPerformanceAnalysis() {
  try {
    console.log('[AI] Getting performance analysis');
    
    // Top winners
    const { data: topWinners, error: winnersError } = await supabase
      .from('fighter_profiles')
      .select('first_name, last_name, record_wins, record_losses, record_draws')
      .order('record_wins', { ascending: false })
      .limit(10);
    
    if (winnersError) throw winnersError;
    
    // Undefeated fighters
    const { data: undefeated, error: undefeatedError } = await supabase
      .from('fighter_profiles')
      .select('first_name, last_name, record_wins')
      .eq('record_losses', 0)
      .gt('record_wins', 0)
      .order('record_wins', { ascending: false });
    
    if (undefeatedError) throw undefeatedError;
    
    // Most losses
    const { data: mostLosses, error: lossesError } = await supabase
      .from('fighter_profiles')
      .select('first_name, last_name, record_wins, record_losses')
      .order('record_losses', { ascending: false })
      .limit(10);
    
    if (lossesError) throw lossesError;
    
    // Average win rate
    const { data: allRecords, error: recordsError } = await supabase
      .from('fighter_profiles')
      .select('record_wins, record_losses, record_draws');
    
    if (recordsError) throw recordsError;
    
    const fightersWithFights = allRecords.filter(r => (r.record_wins + r.record_losses + r.record_draws) > 0);
    const avgWinRate = fightersWithFights.length > 0 
      ? fightersWithFights.reduce((acc, curr) => {
          const total = curr.record_wins + curr.record_losses + curr.record_draws;
          return acc + (curr.record_wins / total);
        }, 0) / fightersWithFights.length * 100
      : 0;
    
    return {
      success: true,
      data: {
        topGanadores: topWinners,
        invictos: undefeated,
        masPerdidasTop10: mostLosses,
        tasaVictoriaPromedio: Math.round(avgWinRate * 10) / 10
      }
    };
  } catch (error) {
    console.error('[AI] getPerformanceAnalysis error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', data: null };
  }
}

// NEW: Geographic Analysis
async function getGeographicAnalysis() {
  try {
    console.log('[AI] Getting geographic analysis');
    
    const { data: fighters, error } = await supabase
      .from('fighter_profiles')
      .select('country');
    
    if (error) throw error;
    
    const countryGroups: Record<string, number> = {};
    
    fighters.forEach(f => {
      if (f.country) {
        countryGroups[f.country] = (countryGroups[f.country] || 0) + 1;
      }
    });
    
    const sortedCountries = Object.entries(countryGroups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return {
      success: true,
      data: {
        distribucionPorPais: countryGroups,
        top5Paises: sortedCountries,
        totalPaises: Object.keys(countryGroups).length
      }
    };
  } catch (error) {
    console.error('[AI] getGeographicAnalysis error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', data: null };
  }
}

// NEW: Weight Class Analysis
async function getWeightClassAnalysis() {
  try {
    console.log('[AI] Getting weight class analysis');
    
    const { data: fighters, error } = await supabase
      .from('fighter_profiles')
      .select('weight_class');
    
    if (error) throw error;
    
    const weightGroups: Record<string, number> = {};
    
    fighters.forEach(f => {
      if (f.weight_class) {
        weightGroups[f.weight_class] = (weightGroups[f.weight_class] || 0) + 1;
      }
    });
    
    const mostPopular = Object.entries(weightGroups)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      success: true,
      data: {
        distribucionPorPeso: weightGroups,
        categoriaMasPopular: mostPopular ? {
          categoria: mostPopular[0],
          cantidad: mostPopular[1]
        } : null,
        totalCategorias: Object.keys(weightGroups).length
      }
    };
  } catch (error) {
    console.error('[AI] getWeightClassAnalysis error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', data: null };
  }
}

// NEW: Comprehensive Report
async function generateComprehensiveReport(filters?: any) {
  try {
    console.log('[AI] Generating comprehensive report');
    
    const [demographics, performance, geographic, weightClass] = await Promise.all([
      getDemographicAnalysis(),
      getPerformanceAnalysis(),
      getGeographicAnalysis(),
      getWeightClassAnalysis()
    ]);
    
    return {
      success: true,
      data: {
        demografico: demographics.data,
        rendimiento: performance.data,
        geografico: geographic.data,
        categoriasPeso: weightClass.data,
        generadoEn: new Date().toISOString()
      },
      message: 'Reporte completo generado exitosamente'
    };
  } catch (error) {
    console.error('[AI] generateComprehensiveReport error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', data: null };
  }
}

// Function calling handler
async function handleFunctionCall(functionName: string, args: any) {
  console.log(`Calling function: ${functionName}`, args);
  
  try {
    switch (functionName) {
      case 'search_fighters':
        return await searchFighters(args.criteria || {});
      case 'get_fighter_details':
        return await getFighterDetails(args.fighter_id);
      case 'update_fighter_profile':
        return await updateFighterProfile(args.fighter_id, args.updates);
      case 'validate_license':
        return await validateLicense(args.license_id);
      case 'create_tournament':
        return await createTournament(args.tournament_data);
      case 'get_system_stats':
        return await getSystemStats();
      case 'get_demographic_analysis':
        return await getDemographicAnalysis();
      case 'get_performance_analysis':
        return await getPerformanceAnalysis();
      case 'get_geographic_analysis':
        return await getGeographicAnalysis();
      case 'get_weight_class_analysis':
        return await getWeightClassAnalysis();
      case 'generate_comprehensive_report':
        return await generateComprehensiveReport(args.filters);
      default:
        return {
          success: false,
          error: `Unknown function: ${functionName}`
        };
    }
  } catch (error) {
    console.error(`Error in function ${functionName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history = [] } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    // Detect language and get appropriate system prompt
    const language = detectLanguage(message);
    const systemPrompt = getSystemPrompt(language);

    console.log(`Detected language: ${language}`);
    console.log(`Processing message: ${message}`);

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Define available functions
    const functions = [
      {
        name: 'search_fighters',
        description: language === 'es' 
          ? 'Buscar peleadores en la base de datos por criterios específicos'
          : 'Search fighters in the database by specific criteria',
        parameters: {
          type: 'object',
          properties: {
            criteria: {
              type: 'object',
              properties: {
                name: { type: 'string', description: language === 'es' ? 'Nombre del peleador' : 'Fighter name' },
                country: { type: 'string', description: language === 'es' ? 'País del peleador' : 'Fighter country' },
                weight_class: { type: 'string', description: language === 'es' ? 'Categoría de peso' : 'Weight class' },
                status: { type: 'string', description: language === 'es' ? 'Estado activo/inactivo' : 'Active/inactive status' }
              }
            }
          }
        }
      },
      {
        name: 'get_fighter_details',
        description: language === 'es'
          ? 'Obtener información detallada de un peleador específico'
          : 'Get detailed information about a specific fighter',
        parameters: {
          type: 'object',
          properties: {
            fighter_id: { 
              type: 'string', 
              description: language === 'es' ? 'ID único del peleador' : 'Unique fighter ID'
            }
          },
          required: ['fighter_id']
        }
      },
      {
        name: 'get_system_stats',
        description: language === 'es'
          ? 'Obtener estadísticas actuales del sistema'
          : 'Get current system statistics',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'validate_license',
        description: language === 'es'
          ? 'Validar el estado de una licencia específica'
          : 'Validate the status of a specific license',
        parameters: {
          type: 'object',
          properties: {
            license_id: {
              type: 'string',
              description: language === 'es' ? 'ID de la licencia a validar' : 'License ID to validate'
            }
          },
          required: ['license_id']
        }
      },
      {
        name: 'get_demographic_analysis',
        description: language === 'es' 
          ? 'Obtener análisis demográfico completo: género, edades (más joven, más viejo, promedio), distribución por rangos de edad'
          : 'Get comprehensive demographic analysis: gender, ages (youngest, oldest, average), age distribution',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_performance_analysis',
        description: language === 'es'
          ? 'Análisis de récords de combate: peleadores con más victorias, invictos, más derrotas, win rate promedio del sistema'
          : 'Combat record analysis: top winners, undefeated fighters, most losses, average win rate',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_geographic_analysis',
        description: language === 'es'
          ? 'Análisis geográfico: distribución de peleadores por país, top 5 países con más peleadores'
          : 'Geographic analysis: fighter distribution by country, top 5 countries',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_weight_class_analysis',
        description: language === 'es'
          ? 'Análisis por categorías de peso: distribución, categoría más popular, total de categorías'
          : 'Weight class analysis: distribution, most popular category, total categories',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'generate_comprehensive_report',
        description: language === 'es'
          ? 'Generar reporte completo del sistema con todas las estadísticas: demográficas, rendimiento, geográficas y categorías de peso'
          : 'Generate comprehensive system report with all statistics: demographics, performance, geographic and weight classes',
        parameters: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              description: language === 'es' ? 'Filtros opcionales para el reporte' : 'Optional filters for the report',
              properties: {
                country: { type: 'string', description: language === 'es' ? 'Filtrar por país' : 'Filter by country' },
                weight_class: { type: 'string', description: language === 'es' ? 'Filtrar por categoría de peso' : 'Filter by weight class' },
                gender: { type: 'string', description: language === 'es' ? 'Filtrar por género' : 'Filter by gender' }
              }
            }
          }
        }
      }
    ];

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        tools: functions.map(fn => ({
          type: 'function',
          function: fn
        })),
        tool_choice: 'auto'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lovable AI API Error:', errorData);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      
      throw new Error(`Lovable AI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Lovable AI Response:', data);

    let finalResponse = data.choices[0].message;

    // Handle tool calls (Lovable AI format)
    if (finalResponse.tool_calls && finalResponse.tool_calls.length > 0) {
      const toolCall = finalResponse.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
      
      console.log(`Tool call detected: ${functionName}`, functionArgs);
      
      const functionResult = await handleFunctionCall(functionName, functionArgs);
      
      // Make a second call to Lovable AI with the tool result
      const followUpMessages = [
        ...messages,
        finalResponse,
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify(functionResult)
        }
      ];

      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: followUpMessages
        }),
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        finalResponse = followUpData.choices[0].message;
      }
    }

    return new Response(JSON.stringify({
      response: finalResponse.content,
      language: language,
      function_called: finalResponse.tool_calls?.[0]?.function?.name || null,
      conversation_id: crypto.randomUUID()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-ai-assistant:', error);
    const errorMessage = error instanceof Error ? error.message : '';
    const language = detectLanguage(errorMessage || 'en');
    
    // Provide fallback responses when Lovable AI is unavailable
    if (errorMessage.includes('Rate limit')) {
      const fallbackResponse = language === 'es' 
        ? 'Lo siento, se ha alcanzado el límite de solicitudes. Por favor, espera un momento e intenta nuevamente.\n\nMientras tanto, puedes usar las funciones del sistema directamente:\n\n• Para buscar peleadores, utiliza la búsqueda en la sección de Peleadores\n• Para ver estadísticas del sistema, revisa el Dashboard\n• Para gestionar licencias, ve a Validación de Licencias\n• Para crear torneos, usa la sección de Eventos'
        : 'Sorry, rate limit reached. Please wait a moment and try again.\n\nMeanwhile, you can use system functions directly:\n\n• To search fighters, use the search in Fighters section\n• To view system stats, check the Dashboard\n• To manage licenses, go to License Validation\n• To create tournaments, use the Events section';
      
      return new Response(JSON.stringify({ 
        response: fallbackResponse,
        language: language,
        isOfflineMode: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (errorMessage.includes('Payment required')) {
      const fallbackResponse = language === 'es'
        ? 'El servicio de IA requiere créditos adicionales. Por favor, contacta al administrador para agregar créditos a Lovable AI.\n\nPuedes usar las funciones del sistema directamente desde el menú de administración.'
        : 'AI service requires additional credits. Please contact the administrator to add credits to Lovable AI.\n\nYou can use system functions directly from the admin menu.';
      
      return new Response(JSON.stringify({ 
        response: fallbackResponse,
        language: language,
        isOfflineMode: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Handle other AI errors
    if (errorMessage.includes('Lovable AI') || errorMessage.includes('API')) {
      const fallbackResponse = language === 'es'
        ? 'Hay un problema de conectividad con el servicio de IA. Puedes usar las funciones del sistema directamente desde el menú de administración.'
        : 'There is a connectivity issue with the AI service. You can use system functions directly from the admin menu.';
      
      return new Response(JSON.stringify({ 
        response: fallbackResponse,
        language: language,
        isOfflineMode: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Generic error fallback
    const fallbackMessage = language === 'es' 
      ? 'Error procesando solicitud. Intenta nuevamente o usa las funciones del sistema directamente.'
      : 'Error processing request. Try again or use system functions directly.';
    
    return new Response(JSON.stringify({ 
      error: fallbackMessage,
      language: language
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});