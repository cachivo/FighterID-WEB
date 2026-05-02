import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

import { buildCorsHeaders } from "../_shared/cors.ts";
// corsHeaders is now computed per-request via buildCorsHeaders(req)

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
    return `Eres un asistente de IA especializado en gestión de eventos de combate y perfiles de peleadores. 
Tu función es ayudar a los administradores a gestionar la plataforma de manera eficiente.

CAPACIDADES ADMINISTRATIVAS COMPLETAS:

🔍 **Búsqueda Avanzada de Peleadores**:
- Por nombre, apellido, apodo (búsqueda flexible)
- Por fecha de nacimiento (exacta o rango)
- Por número de licencia o documento de identidad
- Por edad (rango: ej. 25-30 años)
- Por país, género, categoría de peso, disciplina
- Combinación de múltiples criterios simultáneos
- Búsqueda de invictos, récords mínimos

👤 **Gestión Completa de Peleadores**:
- Crear nuevos perfiles de peleadores
- Actualizar información completa (datos personales, médicos, récords)
- Eliminar peleadores del sistema
- Ver información sensible (contactos de emergencia, documentos, historial médico)
- Búsqueda de peleadores similares (por categoría, género, récord)

📝 **Gestión de Licencias**:
- Listar licencias pendientes de aprobación
- Aprobar licencias (nivel AMATEUR o PROFESSIONAL)
- Suspender licencias (temporal o indefinidamente)
- Reactivar licencias suspendidas
- Validar estados y fechas de expiración

📊 **Análisis y Reportes Avanzados**:
- Análisis demográfico (género, edades, distribución)
- Análisis de rendimiento (top ganadores, invictos, récords)
- Análisis geográfico (distribución por países)
- Análisis por categorías de peso
- Reportes personalizados con filtros múltiples
- Rankings por diferentes criterios (victorias, derrotas, empates)
- Estadísticas generales del sistema

EJEMPLOS DE CONSULTAS QUE PUEDES RESPONDER:
- "Buscar peleador nacido el 15 de marzo de 1995"
- "Dame todos los peleadores hondureños entre 25 y 30 años"
- "¿Quién tiene la licencia FGT-2024-045?"
- "Mostrar peleadores invictos con más de 5 victorias"
- "Aprobar la licencia de Juan Pérez como PROFESSIONAL"
- "Suspender la licencia X por dopaje hasta diciembre 2025"
- "Crear nuevo peleador: José López, 28 años, welterweight, Honduras"
- "Top 10 peleadores con más victorias en peso ligero"
- "¿Cuántos peleadores hay en cada categoría de peso?"
- "Dame la información médica del peleador con ID X"
- "Buscar peleadores similares a Randy Tercero"
- "Reporte completo de peleadores mexicanos"

Siempre responde de manera clara, concisa y profesional. 
Cuando uses funciones, explica qué estás haciendo y muestra los resultados de forma organizada.
Si necesitas más información para completar una solicitud, pregunta específicamente qué datos faltan.`;
  } else {
    return `You are an AI assistant specialized in managing combat events and fighter profiles.
Your role is to help administrators manage the platform efficiently.

COMPLETE ADMINISTRATIVE CAPABILITIES:

🔍 **Advanced Fighter Search**:
- By name, surname, nickname (flexible search)
- By birthdate (exact or range)
- By license or ID document number
- By age (range: e.g., 25-30 years)
- By country, gender, weight class, discipline
- Multiple simultaneous criteria combination
- Search for undefeated fighters, minimum records

👤 **Complete Fighter Management**:
- Create new fighter profiles
- Update complete information (personal, medical, records)
- Delete fighters from system
- View sensitive information (emergency contacts, documents, medical history)
- Find similar fighters (by category, gender, record)

📝 **License Management**:
- List pending licenses for approval
- Approve licenses (AMATEUR or PROFESSIONAL level)
- Suspend licenses (temporary or indefinitely)
- Reactivate suspended licenses
- Validate states and expiration dates

📊 **Advanced Analysis and Reports**:
- Demographic analysis (gender, ages, distribution)
- Performance analysis (top winners, undefeated, records)
- Geographic analysis (distribution by countries)
- Weight class analysis
- Custom reports with multiple filters
- Rankings by different criteria (wins, losses, draws)
- General system statistics

Always respond clearly, concisely, and professionally.
When using functions, explain what you're doing and present results in an organized manner.
If you need more information to complete a request, ask specifically what data is missing.`;
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

// Advanced search with multiple criteria
async function advancedSearchFighters(criteria: any) {
  try {
    console.log('[AI] Advanced search:', criteria);
    
    let query = supabase
      .from('fighter_profiles')
      .select('id, first_name, last_name, nickname, birthdate, gender, country, weight_class, discipline, fighting_style, record_wins, record_losses, record_draws, license_number, license_status, document_number, document_type, height_cm, weight_kg, reach_cm, gym_name, avatar_url, created_at');

    // Priority search by ID
    if (criteria.fighter_id) {
      const { data, error } = await query.eq('id', criteria.fighter_id).single();
      if (error) throw error;
      return { success: true, count: 1, fighters: [data], message: 'Peleador encontrado' };
    }
    
    if (criteria.license_number) query = query.eq('license_number', criteria.license_number);
    if (criteria.document_number) query = query.eq('document_number', criteria.document_number);
    
    if (criteria.full_name) {
      const parts = criteria.full_name.toLowerCase().split(' ');
      const first = parts[0];
      const last = parts[parts.length - 1];
      query = query.or(`first_name.ilike.%${first}%,last_name.ilike.%${last}%,nickname.ilike.%${criteria.full_name}%`);
    }
    
    if (criteria.first_name) query = query.ilike('first_name', `%${criteria.first_name}%`);
    if (criteria.last_name) query = query.ilike('last_name', `%${criteria.last_name}%`);
    if (criteria.nickname) query = query.ilike('nickname', `%${criteria.nickname}%`);
    if (criteria.birthdate) query = query.eq('birthdate', criteria.birthdate);
    if (criteria.birthdate_from) query = query.gte('birthdate', criteria.birthdate_from);
    if (criteria.birthdate_to) query = query.lte('birthdate', criteria.birthdate_to);
    if (criteria.country) query = query.eq('country', criteria.country);
    if (criteria.gender) query = query.eq('gender', criteria.gender);
    if (criteria.weight_class) query = query.eq('weight_class', criteria.weight_class);
    if (criteria.discipline) query = query.eq('discipline', criteria.discipline);
    if (criteria.fighting_style) query = query.eq('fighting_style', criteria.fighting_style);
    if (criteria.license_status) query = query.eq('license_status', criteria.license_status);
    if (criteria.active !== undefined) query = query.eq('active', criteria.active);
    if (criteria.min_wins) query = query.gte('record_wins', criteria.min_wins);
    if (criteria.undefeated) query = query.eq('record_losses', 0).gt('record_wins', 0);
    
    const limit = criteria.limit || 50;
    const offset = criteria.offset || 0;
    query = query.range(offset, offset + limit - 1).order('last_name', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    let results = data || [];
    if (criteria.age_min || criteria.age_max) {
      results = results.filter(f => {
        if (!f.birthdate) return false;
        const age = new Date().getFullYear() - new Date(f.birthdate).getFullYear();
        if (criteria.age_min && age < criteria.age_min) return false;
        if (criteria.age_max && age > criteria.age_max) return false;
        return true;
      });
    }
    
    return {
      success: true,
      count: results.length,
      fighters: results,
      message: `Se encontraron ${results.length} peleadores`
    };
  } catch (error) {
    console.error('[AI] advancedSearchFighters error:', error);
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

// License Management Functions
async function getPendingLicenses() {
  try {
    console.log('[AI] Getting pending licenses');
    const { data, error } = await supabase
      .from('fighter_licenses')
      .select('id, license_number, status, created_at, fighter_profiles!inner(id, first_name, last_name, email, phone, country)')
      .eq('status', 'PENDING_REVIEW')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return {
      success: true,
      count: data.length,
      licenses: data,
      message: `${data.length} licencias pendientes de revisión`
    };
  } catch (error) {
    console.error('[AI] getPendingLicenses error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', licenses: [] };
  }
}

async function approveLicense(licenseId: string, level: string = 'AMATEUR') {
  try {
    console.log('[AI] Approving license:', licenseId);
    const { error } = await supabase.rpc('approve_license', {
      p_license_id: licenseId,
      p_level: level
    });
    if (error) throw error;
    return { success: true, message: `Licencia aprobada como ${level}` };
  } catch (error) {
    console.error('[AI] approveLicense error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function suspendLicense(licenseId: string, reason: string, until?: string) {
  try {
    console.log('[AI] Suspending license:', licenseId);
    const { error } = await supabase.rpc('suspend_license', {
      p_license_id: licenseId,
      p_reason: reason,
      p_until: until || null
    });
    if (error) throw error;
    return { success: true, message: `Licencia suspendida${until ? ` hasta ${until}` : ' indefinidamente'}` };
  } catch (error) {
    console.error('[AI] suspendLicense error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function reactivateLicense(licenseId: string) {
  try {
    console.log('[AI] Reactivating license:', licenseId);
    const { error } = await supabase
      .from('fighter_licenses')
      .update({ status: 'ACTIVE', suspension_reason: null, suspension_until: null })
      .eq('id', licenseId);
    if (error) throw error;
    return { success: true, message: 'Licencia reactivada exitosamente' };
  } catch (error) {
    console.error('[AI] reactivateLicense error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

// Fighter Management Functions
async function createFighter(fighterData: any) {
  try {
    console.log('[AI] Creating fighter:', fighterData);
    if (!fighterData.first_name || !fighterData.last_name) {
      return { success: false, error: 'Nombre y apellido son requeridos' };
    }
    
    const { data, error } = await supabase
      .from('fighter_profiles')
      .insert(fighterData)
      .select()
      .single();
    
    if (error) throw error;
    return {
      success: true,
      fighter_id: data.id,
      data: data,
      message: `Peleador ${data.first_name} ${data.last_name} creado exitosamente`
    };
  } catch (error) {
    console.error('[AI] createFighter error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function updateFighterComplete(fighterId: string, updates: any) {
  try {
    console.log('[AI] Updating fighter complete:', fighterId);
    const { error } = await supabase.rpc('admin_update_fighter_profile', {
      p_fighter_id: fighterId,
      p_profile_data: updates
    });
    if (error) throw error;
    return { success: true, message: 'Perfil actualizado exitosamente' };
  } catch (error) {
    console.error('[AI] updateFighterComplete error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function deleteFighter(fighterId: string) {
  try {
    console.log('[AI] Deleting fighter:', fighterId);
    const { error } = await supabase.rpc('admin_delete_fighter_profile', {
      p_fighter_id: fighterId
    });
    if (error) throw error;
    return { success: true, message: 'Peleador eliminado exitosamente' };
  } catch (error) {
    console.error('[AI] deleteFighter error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function getFighterSensitiveData(fighterId: string) {
  try {
    console.log('[AI] Getting sensitive data:', fighterId);
    const { data, error } = await supabase.rpc('get_fighter_sensitive_data', {
      p_fighter_id: fighterId
    });
    if (error) throw error;
    return { success: true, data: Array.isArray(data) ? data[0] : data, message: 'Información sensible obtenida' };
  } catch (error) {
    console.error('[AI] getFighterSensitiveData error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', data: null };
  }
}

// Advanced Analysis Functions
async function generateFilteredReport(filters: any = {}) {
  try {
    console.log('[AI] Generating filtered report:', filters);
    const fightersResult = await advancedSearchFighters({ ...filters, limit: 1000 });
    const fighters = fightersResult.fighters || [];
    
    const stats: any = {
      total: fighters.length,
      por_genero: {},
      por_pais: {},
      por_peso: {},
      edad_promedio: 0,
      record_promedio: { victorias: 0, derrotas: 0 }
    };
    
    fighters.forEach((f: any) => {
      if (f.gender) stats.por_genero[f.gender] = (stats.por_genero[f.gender] || 0) + 1;
      if (f.country) stats.por_pais[f.country] = (stats.por_pais[f.country] || 0) + 1;
      if (f.weight_class) stats.por_peso[f.weight_class] = (stats.por_peso[f.weight_class] || 0) + 1;
      if (f.birthdate) {
        const age = new Date().getFullYear() - new Date(f.birthdate).getFullYear();
        stats.edad_promedio += age;
      }
      stats.record_promedio.victorias += f.record_wins || 0;
      stats.record_promedio.derrotas += f.record_losses || 0;
    });
    
    if (fighters.length > 0) {
      stats.edad_promedio = Math.round(stats.edad_promedio / fighters.length);
      stats.record_promedio.victorias = Math.round(stats.record_promedio.victorias / fighters.length);
      stats.record_promedio.derrotas = Math.round(stats.record_promedio.derrotas / fighters.length);
    }
    
    return {
      success: true,
      filters: filters,
      stats: stats,
      fighter_count: fighters.length,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('[AI] generateFilteredReport error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', stats: null };
  }
}

async function getTopFighters(criteria: string = 'wins', limit: number = 10) {
  try {
    console.log('[AI] Getting top fighters:', criteria);
    let orderBy = 'record_wins';
    if (criteria === 'losses') orderBy = 'record_losses';
    if (criteria === 'draws') orderBy = 'record_draws';
    
    const { data, error } = await supabase
      .from('fighter_profiles')
      .select('id, first_name, last_name, nickname, country, weight_class, record_wins, record_losses, record_draws, avatar_url')
      .order(orderBy, { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return { success: true, criteria: criteria, fighters: data };
  } catch (error) {
    console.error('[AI] getTopFighters error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', fighters: [] };
  }
}

async function findSimilarFighters(fighterId: string) {
  try {
    console.log('[AI] Finding similar fighters:', fighterId);
    const { data: reference } = await supabase
      .from('fighter_profiles')
      .select('*')
      .eq('id', fighterId)
      .single();
    
    if (!reference) return { success: false, error: 'Peleador no encontrado' };
    
    const { data, error } = await supabase
      .from('fighter_profiles')
      .select('id, first_name, last_name, weight_class, gender, country, record_wins, record_losses')
      .eq('weight_class', reference.weight_class)
      .eq('gender', reference.gender)
      .neq('id', fighterId)
      .limit(10);
    
    if (error) throw error;
    return {
      success: true,
      reference: `${reference.first_name} ${reference.last_name}`,
      similar_fighters: data
    };
  } catch (error) {
    console.error('[AI] findSimilarFighters error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error', similar_fighters: [] };
  }
}

// Function calling handler
async function handleFunctionCall(functionName: string, args: any) {
  console.log(`Calling function: ${functionName}`, args);
  
  try {
    switch (functionName) {
      case 'search_fighters':
        return await searchFighters(args.criteria || {});
      case 'advanced_search_fighters':
        return await advancedSearchFighters(args.criteria || {});
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
      case 'get_pending_licenses':
        return await getPendingLicenses();
      case 'approve_license':
        return await approveLicense(args.license_id, args.level);
      case 'suspend_license':
        return await suspendLicense(args.license_id, args.reason, args.until);
      case 'reactivate_license':
        return await reactivateLicense(args.license_id);
      case 'create_fighter':
        return await createFighter(args.fighter_data);
      case 'update_fighter_complete':
        return await updateFighterComplete(args.fighter_id, args.updates);
      case 'delete_fighter':
        return await deleteFighter(args.fighter_id);
      case 'get_fighter_sensitive_data':
        return await getFighterSensitiveData(args.fighter_id);
      case 'generate_filtered_report':
        return await generateFilteredReport(args.filters);
      case 'get_top_fighters':
        return await getTopFighters(args.criteria, args.limit);
      case 'find_similar_fighters':
        return await findSimilarFighters(args.fighter_id);
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
  const corsHeaders = buildCorsHeaders(req);
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
          ? 'Buscar peleadores con criterios básicos'
          : 'Search fighters with basic criteria',
        parameters: {
          type: 'object',
          properties: {
            criteria: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                country: { type: 'string' },
                weight_class: { type: 'string' }
              }
            }
          }
        }
      },
      {
        name: 'advanced_search_fighters',
        description: language === 'es'
          ? 'Búsqueda avanzada de peleadores con múltiples criterios: nombre, apellido, fecha de nacimiento, edad, licencia, documento, país, categoría, récord'
          : 'Advanced fighter search with multiple criteria: name, surname, birthdate, age, license, document, country, category, record',
        parameters: {
          type: 'object',
          properties: {
            criteria: {
              type: 'object',
              properties: {
                fighter_id: { type: 'string', description: 'Fighter UUID' },
                license_number: { type: 'string', description: 'License number' },
                document_number: { type: 'string', description: 'ID document' },
                first_name: { type: 'string', description: 'First name' },
                last_name: { type: 'string', description: 'Last name' },
                full_name: { type: 'string', description: 'Full name' },
                nickname: { type: 'string', description: 'Nickname' },
                birthdate: { type: 'string', description: 'Exact date (YYYY-MM-DD)' },
                birthdate_from: { type: 'string' },
                birthdate_to: { type: 'string' },
                age_min: { type: 'number' },
                age_max: { type: 'number' },
                country: { type: 'string' },
                gender: { type: 'string' },
                weight_class: { type: 'string' },
                discipline: { type: 'string' },
                min_wins: { type: 'number' },
                undefeated: { type: 'boolean' },
                license_status: { type: 'string' },
                limit: { type: 'number' }
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
          ? 'Generar reporte completo del sistema con todas las estadísticas'
          : 'Generate comprehensive system report',
        parameters: {
          type: 'object',
          properties: {
            filters: { type: 'object' }
          }
        }
      },
      {
        name: 'get_pending_licenses',
        description: language === 'es' ? 'Obtener licencias pendientes de aprobación' : 'Get pending licenses',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'approve_license',
        description: language === 'es' ? 'Aprobar una licencia (AMATEUR o PROFESSIONAL)' : 'Approve a license',
        parameters: {
          type: 'object',
          properties: {
            license_id: { type: 'string' },
            level: { type: 'string', enum: ['AMATEUR', 'PROFESSIONAL'] }
          },
          required: ['license_id']
        }
      },
      {
        name: 'suspend_license',
        description: language === 'es' ? 'Suspender una licencia' : 'Suspend a license',
        parameters: {
          type: 'object',
          properties: {
            license_id: { type: 'string' },
            reason: { type: 'string' },
            until: { type: 'string', description: 'YYYY-MM-DD' }
          },
          required: ['license_id', 'reason']
        }
      },
      {
        name: 'reactivate_license',
        description: language === 'es' ? 'Reactivar una licencia suspendida' : 'Reactivate a license',
        parameters: {
          type: 'object',
          properties: {
            license_id: { type: 'string' }
          },
          required: ['license_id']
        }
      },
      {
        name: 'create_fighter',
        description: language === 'es' ? 'Crear un nuevo perfil de peleador' : 'Create a new fighter',
        parameters: {
          type: 'object',
          properties: {
            fighter_data: {
              type: 'object',
              properties: {
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                birthdate: { type: 'string' },
                country: { type: 'string' },
                gender: { type: 'string' },
                weight_class: { type: 'string' }
              },
              required: ['first_name', 'last_name', 'country', 'gender', 'weight_class']
            }
          },
          required: ['fighter_data']
        }
      },
      {
        name: 'update_fighter_complete',
        description: language === 'es' ? 'Actualizar completamente un perfil de peleador' : 'Update fighter completely',
        parameters: {
          type: 'object',
          properties: {
            fighter_id: { type: 'string' },
            updates: { type: 'object' }
          },
          required: ['fighter_id', 'updates']
        }
      },
      {
        name: 'delete_fighter',
        description: language === 'es' ? 'Eliminar un peleador del sistema' : 'Delete a fighter',
        parameters: {
          type: 'object',
          properties: {
            fighter_id: { type: 'string' }
          },
          required: ['fighter_id']
        }
      },
      {
        name: 'get_fighter_sensitive_data',
        description: language === 'es' ? 'Obtener información sensible de un peleador' : 'Get fighter sensitive data',
        parameters: {
          type: 'object',
          properties: {
            fighter_id: { type: 'string' }
          },
          required: ['fighter_id']
        }
      },
      {
        name: 'generate_filtered_report',
        description: language === 'es' ? 'Generar reporte personalizado con filtros' : 'Generate filtered report',
        parameters: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              properties: {
                country: { type: 'string' },
                weight_class: { type: 'string' },
                gender: { type: 'string' },
                age_min: { type: 'number' },
                age_max: { type: 'number' }
              }
            }
          }
        }
      },
      {
        name: 'get_top_fighters',
        description: language === 'es' ? 'Top peleadores por criterio' : 'Get top fighters',
        parameters: {
          type: 'object',
          properties: {
            criteria: { type: 'string', enum: ['wins', 'losses', 'draws'] },
            limit: { type: 'number' }
          },
          required: ['criteria']
        }
      },
      {
        name: 'find_similar_fighters',
        description: language === 'es' ? 'Buscar peleadores similares' : 'Find similar fighters',
        parameters: {
          type: 'object',
          properties: {
            fighter_id: { type: 'string' }
          },
          required: ['fighter_id']
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